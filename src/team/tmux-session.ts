/**
 * QMX tmux Session Management
 */

import { spawnSync, execFileSync } from 'node:child_process';
import { join } from 'node:path';

const HUD_TMUX_TEAM_HEIGHT_LINES = 8;

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

export function isTmuxAvailable(): boolean {
  try {
    execFileSync('tmux', ['-V'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function getTmuxVersion(): string {
  try {
    const output = execFileSync('tmux', ['-V'], { encoding: 'utf-8' });
    return output.replace('tmux ', '').trim();
  } catch {
    return 'unknown';
  }
}

export interface PaneInfo {
  paneId: string;
  currentCommand: string;
  startCommand: string;
}

export function listPanes(target: string): PaneInfo[] {
  const result = runTmux(['list-panes', '-t', target, '-F', '#{pane_id}\t#{pane_current_command}\t#{pane_start_command}']);
  if (!result.ok) return [];
  
  return result.stdout
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const [paneId = '', currentCommand = '', startCommand = ''] = line.split('\t');
      return { paneId, currentCommand, startCommand };
    })
    .filter(pane => pane.paneId.startsWith('%'));
}

export function getCurrentTmuxContext(): { sessionName: string; windowIndex: string; leaderPaneId: string } {
  const context = runTmux(['display-message', '-p', '#S:#I #{pane_id}']);
  if (!context.ok) {
    throw new Error(`Failed to detect current tmux target: ${context.stderr}`);
  }
  
  const [sessionAndWindow = '', detectedLeaderPaneId = ''] = context.stdout.split(' ');
  const [sessionName, windowIndex] = (sessionAndWindow || '').split(':');
  
  if (!sessionName || !windowIndex || !detectedLeaderPaneId || !detectedLeaderPaneId.startsWith('%')) {
    throw new Error(`Failed to parse current tmux target: ${context.stdout}`);
  }
  
  return { sessionName, windowIndex, leaderPaneId: detectedLeaderPaneId };
}

export function chooseLeaderPane(panes: PaneInfo[], preferredPaneId: string): string {
  const preferred = panes.find(pane => pane.paneId === preferredPaneId);
  if (preferred && !isHudWatchPane(preferred)) return preferred.paneId;
  
  const nonHud = panes.find(pane => !isHudWatchPane(pane));
  if (nonHud) return nonHud.paneId;
  
  return preferredPaneId;
}

function isHudWatchPane(pane: PaneInfo): boolean {
  const start = pane.startCommand || '';
  return /\bqmx\b.*\bhud\b.*--watch/i.test(start);
}

export interface TeamSession {
  name: string;
  sessionName: string;
  windowIndex: string;
  workerCount: number;
  cwd: string;
  workerPaneIds: string[];
  leaderPaneId: string;
  hudPaneId: string | null;
  resizeHookName: string | null;
  resizeHookTarget: string | null;
}

export interface WorkerStartup {
  cwd: string;
  env: Record<string, string>;
}

export function createTeamSession(
  teamName: string,
  workerCount: number,
  cwd: string,
  workerLaunchArgs: string[],
  workerStartups: WorkerStartup[]
): TeamSession {
  if (!isTmuxAvailable()) {
    throw new Error('tmux is not available');
  }

  const { sessionName, windowIndex, leaderPaneId } = getCurrentTmuxContext();
  const teamTarget = `${sessionName}:${windowIndex}`;
  
  const sanitizedTeamName = sanitizeTeamName(teamName);
  const workerPaneIds: string[] = [];
  const rollbackPaneIds: string[] = [];
  let registeredResizeHook: { name: string; target: string } | null = null;

  try {
    const panes = listPanes(teamTarget);
    const chosenLeaderPaneId = chooseLeaderPane(panes, leaderPaneId);
    
    const hudPaneIds = panes
      .filter(pane => pane.paneId !== chosenLeaderPaneId)
      .filter(pane => isHudWatchPane(pane))
      .map(pane => pane.paneId);
    
    for (const hudPaneId of hudPaneIds) {
      runTmux(['kill-pane', '-t', hudPaneId]);
    }

    let rightStackRootPaneId: string | null = null;
    
    for (let i = 0; i < workerCount; i++) {
      const startup = workerStartups[i] || { cwd, env: {} };
      const workerCmd = buildWorkerStartupCommand(
        sanitizedTeamName,
        i + 1,
        workerLaunchArgs,
        startup.cwd,
        startup.env
      );
      
      const splitDirection = i === 0 ? '-h' : '-v';
      const splitTarget = i === 0 ? chosenLeaderPaneId : (rightStackRootPaneId ?? chosenLeaderPaneId);
      
      const split = runTmux([
        'split-window',
        splitDirection,
        '-t', splitTarget,
        '-d',
        '-P',
        '-F', '#{pane_id}',
        '-c', startup.cwd,
        workerCmd,
      ]);
      
      if (!split.ok) {
        throw new Error(`Failed to create worker pane ${i + 1}: ${split.stderr}`);
      }
      
      const paneId = split.stdout.split('\n')[0]?.trim();
      if (!paneId || !paneId.startsWith('%')) {
        throw new Error(`Failed to capture worker pane ID for worker ${i + 1}`);
      }
      
      workerPaneIds.push(paneId);
      rollbackPaneIds.push(paneId);
      
      if (i === 0) rightStackRootPaneId = paneId;
    }

    runTmux(['select-layout', '-t', teamTarget, 'main-vertical']);
    
    const windowWidthResult = runTmux(['display-message', '-p', '-t', teamTarget, '#{window_width}']);
    if (windowWidthResult.ok) {
      const width = parseInt(windowWidthResult.stdout.split('\n')[0]?.trim() || '', 10);
      if (width >= 40) {
        const half = String(Math.floor(width / 2));
        runTmux(['set-window-option', '-t', teamTarget, 'main-pane-width', half]);
        runTmux(['select-layout', '-t', teamTarget, 'main-vertical']);
      }
    }

    // Create HUD pane
    let hudPaneId: string | null = null;
    let resizeHookName: string | null = null;
    let resizeHookTarget: string | null = null;
    
    const omxEntry = process.argv[1];
    if (omxEntry && omxEntry.trim() !== '') {
      const hudCmd = `node ${shellQuoteSingle(omxEntry)} hud --watch`;
      const hudResult = runTmux([
        'split-window',
        '-v',
        '-l',
        String(HUD_TMUX_TEAM_HEIGHT_LINES),
        '-t',
        chosenLeaderPaneId,
        '-d',
        '-P',
        '-F',
        '#{pane_id}',
        '-c',
        cwd,
        hudCmd,
      ]);
      
      if (hudResult.ok) {
        const id = hudResult.stdout.split('\n')[0]?.trim() ?? '';
        if (id.startsWith('%')) {
          hudPaneId = id;
          rollbackPaneIds.push(hudPaneId);
          
          resizeHookTarget = `${sessionName}:${windowIndex}`;
          resizeHookName = buildResizeHookName(sanitizedTeamName, sessionName, windowIndex, hudPaneId);
          
          const registerHook = runTmux(
            buildRegisterResizeHookArgs(resizeHookTarget, resizeHookName, hudPaneId)
          );
          
          if (!registerHook.ok) {
            throw new Error(`Failed to register resize hook: ${registerHook.stderr}`);
          }
          
          registeredResizeHook = { name: resizeHookName, target: resizeHookTarget };
          
          runTmux(buildScheduleDelayedHudResizeArgs(hudPaneId));
          runTmux(buildReconcileHudResizeArgs(hudPaneId));
        }
      }
    }

    runTmux(['select-pane', '-t', chosenLeaderPaneId]);
    sleepMs(500);

    if (process.env.QMX_TEAM_MOUSE !== '0') {
      runTmux(['set-window-option', '-t', teamTarget, 'mouse', 'on']);
    }

    return {
      name: teamTarget,
      sessionName,
      windowIndex,
      workerCount,
      cwd,
      workerPaneIds,
      leaderPaneId: chosenLeaderPaneId,
      hudPaneId,
      resizeHookName,
      resizeHookTarget,
    };

  } catch (error) {
    if (registeredResizeHook) {
      runTmux(['set-hook', '-u', '-t', registeredResizeHook.target, `client-resized[0]`]);
    }
    for (const paneId of rollbackPaneIds) {
      runTmux(['kill-pane', '-t', paneId]);
    }
    throw error;
  }
}

export function destroyTeamSession(sessionName: string): void {
  try {
    execFileSync('tmux', ['kill-session', '-t', sessionName], { stdio: 'ignore' });
  } catch {
    // Session might already be dead
  }
}

export function listTeamSessions(): string[] {
  try {
    const output = execFileSync('tmux', ['list-sessions', '-F', '#{session_name}'], {
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(s => s.startsWith('qmx-team-'));
  } catch {
    return [];
  }
}

function buildWorkerStartupCommand(
  teamName: string,
  workerIndex: number,
  launchArgs: string[],
  cwd: string,
  extraEnv: Record<string, string>
): string {
  const workerEnv = {
    QMX_TEAM_WORKER: `${teamName}/worker-${workerIndex}`,
    QMX_TEAM_STATE_ROOT: join(cwd, '.qmx', 'state'),
    ...extraEnv,
  };

  const envParts = Object.entries(workerEnv).map(([k, v]) => `${k}=${shellQuoteSingle(v)}`).join(' ');
  const qwxArgs = launchArgs.length > 0 ? launchArgs.map(shellQuoteSingle).join(' ') : '-y';
  const qwxCommand = `qwx ${qwxArgs}`;
  
  const shell = process.env.SHELL || '/bin/sh';
  const rcFile = shell.endsWith('bash') ? '~/.bashrc' : shell.endsWith('zsh') ? '~/.zshrc' : null;
  const rcPrefix = rcFile ? `if [ -f ${rcFile} ]; then source ${rcFile}; fi; ` : '';
  const inner = `${rcPrefix}exec ${qwxCommand}`;
  
  return `env ${envParts} ${shellQuoteSingle(shell)} -lc ${shellQuoteSingle(inner)}`;
}

function shellQuoteSingle(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function sendToWorker(
  _sessionName: string,
  _workerIndex: number,
  workerPaneId: string,
  text: string
): void {
  const target = workerPaneId;
  
  const captured = runTmux(['capture-pane', '-t', target, '-p', '-S', '-80']);
  const paneContent = captured.ok ? captured.stdout : '';
  
  const isAtPrompt = paneContent.includes('$ ') || paneContent.includes('❯ ') || paneContent.includes('> ');
  
  if (!isAtPrompt && paneContent.length > 50) {
    runTmux(['send-keys', '-t', target, 'C-c']);
    sleepMs(100);
  }
  
  runTmux(['send-keys', '-t', target, '-l', '--', text]);
  sleepMs(100);
  runTmux(['send-keys', '-t', target, 'C-m']);
}

export function notifyLeaderStatus(sessionName: string, message: string): boolean {
  if (!isTmuxAvailable()) return false;
  
  const trimmed = message.trim();
  if (!trimmed) return false;
  
  const capped = trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
  const result = runTmux(['display-message', '-t', sessionName, '--', capped]);
  return result.ok;
}

function normalizeTmuxHookToken(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
}

function normalizeHudPaneToken(hudPaneId: string): string {
  const trimmed = hudPaneId.trim();
  const withoutPrefix = trimmed.startsWith('%') ? trimmed.slice(1) : trimmed;
  return normalizeTmuxHookToken(withoutPrefix);
}

function buildResizeHookName(
  teamName: string,
  sessionName: string,
  windowIndex: string,
  hudPaneId: string
): string {
  return [
    'qmx_resize',
    normalizeTmuxHookToken(teamName),
    normalizeTmuxHookToken(sessionName),
    normalizeTmuxHookToken(windowIndex),
    normalizeHudPaneToken(hudPaneId),
  ].join('_');
}

function buildHudPaneTarget(hudPaneId: string): string {
  const trimmed = hudPaneId.trim();
  return trimmed.startsWith('%') ? trimmed : `%${trimmed}`;
}

function buildHudResizeCommand(hudPaneId: string, heightLines: number = HUD_TMUX_TEAM_HEIGHT_LINES): string {
  return `resize-pane -t ${buildHudPaneTarget(hudPaneId)} -y ${heightLines}`;
}

function buildBestEffortShellCommand(command: string): string {
  return `${command} >/dev/null 2>&1 || true`;
}

function buildRegisterResizeHookArgs(
  hookTarget: string,
  _hookName: string,
  hudPaneId: string,
  heightLines: number = HUD_TMUX_TEAM_HEIGHT_LINES
): string[] {
  const resizeCommand = shellQuoteSingle(
    buildBestEffortShellCommand(`tmux ${buildHudResizeCommand(hudPaneId, heightLines)}`)
  );
  return ['set-hook', '-t', hookTarget, `client-resized[0]`, `run-shell -b ${resizeCommand}`];
}

function buildScheduleDelayedHudResizeArgs(
  hudPaneId: string,
  delaySeconds: number = 2,
  heightLines: number = HUD_TMUX_TEAM_HEIGHT_LINES
): string[] {
  return [
    'run-shell',
    '-b',
    `sleep ${delaySeconds}; ${buildBestEffortShellCommand(`tmux ${buildHudResizeCommand(hudPaneId, heightLines)}`)}`,
  ];
}

function buildReconcileHudResizeArgs(
  hudPaneId: string,
  heightLines: number = HUD_TMUX_TEAM_HEIGHT_LINES
): string[] {
  return ['run-shell', buildBestEffortShellCommand(`tmux ${buildHudResizeCommand(hudPaneId, heightLines)}`)];
}

function sleepMs(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

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
