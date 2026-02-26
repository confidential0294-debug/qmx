/**
 * QMX Team Runtime - omx-style implementation
 */

import { resolve } from 'node:path';
import {
  TeamConfig,
  WorkerConfig,
  TeamTask,
  WorkerStatus,
  WorkerHeartbeat,
  saveTeamConfig,
  readTeamConfig,
  createTeamTask,
  readTask,
  updateTask,
  listTasks,
  sendMailboxMessage,
  teamDir,
  workerDir,
  readWorkerStatus,
  readWorkerHeartbeat,
} from './team-ops.js';
import {
  generateWorkerOverlay,
  generateInitialInbox,
  generateTaskAssignmentInbox,
  generateShutdownInbox,
  generateTriggerMessage,
  generateMailboxTriggerMessage,
  writeTeamWorkerInstructionsFile,
  removeTeamWorkerInstructionsFile,
} from './worker-bootstrap.js';
import {
  isTmuxAvailable,
  getTmuxVersion,
  createTeamSession,
  destroyTeamSession,
  listTeamSessions,
  sendToWorker,
  sanitizeTeamName,
  type WorkerStartup,
} from './tmux-session.js';

const TEAM_LOW_COMPLEXITY_DEFAULT_MODEL = 'qwen-coder-plus';
const DEFAULT_MAX_WORKERS = 10;

export interface TeamRuntime {
  teamName: string;
  sanitizedName: string;
  sessionName: string;
  config: TeamConfig;
  cwd: string;
}

export interface TeamSnapshot {
  teamName: string;
  workerCount: number;
  workers: Array<{
    name: string;
    alive: boolean;
    status: WorkerStatus | null;
    heartbeat: WorkerHeartbeat | null;
    assignedTasks: string[];
  }>;
  tasks: {
    total: number;
    pending: number;
    blocked: number;
    in_progress: number;
    completed: number;
    failed: number;
    items: TeamTask[];
  };
  allTasksTerminal: boolean;
  deadWorkers: string[];
  nonReportingWorkers: string[];
}

export interface TeamStartOptions {
  yolo?: boolean;
  model?: string;
}

export { TEAM_LOW_COMPLEXITY_DEFAULT_MODEL };

export function resolveCanonicalTeamStateRoot(leaderCwd: string): string {
  return process.env.QMX_TEAM_STATE_ROOT || joinPath(leaderCwd, '.qmx', 'state');
}

function joinPath(...paths: string[]): string {
  const { join } = require('node:path');
  return join(...paths);
}

export function resolveWorkerLaunchArgsFromEnv(
  env: NodeJS.ProcessEnv,
  _agentType: string,
  inheritedLeaderModel?: string
): string[] {
  const args: string[] = [];
  const model = env.QMX_WORKER_MODEL || inheritedLeaderModel;
  if (model) {
    args.push('--model', model);
  }
  if (env.QMX_YOLO === '1' || !env.QMX_YOLO) {
    args.push('-y');
  }
  return args;
}

