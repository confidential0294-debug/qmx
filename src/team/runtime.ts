/**
 * QMX Team Runtime - omx-style implementation (BUG-FIXED)
 */

import { resolve, join } from 'node:path';
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
const MODEL_INSTRUCTIONS_FILE_ENV = 'QMX_MODEL_INSTRUCTIONS_FILE';
const previousModelInstructionsFileByTeam = new Map();

function setTeamModelInstructionsFile(teamName: string, filePath: string): void {
  if (!previousModelInstructionsFileByTeam.has(teamName)) {
    previousModelInstructionsFileByTeam.set(teamName, process.env[MODEL_INSTRUCTIONS_FILE_ENV]);
  }
  process.env[MODEL_INSTRUCTIONS_FILE_ENV] = filePath;
}

function restoreTeamModelInstructionsFile(teamName: string): void {
  if (!previousModelInstructionsFileByTeam.has(teamName))
    return;
  const previous = previousModelInstructionsFileByTeam.get(teamName);
  previousModelInstructionsFileByTeam.delete(teamName);
  if (typeof previous === 'string') {
    process.env[MODEL_INSTRUCTIONS_FILE_ENV] = previous;
    return;
  }
  delete process.env[MODEL_INSTRUCTIONS_FILE_ENV];
}

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
  return process.env.QMX_TEAM_STATE_ROOT || join(leaderCwd, '.qmx', 'state');
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
  // Add --prompt-interactive for auto-execution of worker prompts
  args.push('--prompt-interactive');
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
  
  // Validate inputs
  if (workerCount < 1 || workerCount > DEFAULT_MAX_WORKERS) {
    throw new Error(`Invalid workerCount: ${workerCount}. Must be 1-${DEFAULT_MAX_WORKERS}`);
  }
  if (!task || task.trim().length === 0) {
    throw new Error('Task description cannot be empty');
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
    setTeamModelInstructionsFile(sanitized, workerInstructionsPath);
    
    const workerStartups: WorkerStartup[] = Array.from({ length: workerCount }, () => ({
      cwd: leaderCwd,
      env: {
        QMX_TEAM_STATE_ROOT: teamStateRoot,
        QMX_LEADER_CWD: leaderCwd,
      },
    }));
    
    // Write inbox files BEFORE creating tmux session
    for (let i = 1; i <= workerCount; i++) {
      const workerName = `worker-${i}`;
      const inbox = generateInitialInbox(workerName, sanitized, agentType, task);
      await writeWorkerInbox(sanitized, workerName, inbox, leaderCwd);
    }
    
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
    
    // Wait for workers to initialize
    sleepMs(1500);
    
    // Send trigger to each worker
    for (let i = 1; i <= workerCount; i++) {
      const workerName = `worker-${i}`;
      const workerConfig = config.workers[i - 1];
      const paneId = workerConfig?.pane_id;
      
      if (!paneId) continue;
      
      // Send trigger to load worker skill
      const taskTrigger = `You are ${workerName} on team ${sanitized}. Your task: ${task.substring(0, 100)}. Read your inbox at .qmx/state/team/${sanitized}/workers/${workerName}/inbox.md and execute the instructions step by step.`;
      
      try {
        sendToWorker(sessionName, i, paneId, taskTrigger);
      } catch (err) {
        console.error(`Failed to send task to ${workerName}:`, err);
      }
      
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
    restoreTeamModelInstructionsFile(sanitized);
    throw new Error(`Failed to start team: ${error}`);
  } finally {
    restoreTeamModelInstructionsFile(sanitized);
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
      worker_cli: 'qwen',
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
    
    // Send SHORT task trigger (<200 chars)
    const shortDesc = task.description.length > 100 ? task.description.substring(0, 97) + '...' : task.description;
    const taskTrigger = `NEW TASK: ${shortDesc}. Please read your inbox file and execute the instructions. Run: cat .qmx/state/team/${sanitized}/workers/${workerName}/inbox.md`;
    
    if (config.tmux_session && worker.pane_id) {
      try {
        sendToWorker(config.tmux_session, worker.index, worker.pane_id, taskTrigger);
      } catch (err) {
        console.error(`Failed to send task to ${workerName}:`, err);
      }
    }
    
  } catch (error) {
    await releaseTaskClaim(sanitized, taskId, claim.claimToken!, workerName, cwd);
    throw error;
  }
}

