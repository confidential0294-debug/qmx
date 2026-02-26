/**
 * QMX Status Command
 * 
 * Show current QMX session and mode status
 */

import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';

const QMX_DIR = join(process.cwd(), '.qmx');
const SESSIONS_DIR = join(QMX_DIR, 'state', 'sessions');

export function statusCommand(program: Command) {
  program
    .command('status')
    .description('Show active QMX status')
    .option('--json', 'Output as JSON')
    .option('--all', 'Show all sessions including ended')
    .action(async (options) => {
      await showStatus(options);
    });
}

async function showStatus(_options?: { json?: boolean; all?: boolean }) {
  try {
    const status = await getCurrentStatus(_options);

    if (_options?.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    displayStatus(status, _options);
    
  } catch (error) {
    console.error(chalk.red('Failed to get status'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function getCurrentStatus(_options?: { all?: boolean }) {
  const sessionId = process.env.QMX_SESSION_ID;
  
  let currentSession: any = null;
  
  if (sessionId) {
    try {
      const sessionPath = join(SESSIONS_DIR, `${sessionId}.json`);
      const content = await readFile(sessionPath, 'utf-8');
      currentSession = JSON.parse(content);
    } catch {
      // Session file might not exist
    }
  }
  
  // Get active modes
  const activeModes = currentSession?.activeModes || [];
  
  // Get active teams count
  let activeTeams = 0;
  try {
    const { readdir } = await import('node:fs/promises');
    const TEAMS_DIR = join(QMX_DIR, 'state', 'teams');
    const files = await readdir(TEAMS_DIR);
    const teams = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async f => {
          const content = await readFile(join(TEAMS_DIR, f), 'utf-8');
          return JSON.parse(content);
        })
    );
    activeTeams = teams.filter(t => t.status === 'running').length;
  } catch {
    // Teams directory might not exist
  }
  
  return {
    sessionId,
    session: currentSession,
    activeModes,
    activeTeams,
    hasActiveSession: !!currentSession && currentSession.status !== 'ended',
  };
}

function displayStatus(status: any, _options?: { all?: boolean }) {
  console.log('\n' + chalk.bold.cyan('╔════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║              QMX Status Dashboard              ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════╝'));
  
  if (!status.hasActiveSession) {
    console.log('\n' + chalk.yellow('  No active QMX session'));
    console.log('\n  Start one with: ' + chalk.cyan('qmx'));
    console.log();
    return;
  }
  
  const session = status.session;
  
  console.log(`\n${chalk.bold('Session ID')}: ${chalk.cyan(session.sessionId)}`);
  
  const statusColor = 
    session.status === 'running' ? chalk.green :
    session.status === 'idle' ? chalk.yellow :
    session.status === 'ended' ? chalk.gray :
    chalk.red;
  
  console.log(`${chalk.bold('Status')}: ${statusColor(session.status)}`);
  
  console.log(`${chalk.bold('Started')}: ${new Date(session.startTime).toLocaleString()}`);
  console.log(`${chalk.bold('Last Activity')}: ${new Date(session.lastActivity).toLocaleString()}`);
  
  // Calculate duration
  const start = new Date(session.startTime).getTime();
  const now = Date.now();
  const duration = now - start;
  const hours = Math.floor(duration / 3600000);
  const minutes = Math.floor((duration % 3600000) / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  
  console.log(`${chalk.bold('Duration')}: ${hours}h ${minutes}m ${seconds}s`);
  
  console.log(`\n${chalk.bold('Active Teams')}: ${chalk.cyan(status.activeTeams)}`);
  
  if (status.activeModes.length > 0) {
    console.log(`${chalk.bold('Active Modes')}: ${chalk.yellow(status.activeModes.join(', '))}`);
  } else {
    console.log(`${chalk.bold('Active Modes')}: ${chalk.gray('None')}`);
  }
  
  // Show project
  if (session.project) {
    console.log(`${chalk.bold('Project')}: ${chalk.gray(session.project)}`);
  }
  
  // Show options
  if (session.options) {
    const opts = [];
    if (session.options.yolo) opts.push(chalk.red('YOLO'));
    if (session.options.high) opts.push(chalk.yellow('High Reasoning'));
    if (session.options.xhigh) opts.push(chalk.magenta('XHigh Reasoning'));
    if (session.options.verbose) opts.push(chalk.cyan('Verbose'));
    
    if (opts.length > 0) {
      console.log(`${chalk.bold('Options')}: ${opts.join(', ')}`);
    }
  }
  
  console.log('\n' + chalk.gray('─'.repeat(50)));
  console.log('\n' + chalk.cyan('  Quick Commands:'));
  console.log('    ' + chalk.gray('qmx team list') + '        - List active teams');
  console.log('    ' + chalk.gray('qmx cancel') + '           - Cancel active modes');
  console.log('    ' + chalk.gray('qmx hud --watch') + '      - Open HUD watch mode');
  console.log('    ' + chalk.gray('qmx hooks status') + '     - Show installed plugins');

  console.log();
}

/**
 * Default export for CLI execution from bin/qmx.js
 */
export default async function run(args: string[]) {
  const options: { json?: boolean; all?: boolean } = {};

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--all') {
      options.all = true;
    }
  }

  await showStatus(options);
}