export async function startTeam(
  teamName: string,
  task: string,
  agentType: string,
  workerCount: number,
  tasks: Array<{
    subject: string;
    description: string;
    owner?: string;
    blocked_by?: string[];
  }>,
  cwd: string,
  options: TeamStartOptions = {}
): Promise<TeamRuntime> {
  if (process.env.QMX_TEAM_WORKER) {
    throw new Error('nested_team_disallowed');
  }
  
  const workerLaunchMode: 'interactive' | 'prompt' = 'interactive';
  
  if (workerLaunchMode === 'interactive') {
    if (!isTmuxAvailable()) {
      throw new Error('Team mode requires tmux. Install with: apt install tmux / brew install tmux');
    }
    if (!process.env.TMUX) {
      throw new Error('Team mode requires running inside tmux');
    }
  }
  
  const leaderCwd = resolve(cwd);
  const sanitized = sanitizeTeamName(teamName);
  const teamStateRoot = resolveCanonicalTeamStateRoot(leaderCwd);
  const workspaceMode: 'single' | 'worktree' = 'single';
  
  const leaderSessionId = await resolveLeaderSessionId(leaderCwd);
  const activeTeams = await findActiveTeams(leaderCwd, leaderSessionId);
  if (activeTeams.length > 0) {
    throw new Error(`leader_session_conflict: active team exists (${activeTeams.join(', ')})`);
  }
  
  let sessionName = `qmx-team-${sanitized}`;
  const overlay = generateWorkerOverlay(sanitized);
  let workerInstructionsPath: string | null = null;
  let sessionCreated = false;
  let config: TeamConfig | null = null;
  
  const workerLaunchArgs = resolveWorkerLaunchArgsFromEnv(process.env, agentType, options.model);
  
  try {
    config = await initTeamState(
      sanitized,
      task,
      agentType,
      workerCount,
      leaderCwd,
      DEFAULT_MAX_WORKERS,
      {
        worker_launch_mode: workerLaunchMode,
        display_mode: 'split_pane',
      },
      {
        leader_cwd: leaderCwd,
        team_state_root: teamStateRoot,
        workspace_mode: workspaceMode,
      }
    );
    
    if (!config) {
      throw new Error('failed to initialize team config');
    }
    
    for (const t of tasks) {
      await createTeamTask(sanitized, {
        subject: t.subject,
        description: t.description,
        status: 'pending',
        owner: t.owner,
        blocked_by: t.blocked_by || [],
        requires_code_change: true,
      }, leaderCwd);
    }
    
    workerInstructionsPath = await writeTeamWorkerInstructionsFile(sanitized, leaderCwd, overlay);
    
    const workerStartups: WorkerStartup[] = Array.from({ length: workerCount }, () => ({
      cwd: leaderCwd,
      env: {
        QMX_TEAM_STATE_ROOT: teamStateRoot,
        QMX_LEADER_CWD: leaderCwd,
      },
    }));
    
    if (workerLaunchMode === 'interactive') {
      const createdSession = createTeamSession(sanitized, workerCount, leaderCwd, workerLaunchArgs, workerStartups);
      sessionName = createdSession.name;
      sessionCreated = true;
      
      config.tmux_session = createdSession.name;
      config.leader_pane_id = createdSession.leaderPaneId;
      config.hud_pane_id = createdSession.hudPaneId;
      config.resize_hook_name = createdSession.resizeHookName;
      config.resize_hook_target = createdSession.resizeHookTarget;
      
      for (let i = 0; i < createdSession.workerPaneIds.length; i++) {
        config.workers[i].pane_id = createdSession.workerPaneIds[i];
      }
    }
    
    await saveTeamConfig(config, leaderCwd);
    
    for (let i = 1; i <= workerCount; i++) {
      const workerName = `worker-${i}`;
      const workerConfig = config.workers[i - 1];
      const paneId = workerConfig.pane_id;
      
      if (!paneId) continue;
      
      const inbox = generateInitialInbox(workerName, sanitized, agentType, task);
      await writeWorkerInbox(sanitized, workerName, inbox, leaderCwd);
      
      const triggerMessage = generateTriggerMessage(workerName, sanitized);
      sendToWorker(sessionName, i, paneId, triggerMessage);
      
      sleepMs(200);
    }
    
    return {
      teamName,
      sanitizedName: sanitized,
      sessionName,
      config,
      cwd: leaderCwd,
    };
    
  } catch (error) {
    if (sessionCreated) {
      destroyTeamSession(sessionName);
    }
    if (workerInstructionsPath) {
      removeTeamWorkerInstructionsFile(sanitized, leaderCwd);
    }
    throw new Error(`Failed to start team: ${error}`);
  }
}

async function initTeamState(
  teamName: string,
  task: string,
  agentType: string,
  workerCount: number,
  leaderCwd: string,
  maxWorkers: number,
  env: {
    worker_launch_mode: 'interactive' | 'prompt';
    display_mode: 'split_pane' | 'auto';
  },
  paths: {
    leader_cwd: string;
    team_state_root: string;
    workspace_mode: 'single' | 'worktree';
  }
): Promise<TeamConfig | null> {
  const workers: WorkerConfig[] = [];
  
  for (let i = 1; i <= workerCount; i++) {
    workers.push({
      name: `worker-${i}`,
      index: i,
      pane_id: null,
      pid: null,
      worker_cli: 'qwx',
      cwd: leaderCwd,
    });
  }
  
  const config: TeamConfig = {
    name: teamName,
    task,
    agentType,
    workerCount,
    cwd: leaderCwd,
    leader_cwd: paths.leader_cwd,
    team_state_root: paths.team_state_root,
    tmux_session: null,
    leader_pane_id: null,
    hud_pane_id: null,
    resize_hook_name: null,
    resize_hook_target: null,
    worker_launch_mode: env.worker_launch_mode,
    display_mode: env.display_mode,
    workspace_mode: paths.workspace_mode,
    workers,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    max_workers: maxWorkers,
  };
  
  await saveTeamConfig(config, leaderCwd);
  return config;
}

