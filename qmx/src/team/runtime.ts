/**
 * QMX Team Runtime
 * 
 * Manages team lifecycle, worker coordination, and task distribution.
 * Uses omx-style inbox file + tmux send-keys for task delivery.
 */

import { execSync, execFileSync, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';

export interface TeamConfig {
  name: string;
  role: string;
  workerCount: number;
  task: string;
  cwd: string;
  yolo?: boolean;
}

export interface TeamState {
  name: string;
  role: string;
  workerCount: number;
  status: 'created' | 'starting' | 'running' | 'completed' | 'failed' | 'cancelled';
  workers: WorkerState[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkerState {
  id: string;
  paneId: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  task?: string;
}

const QMX_DIR = join(process.cwd(), '.qmx');
const TEAMS_DIR = join(QMX_DIR, 'state', 'teams');

// ============================================================================
// TMUX Utilities
// ============================================================================

/**
 * Check if tmux is available
 */
export function isTmuxAvailable(): boolean {
  try {
    execSync('tmux -V', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get tmux version
 */
export function getTmuxVersion(): string {
  try {
    const output = execSync('tmux -V', { encoding: 'utf-8' });
    return output.replace('tmux ', '').trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Run tmux command and return result
 */
function runTmux(args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const result = spawnSync('tmux', args, { encoding: 'utf-8' });
  if (result.error) {
    return { ok: false, stdout: '', stderr: result.error.message };
  }
  if (result.status !== 0) {
    return { ok: false, stdout: '', stderr: (result.stderr || '').trim() || `tmux exited ${result.status}` };
  }
  return { ok: true, stdout: (result.stdout || '').trim(), stderr: '' };
}

/**
 * List panes in a tmux target
 */
function listPanes(target: string): Array<{ paneId: string; currentCommand: string; startCommand: string }> {
  const result = runTmux(['list-panes', '-t', target, '-F', '#{pane_id}\t#{pane_current_command}\t#{pane_start_command}']);
  if (!result.ok) return [];
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [paneId = '', currentCommand = '', startCommand = ''] = line.split('\t');
      return { paneId, currentCommand, startCommand };
    })
    .filter((pane) => pane.paneId.startsWith('%'));
}

/**
 * Get current tmux context (session:window pane_id)
 */
function getCurrentTmuxContext(): { sessionName: string; windowIndex: string; leaderPaneId: string } {
  const context = runTmux(['display-message', '-p', '#S:#I #{pane_id}']);
  if (!context.ok) {
    throw new Error(`failed to detect current tmux target: ${context.stderr}`);
  }
  const [sessionAndWindow = '', detectedLeaderPaneId = ''] = context.stdout.split(' ');
  const [sessionName, windowIndex] = (sessionAndWindow || '').split(':');
  if (!sessionName || !windowIndex || !detectedLeaderPaneId || !detectedLeaderPaneId.startsWith('%')) {
    throw new Error(`failed to parse current tmux target: ${context.stdout}`);
  }
  return { sessionName, windowIndex, leaderPaneId: detectedLeaderPaneId };
}

/**
 * Choose leader pane (avoid HUD panes)
 */
function chooseLeaderPane(panes: Array<{ paneId: string; startCommand: string }>, preferredPaneId: string): string {
  const preferred = panes.find((pane) => pane.paneId === preferredPaneId);
  if (preferred && !isHudWatchPane(preferred)) return preferred.paneId;
  const nonHud = panes.find((pane) => !isHudWatchPane(pane));
  if (nonHud) return nonHud.paneId;
  return preferredPaneId;
}

/**
 * Check if pane is HUD watch pane
 */
function isHudWatchPane(pane: { startCommand: string }): boolean {
  const start = pane.startCommand || '';
  return /\bqmx\b.*\bhud\b.*--watch/i.test(start);
}

/**
 * Sleep for milliseconds
 */
function sleepMs(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Shell quote a single value
 */
function shellQuoteSingle(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

// ============================================================================
// Worker Command Building
// ============================================================================

/**
 * Build qwx worker startup command with environment variables
 */
export function buildWorkerStartupCommand(
  teamName: string,
  workerIndex: number,
  cwd: string,
  yoloMode: boolean = true
): string {
  const envVars = {
    QMX_TEAM_WORKER: `${teamName}/worker-${workerIndex}`,
    QMX_TEAM_STATE_ROOT: join(cwd, '.qmx', 'state'),
  };

  const envParts = Object.entries(envVars).map(([key, value]) => `${key}=${shellQuoteSingle(value)}`).join(' ');
  const approvalFlag = yoloMode ? '-y' : '';
  
  // qwx command - will receive task via inbox file
  const qwxCommand = `qwx ${approvalFlag}`.trim();
  
  return `env ${envParts} ${qwxCommand}`;
}

// ============================================================================
// Inbox File Management (omx-style)
// ============================================================================

/**
 * Get worker directory path
 */
function workerDir(teamName: string, workerName: string, cwd: string): string {
  return join(cwd, '.qmx', 'state', 'team', teamName, 'workers', workerName);
}

/**
 * Write worker inbox file atomically
 */
export async function writeWorkerInbox(
  teamName: string,
  workerName: string,
  task: string,
  cwd: string
): Promise<string> {
  const workerPath = workerDir(teamName, workerName, cwd);
  await mkdir(workerPath, { recursive: true });
  
  const inboxPath = join(workerPath, 'inbox.md');
  const inboxContent = generateInboxContent(workerName, teamName, task);
  
  await writeFile(inboxPath, inboxContent, 'utf-8');
  return inboxPath;
}

/**
 * Generate inbox file content
 */
function generateInboxContent(workerName: string, teamName: string, task: string): string {
  return `# Worker Assignment: ${workerName}

**Team:** ${teamName}
**Worker:** ${workerName}

## Your Task

${task}

## Instructions

1. Read and understand the task above
2. Execute the task using qwx tools
3. Report completion with evidence
4. Use \`-y\` mode for auto-approval (already set in environment)

## Environment

- \`QMX_TEAM_WORKER=${teamName}/${workerName}\`
- \`QMX_TEAM_STATE_ROOT=.qmx/state\`
`;
}

/**
 * Generate trigger message for tmux send-keys (<200 chars)
 */
export function generateTriggerMessage(workerName: string, teamName: string): string {
  return `Read and follow instructions in .qmx/state/team/${teamName}/workers/${workerName}/inbox.md`;
}

// ============================================================================
// Task Delivery (omx-style: inbox + send-keys)
// ============================================================================

/**
 * Send task to worker via tmux send-keys
 */
export function sendTaskToWorker(
  sessionName: string,
  workerIndex: number,
  workerPaneId: string,
  triggerMessage: string
): void {
  const target = workerPaneId;
  
  // Step 1: Capture pane to check state
  const captured = runTmux(['capture-pane', '-t', target, '-p', '-S', '-80']);
  const paneContent = captured.ok ? captured.stdout : '';
  
  // Step 2: Check if pane is at prompt (simple heuristic)
  const isAtPrompt = paneContent.includes('$ ') || paneContent.includes('❯ ') || paneContent.includes('> ');
  
  // Step 3: If pane seems busy, send Ctrl+C to interrupt
  if (!isAtPrompt && paneContent.length > 50) {
    runTmux(['send-keys', '-t', target, 'C-c']);
    sleepMs(100);
  }
  
  // Step 4: Send trigger text
  runTmux(['send-keys', '-t', target, '-l', '--', triggerMessage]);
  
  // Step 5: Small delay for input buffer
  sleepMs(100);
  
  // Step 6: Send Enter to submit
  runTmux(['send-keys', '-t', target, 'C-m']);
}

// ============================================================================
// Team Session Management
// ============================================================================

/**
 * Create a new team session with workers in tmux panes
 */
export async function createTeamSession(config: TeamConfig): Promise<TeamState> {
  if (!isTmuxAvailable()) {
    throw new Error('Team mode requires tmux. Please install tmux or use WSL2 on Windows.');
  }

  const { sessionName, windowIndex, leaderPaneId } = getCurrentTmuxContext();
  const teamTarget = `${sessionName}:${windowIndex}`;
  
  const sanitizedTeamName = sanitizeTeamName(config.name);
  const workerPaneIds: string[] = [];
  const rollbackPaneIds: string[] = [];

  try {
    // Get existing panes and choose leader
    const panes = listPanes(teamTarget);
    const chosenLeaderPaneId = chooseLeaderPane(panes, leaderPaneId);
    
    // Remove existing HUD panes for clean layout
    const hudPaneIds = panes
      .filter((pane) => pane.paneId !== chosenLeaderPaneId)
      .filter((pane) => isHudWatchPane(pane))
      .map((pane) => pane.paneId);
    
    for (const hudPaneId of hudPaneIds) {
      runTmux(['kill-pane', '-t', hudPaneId]);
    }

    // Create worker panes
    let rightStackRootPaneId: string | null = null;
    
    for (let i = 1; i <= config.workerCount; i++) {
      const workerId = `worker-${i}`;
      const workerCommand = buildWorkerStartupCommand(sanitizedTeamName, i, config.cwd, config.yolo ?? true);
      
      // First split: horizontal from leader, rest: vertical stack
      const splitDirection = i === 1 ? '-h' : '-v';
      const splitTarget = i === 1 ? chosenLeaderPaneId : (rightStackRootPaneId ?? chosenLeaderPaneId);
      
      const split = runTmux([
        'split-window',
        splitDirection,
        '-t', splitTarget,
        '-d',
        '-P',
        '-F', '#{pane_id}',
        '-c', config.cwd,
        workerCommand,
      ]);
      
      if (!split.ok) {
        throw new Error(`Failed to create worker pane ${i}: ${split.stderr}`);
      }
      
      const paneId = split.stdout.split('\n')[0]?.trim();
      if (!paneId || !paneId.startsWith('%')) {
        throw new Error(`Failed to capture worker pane ID for worker ${i}`);
      }
      
      workerPaneIds.push(paneId);
      rollbackPaneIds.push(paneId);
      
      if (i === 1) rightStackRootPaneId = paneId;
    }

    // Configure layout: leader on left, workers stacked on right
    runTmux(['select-layout', '-t', teamTarget, 'main-vertical']);
    
    // Set leader pane width to 50%
    const windowWidthResult = runTmux(['display-message', '-p', '-t', teamTarget, '#{window_width}']);
    if (windowWidthResult.ok) {
      const width = parseInt(windowWidthResult.stdout.split('\n')[0]?.trim() || '', 10);
      if (width >= 40) {
        const half = String(Math.floor(width / 2));
        runTmux(['set-window-option', '-t', teamTarget, 'main-pane-width', half]);
        runTmux(['select-layout', '-t', teamTarget, 'main-vertical']);
      }
    }

    // Select leader pane
    runTmux(['select-pane', '-t', chosenLeaderPaneId]);
    sleepMs(500);

    // Build worker states
    const workers: WorkerState[] = workerPaneIds.map((paneId, index) => ({
      id: `worker-${index + 1}`,
      paneId,
      status: 'pending',
      task: undefined,
    }));

    const state: TeamState = {
      name: sanitizedTeamName,
      role: config.role,
      workerCount: config.workerCount,
      status: 'created',
      workers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save state
    await saveTeamState(sanitizedTeamName, state);

    return { ...state, workers, leaderPaneId: chosenLeaderPaneId };

  } catch (error) {
    // Rollback: kill created panes on failure
    for (const paneId of rollbackPaneIds) {
      runTmux(['kill-pane', '-t', paneId]);
    }
    throw error;
  }
}

/**
 * Start team execution: write inbox files and send triggers
 */
export async function startTeam(sessionName: string, config: TeamConfig): Promise<void> {
  const state = await loadTeamState(config.name);
  
  try {
    // Update state to starting
    state.status = 'starting';
    state.updatedAt = new Date().toISOString();
    await saveTeamState(config.name, state);

    // For each worker: write inbox + send trigger
    for (const worker of state.workers) {
      if (!worker.paneId) continue;

      const workerIndex = parseInt(worker.id.replace('worker-', ''), 10);
      
      // Step 1: Write inbox file
      await writeWorkerInbox(config.name, worker.id, config.task, config.cwd);
      
      // Step 2: Send trigger via tmux send-keys
      const triggerMessage = generateTriggerMessage(worker.id, config.name);
      sendTaskToWorker(sessionName, workerIndex, worker.paneId, triggerMessage);
      
      // Small delay between workers
      sleepMs(200);
    }

    // Update state to running
    state.status = 'running';
    state.workers = state.workers.map(w => ({ ...w, status: 'running', task: config.task }));
    state.updatedAt = new Date().toISOString();
    await saveTeamState(config.name, state);

  } catch (error) {
    // Rollback on failure
    state.status = 'failed';
    state.updatedAt = new Date().toISOString();
    await saveTeamState(config.name, state);
    
    await shutdownTeam(config.name);
    throw new Error(`Failed to start team: ${error}`);
  }
}

/**
 * Assign a new task to a specific worker
 */
export async function assignTaskToWorker(
  teamName: string,
  workerId: string,
  task: string,
  cwd: string
): Promise<void> {
  const state = await loadTeamState(teamName);
  const worker = state.workers.find(w => w.id === workerId);
  
  if (!worker || !worker.paneId) {
    throw new Error(`Worker ${workerId} not found`);
  }

  // Write new inbox
  await writeWorkerInbox(teamName, workerId, task, cwd);
  
  // Send trigger
  const triggerMessage = generateTriggerMessage(workerId, teamName);
  const workerIndex = parseInt(workerId.replace('worker-', ''), 10);
  sendTaskToWorker(state.name, workerIndex, worker.paneId, triggerMessage);
  
  // Update worker state
  worker.status = 'running';
  worker.task = task;
  state.updatedAt = new Date().toISOString();
  await saveTeamState(teamName, state);
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Sanitize team name
 */
export function sanitizeTeamName(name: string): string {
  const lowered = name.toLowerCase();
  const replaced = lowered
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
  const truncated = replaced.slice(0, 30).replace(/-$/, '');
  if (truncated.trim() === '') {
    throw new Error('sanitizeTeamName: empty after sanitization');
  }
  return truncated;
}

/**
 * Save team state
 */
async function saveTeamState(teamName: string, state: TeamState): Promise<void> {
  await mkdir(TEAMS_DIR, { recursive: true });
  const statePath = join(TEAMS_DIR, `${teamName}.json`);
  await writeFile(statePath, JSON.stringify(state, null, 2));
}

/**
 * Load team state
 */
async function loadTeamState(teamName: string): Promise<TeamState> {
  const statePath = join(TEAMS_DIR, `${teamName}.json`);
  const content = await readFile(statePath, 'utf-8');
  return JSON.parse(content) as TeamState;
}

/**
 * Get team status
 */
export async function getTeamStatus(teamName: string): Promise<TeamState> {
  return await loadTeamState(teamName);
}

/**
 * List all active teams
 */
export async function listTeams(): Promise<TeamState[]> {
  try {
    const entries = await readFile(TEAMS_DIR, 'utf-8').catch(() => '');
    if (!entries) return [];
    // Simplified - in production, read directory properly
    return [];
  } catch {
    return [];
  }
}

/**
 * Shutdown a team
 */
export async function shutdownTeam(teamName: string): Promise<void> {
  const state = await loadTeamState(teamName).catch(() => null);
  
  try {
    // Kill tmux session if exists
    if (state) {
      execFileSync('tmux', ['kill-session', '-t', state.name], { stdio: 'ignore' });
    }
  } catch {
    // Session might already be dead
  }

  // Update state
  try {
    if (state) {
      state.status = 'cancelled';
      state.updatedAt = new Date().toISOString();
      state.workers = state.workers.map(w => ({ ...w, status: 'completed' }));
      await saveTeamState(teamName, state);
    }
  } catch {
    // State might not exist
  }
  
  // Cleanup state directory
  try {
    const stateDir = join(TEAMS_DIR, teamName);
    await rm(stateDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Shutdown all teams
 */
export async function shutdownAllTeams(): Promise<void> {
  try {
    const output = execFileSync('tmux', ['list-sessions', '-F', '#{session_name}'], {
      encoding: 'utf-8',
    });
    
    const sessions = output.trim().split('\n');
    
    for (const session of sessions) {
      if (session.startsWith('qmx-team-')) {
        await shutdownTeam(session);
      }
    }
  } catch {
    // No teams running
  }
}

/**
 * Check if a team session exists in tmux
 */
export function teamSessionExists(teamName: string): boolean {
  try {
    const statePath = join(TEAMS_DIR, `${teamName}.json`);
    const content = execFileSync('cat', [statePath], { encoding: 'utf-8' });
    const state = JSON.parse(content) as TeamState;
    execFileSync('tmux', ['has-session', '-t', state.name], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