export async function shutdownTeam(
  teamName: string,
  cwd: string,
  _options: { force?: boolean } = {}
): Promise<void> {
  const sanitized = sanitizeTeamName(teamName);
  
  // Try to find config in multiple locations
  let config = await readTeamConfig(sanitized, cwd);
  let teamCwd = cwd;
  
  // If not found, try common locations
  if (!config) {
    // Try home directory
    const homeCwd = process.env.HOME || process.env.USERPROFILE || cwd;
    config = await readTeamConfig(sanitized, homeCwd);
    if (config) teamCwd = homeCwd;
  }
  
  // Try the config's stored cwd if available from another location
  if (!config) {
    // Last resort: search in /home/twisted/qmx
    const qmxCwd = '/home/twisted/qmx';
    config = await readTeamConfig(sanitized, qmxCwd);
    if (config) teamCwd = qmxCwd;
  }
  
  if (!config) {
    return;
  }
  
  // Always force cleanup - user explicitly requested shutdown
  // Skip task status checks to ensure cleanup always happens
  // Use the cwd where we found the config
  teamCwd = config.cwd || teamCwd;
  
  for (const worker of config.workers) {
    try {
      const inbox = generateShutdownInbox(sanitized, worker.name);
      await writeWorkerInbox(sanitized, worker.name, inbox, teamCwd);
      
      if (config.tmux_session && worker.pane_id) {
        const triggerMessage = `SHUTDOWN: Tasks complete. Acknowledge and exit.`;
        try {
          sendToWorker(config.tmux_session, worker.index, worker.pane_id, triggerMessage);
        } catch (err) {
          console.error(`Failed to send shutdown to ${worker.name}:`, err);
        }
      }
    } catch {
      // Best effort
    }
  }
  
  sleepMs(1000);
  
  // Kill worker panes directly
  if (config.tmux_session) {
    const { execFileSync } = await import('node:child_process');
    for (const worker of config.workers) {
      if (worker.pane_id) {
        try {
          execFileSync('tmux', ['kill-pane', '-t', worker.pane_id], { stdio: 'ignore' });
        } catch {
          // Pane might already be dead
        }
      }
    }
  }
  
  // Only destroy session if it's a dedicated team session (starts with qmx-team-)
  if (config.tmux_session && config.tmux_session.startsWith('qmx-team-')) {
    destroyTeamSession(config.tmux_session);
  }
  // Note: If using shared session (0:0), we just clean up panes via hooks
  
  await cleanupTeamState(sanitized, teamCwd);
  removeTeamWorkerInstructionsFile(sanitized, teamCwd);
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
  try {
    await mkdir(dir, { recursive: true });
    const path = join(dir, 'inbox.md');
    await writeFile(path, content, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to write inbox for ${workerName}: ${err}`);
  }
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
  
  const shortBody = body.substring(0, 100);
  const triggerMessage = `MSG from ${fromWorker}: ${shortBody}`;
  
  try {
    sendToWorker(config.tmux_session, worker.index, worker.pane_id, triggerMessage);
  } catch (err) {
    console.error(`Failed to send message to ${toWorker}:`, err);
  }
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
  if (!Number.isFinite(ms) || ms < 0) ms = 100;
  const safeMs = Math.min(ms, 10000);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, safeMs);
}

export { isTmuxAvailable, getTmuxVersion, sanitizeTeamName, listTeamSessions };