export async function monitorTeam(teamName: string, cwd: string): Promise<TeamSnapshot | null> {
  const config = await readTeamConfig(teamName, cwd);
  if (!config) return null;
  
  const sanitized = sanitizeTeamName(teamName);
  const tasks = await listTasks(sanitized, cwd);
  
  const workers: TeamSnapshot['workers'] = [];
  const deadWorkers: string[] = [];
  const nonReportingWorkers: string[] = [];
  
  for (const worker of config.workers) {
    const status = await readWorkerStatus(sanitized, worker.name, cwd);
    const heartbeat = await readWorkerHeartbeat(sanitized, worker.name, cwd);
    
    const alive = heartbeat ? heartbeat.alive : false;
    if (!alive) deadWorkers.push(worker.name);
    if (!status && !heartbeat) nonReportingWorkers.push(worker.name);
    
    const assignedTasks = tasks
      .filter((t: TeamTask) => t.owner === worker.name && t.status !== 'completed')
      .map((t: TeamTask) => t.id);
    
    workers.push({
      name: worker.name,
      alive,
      status,
      heartbeat,
      assignedTasks,
    });
  }
  
  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter((t: TeamTask) => t.status === 'pending').length,
    blocked: tasks.filter((t: TeamTask) => t.status === 'blocked').length,
    in_progress: tasks.filter((t: TeamTask) => t.status === 'in_progress').length,
    completed: tasks.filter((t: TeamTask) => t.status === 'completed').length,
    failed: tasks.filter((t: TeamTask) => t.status === 'failed').length,
  };
  
  const allTasksTerminal = taskCounts.pending === 0 && taskCounts.in_progress === 0 && taskCounts.blocked === 0;
  
  return {
    teamName,
    workerCount: config.workerCount,
    workers,
    tasks: {
      ...taskCounts,
      items: tasks,
    },
    allTasksTerminal,
    deadWorkers,
    nonReportingWorkers,
  };
}

export async function assignTask(
  teamName: string,
  workerName: string,
  taskId: string,
  cwd: string
): Promise<void> {
  const sanitized = sanitizeTeamName(teamName);
  const task = await readTask(sanitized, taskId, cwd);
  
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }
  
  const config = await readTeamConfig(sanitized, cwd);
  if (!config) {
    throw new Error(`Team ${sanitized} not found`);
  }
  
  const worker = config.workers.find(w => w.name === workerName);
  if (!worker) {
    throw new Error(`Worker ${workerName} not found`);
  }
  
  const claim = await claimTask(sanitized, taskId, workerName, task.version, cwd);
  if (!claim.ok) {
    throw new Error(`Failed to claim task: ${claim.error}`);
  }
  
  try {
    const inbox = generateTaskAssignmentInbox(workerName, sanitized, taskId, task.description);
    await writeWorkerInbox(sanitized, workerName, inbox, cwd);
    
    const triggerMessage = generateTriggerMessage(workerName, sanitized);
    if (config.tmux_session && worker.pane_id) {
      sendToWorker(config.tmux_session, worker.index, worker.pane_id, triggerMessage);
    }
    
  } catch (error) {
    await releaseTaskClaim(sanitized, taskId, claim.claimToken!, workerName, cwd);
    throw error;
  }
}

export async function shutdownTeam(
  teamName: string,
  cwd: string,
  options: { force?: boolean } = {}
): Promise<void> {
  const sanitized = sanitizeTeamName(teamName);
  const config = await readTeamConfig(sanitized, cwd);
  
  if (!config) {
    await cleanupTeamState(sanitized, cwd);
    return;
  }
  
  if (!options.force) {
    const allTasks = await listTasks(sanitized, cwd);
    const pending = allTasks.filter((t: TeamTask) => t.status === 'pending').length;
    const blocked = allTasks.filter((t: TeamTask) => t.status === 'blocked').length;
    const inProgress = allTasks.filter((t: TeamTask) => t.status === 'in_progress').length;
    const failed = allTasks.filter((t: TeamTask) => t.status === 'failed').length;
    
    if (pending > 0 || blocked > 0 || inProgress > 0 || failed > 0) {
      throw new Error(`shutdown_gate_blocked:pending=${pending},blocked=${blocked},in_progress=${inProgress},failed=${failed}`);
    }
  }
  
  for (const worker of config.workers) {
    try {
      const inbox = generateShutdownInbox(sanitized, worker.name);
      await writeWorkerInbox(sanitized, worker.name, inbox, cwd);
      
      if (config.tmux_session && worker.pane_id) {
        const triggerMessage = generateTriggerMessage(worker.name, sanitized);
        sendToWorker(config.tmux_session, worker.index, worker.pane_id, triggerMessage);
      }
    } catch {
      // Best effort
    }
  }
  
  sleepMs(1000);
  
  if (config.tmux_session) {
    destroyTeamSession(config.tmux_session);
  }
  
  await cleanupTeamState(sanitized, cwd);
  removeTeamWorkerInstructionsFile(sanitized, cwd);
}

export async function resumeTeam(teamName: string, cwd: string): Promise<TeamRuntime | null> {
  const sanitized = sanitizeTeamName(teamName);
  const config = await readTeamConfig(sanitized, cwd);
  
  if (!config) {
    return null;
  }
  
  if (config.tmux_session) {
    try {
      const { execFileSync } = await import('node:child_process');
      execFileSync('tmux', ['has-session', '-t', config.tmux_session], { stdio: 'ignore' });
    } catch {
      return null;
    }
  }
  
  return {
    teamName,
    sanitizedName: sanitized,
    sessionName: config.tmux_session || `qmx-team-${sanitized}`,
    config,
    cwd,
  };
}

async function claimTask(
  teamName: string,
  taskId: string,
  workerName: string,
  version: number,
  cwd: string
): Promise<{ ok: boolean; claimToken?: string; error?: string }> {
  const task = await readTask(teamName, taskId, cwd);
  if (!task) {
    return { ok: false, error: 'task_not_found' };
  }
  
  if (task.status === 'completed' || task.status === 'failed') {
    return { ok: false, error: 'task_terminal' };
  }
  
  if (task.owner && task.owner !== workerName) {
    return { ok: false, error: 'task_claimed' };
  }
  
  task.owner = workerName;
  task.status = 'in_progress';
  task.version = version + 1;
  task.updated_at = new Date().toISOString();
  
  await updateTask(teamName, task, cwd);
  
  return { ok: true, claimToken: String(task.version) };
}

async function releaseTaskClaim(
  teamName: string,
  taskId: string,
  _claimToken: string,
  workerName: string,
  cwd: string
): Promise<{ ok: boolean; error?: string }> {
  const task = await readTask(teamName, taskId, cwd);
  if (!task) {
    return { ok: false, error: 'task_not_found' };
  }
  
  if (task.owner !== workerName) {
    return { ok: false, error: 'not_owner' };
  }
  
  task.owner = undefined;
  task.status = 'pending';
  task.updated_at = new Date().toISOString();
  
  await updateTask(teamName, task, cwd);
  
  return { ok: true };
}

async function writeWorkerInbox(
  teamName: string,
  workerName: string,
  content: string,
  cwd: string
): Promise<void> {
  const { writeFile, mkdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  
  const dir = workerDir(teamName, workerName, cwd);
  await mkdir(dir, { recursive: true });
  
  const path = join(dir, 'inbox.md');
  await writeFile(path, content, 'utf-8');
}

export async function sendWorkerMessage(
  teamName: string,
  fromWorker: string,
  toWorker: string,
  body: string,
  cwd: string
): Promise<void> {
  const sanitized = sanitizeTeamName(teamName);
  await sendMailboxMessage(sanitized, fromWorker, toWorker, body, cwd);
  
  const config = await readTeamConfig(sanitized, cwd);
  if (!config) return;
  
  const worker = config.workers.find(w => w.name === toWorker);
  if (!worker || !worker.pane_id || !config.tmux_session) return;
  
  const triggerMessage = generateMailboxTriggerMessage(toWorker, sanitized, 1);
  sendToWorker(config.tmux_session, worker.index, worker.pane_id, triggerMessage);
}

export async function broadcastWorkerMessage(
  teamName: string,
  fromWorker: string,
  body: string,
  cwd: string
): Promise<void> {
  const sanitized = sanitizeTeamName(teamName);
  const config = await readTeamConfig(sanitized, cwd);
  if (!config) return;
  
  for (const worker of config.workers) {
    if (worker.name !== fromWorker) {
      await sendWorkerMessage(teamName, fromWorker, worker.name, body, cwd);
    }
  }
}

async function resolveLeaderSessionId(_leaderCwd: string): Promise<string> {
  try {
    const { execFileSync } = await import('node:child_process');
    const output = execFileSync('tmux', ['display-message', '-p', '#S'], {
      encoding: 'utf-8',
    });
    return output.trim();
  } catch {
    return `unknown-${Date.now()}`;
  }
}

async function findActiveTeams(leaderCwd: string, _leaderSessionId: string): Promise<string[]> {
  const sessions = listTeamSessions();
  const active: string[] = [];
  
  for (const session of sessions) {
    const name = session.replace('qmx-team-', '');
    const config = await readTeamConfig(name, leaderCwd);
    if (config && config.tmux_session === session) {
      active.push(name);
    }
  }
  
  return active;
}

async function cleanupTeamState(teamName: string, cwd: string): Promise<void> {
  const { rm } = await import('node:fs/promises');
  const dir = teamDir(teamName, cwd);
  await rm(dir, { recursive: true, force: true }).catch(() => {});
}

function sleepMs(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export { isTmuxAvailable, getTmuxVersion, sanitizeTeamName, listTeamSessions };
