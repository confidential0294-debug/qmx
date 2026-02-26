/**
 * QMX HUD Command
 * 
 * Heads-Up Display for monitoring QMX sessions
 */

import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';

const QMX_DIR = join(process.cwd(), '.qmx');
const STATE_DIR = join(QMX_DIR, 'state');
const SESSIONS_DIR = join(STATE_DIR, 'sessions');
const TEAMS_DIR = join(STATE_DIR, 'teams');

export function hudCommand(program: Command) {
  const hud = program
    .command('hud')
    .description('Heads-Up Display for monitoring');

  hud
    .command('watch')
    .description('Watch mode - continuous monitoring')
    .option('--interval <ms>', 'Refresh interval in ms', '1000')
    .option('--no-clear', 'Don\'t clear screen between updates')
    .action(async (options) => {
      await hudWatch(options);
    });

  hud
    .command('status')
    .description('Show current status snapshot')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await hudStatus(options);
    });

  hud
    .command('teams')
    .description('Show team status')
    .action(async () => {
      await hudTeams();
    });

  hud
    .command('logs')
    .description('Show recent logs')
    .option('--lines <n>', 'Number of lines', '50')
    .option('--follow', 'Follow mode (like tail -f)')
    .action(async (options) => {
      await hudLogs(options);
    });
}

async function hudWatch(options: { interval?: string; noClear?: boolean }) {
  const interval = parseInt(options.interval || '1000');
  const shouldClear = !options.noClear;
  
  console.log(chalk.cyan('QMX HUD Watch Mode'));
  console.log(chalk.gray('='.repeat(60)));
  console.log(chalk.gray('Press Ctrl+C to exit\n'));
  
  let running = true;
  
  process.on('SIGINT', () => {
    running = false;
    console.log('\n' + chalk.gray('HUD watch stopped'));
    process.exit(0);
  });
  
  while (running) {
    try {
      if (shouldClear) {
        console.clear();
      }
      
      await displayHudSnapshot();
      
      await sleep(interval);
    } catch (error) {
      console.error(chalk.red('Error updating HUD:'), error);
      await sleep(interval);
    }
  }
}

async function hudStatus(options: { json?: boolean }) {
  try {
    const status = await getHudStatus();
    
    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }
    
    displayHudSnapshot(status);
    
  } catch (error) {
    console.error(chalk.red('Failed to get HUD status'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function hudTeams() {
  try {
    const teams = await getTeamsStatus();
    
    console.log('\n' + chalk.bold.cyan('Active Teams'));
    console.log(chalk.gray('='.repeat(60)));
    
    if (teams.length === 0) {
      console.log(chalk.gray('  No active teams'));
      return;
    }
    
    for (const team of teams) {
      const statusIcon = 
        team.status === 'running' ? chalk.green('●') :
        team.status === 'completed' ? chalk.blue('●') :
        team.status === 'failed' ? chalk.red('●') :
        chalk.yellow('●');
      
      console.log(`\n${statusIcon} ${chalk.bold(team.name)}`);
      console.log(`  Role: ${team.role}`);
      console.log(`  Workers: ${team.workerCount} | Status: ${chalk.bold(team.status)}`);
      
      const completedTasks = team.tasks?.filter((t: any) => t.status === 'completed').length || 0;
      const totalTasks = team.tasks?.length || 0;
      
      if (totalTasks > 0) {
        const progress = Math.round((completedTasks / totalTasks) * 100);
        console.log(`  Progress: ${progress}% (${completedTasks}/${totalTasks})`);
      }
      
      console.log(`  Updated: ${new Date(team.updatedAt).toLocaleTimeString()}`);
    }
    
    console.log('\n' + chalk.gray('='.repeat(60)));
    
  } catch (error) {
    console.error(chalk.red('Failed to get teams status'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function hudLogs(options: { lines?: string; follow?: boolean }) {
  const lines = parseInt(options.lines || '50');
  
  try {
    // Try to read session log
    const logPath = join(QMX_DIR, 'logs', 'session.log');
    
    try {
      const content = await readFile(logPath, 'utf-8');
      const allLines = content.split('\n');
      const recentLines = allLines.slice(-lines);
      
      console.log('\n' + chalk.bold.cyan(`Recent Logs (last ${lines} lines)`));
      console.log(chalk.gray('='.repeat(60)));
      
      for (const line of recentLines) {
        if (line.includes('ERROR')) {
          console.log(chalk.red(line));
        } else if (line.includes('WARN')) {
          console.log(chalk.yellow(line));
        } else if (line.includes('SUCCESS')) {
          console.log(chalk.green(line));
        } else {
          console.log(chalk.gray(line));
        }
      }
      
      console.log(chalk.gray('='.repeat(60)));
      
    } catch {
      console.log(chalk.yellow('No session logs found'));
    }
    
  } catch (error) {
    console.error(chalk.red('Failed to read logs'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function getHudStatus() {
  const sessionId = process.env.QMX_SESSION_ID || 'unknown';
  
  let sessionState: any = {};
  
  try {
    const sessionPath = join(SESSIONS_DIR, `${sessionId}.json`);
    const content = await readFile(sessionPath, 'utf-8');
    sessionState = JSON.parse(content);
  } catch {
    // Session file might not exist
  }
  
  const teams = await getTeamsStatus();
  
  return {
    sessionId,
    status: sessionState.status || 'unknown',
    startTime: sessionState.startTime,
    lastActivity: sessionState.lastActivity,
    activeTeams: teams.length,
    activeModes: sessionState.activeModes || [],
    teams,
  };
}

async function getTeamsStatus() {
  try {
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(TEAMS_DIR);
    
    const teams = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async f => {
          const content = await readFile(join(TEAMS_DIR, f), 'utf-8');
          return JSON.parse(content);
        })
    );
    
    return teams.filter(t => t.status === 'running' || t.status === 'created');
  } catch {
    return [];
  }
}

function displayHudSnapshot(status?: any) {
  const data = status || getHudStatus();
  
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                    QMX Session Dashboard                    ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝'));
  
  console.log(`\n${chalk.bold('Session')}: ${process.env.QMX_SESSION_ID || 'N/A'}`);
  console.log(`${chalk.bold('Status')}: ${getStatusColor(data.status || 'unknown')} `);
  console.log(`${chalk.bold('Started')}: ${new Date(data.startTime || Date.now()).toLocaleString()}`);
  console.log(`${chalk.bold('Last Activity')}: ${new Date(data.lastActivity || Date.now()).toLocaleString()}`);
  
  console.log(`\n${chalk.bold('Active Teams')}: ${chalk.cyan(data.activeTeams || 0)}`);
  
  if (data.activeModes && data.activeModes.length > 0) {
    console.log(`${chalk.bold('Active Modes')}: ${chalk.yellow(data.activeModes.join(', '))}`);
  }
  
  // Quick team status
  if (data.teams && data.teams.length > 0) {
    console.log(`\n${chalk.bold('Team Status')}:`);
    for (const team of data.teams.slice(0, 5)) {
      const icon = 
        team.status === 'running' ? chalk.green('●') :
        team.status === 'completed' ? chalk.blue('●') :
        chalk.yellow('●');
      
      console.log(`  ${icon} ${team.name} (${team.role})`);
    }
    
    if (data.teams.length > 5) {
      console.log(`  ${chalk.gray(`... and ${data.teams.length - 5} more`)}`);
    }
  }
  
  console.log('\n' + chalk.gray('─'.repeat(60)));
  console.log(chalk.gray('Press Ctrl+C to exit watch mode'));
}

function getStatusColor(status: string) {
  return status === 'running' ? chalk.green(status) :
    status === 'idle' ? chalk.yellow(status) :
    status === 'ended' ? chalk.gray(status) :
    chalk.red(status);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Default export for CLI execution from bin/qmx.js
 */
export default async function run(args: string[]) {
  const subcommand = args[0];
  const subArgs = args.slice(1);

  if (!subcommand) {
    console.log('Usage: qmx hud <subcommand> [options]');
    console.log('\nSubcommands:');
    console.log('  watch             - Watch mode - continuous monitoring');
    console.log('  status            - Show current status snapshot');
    console.log('  teams             - Show team status');
    console.log('  logs              - Show recent logs');
    return;
  }

  // Parse subcommand options
  const options: any = {};
  const positionalArgs: string[] = [];

  for (let i = 0; i < subArgs.length; i++) {
    const arg = subArgs[i];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--no-clear') {
      options.noClear = true;
    } else if (arg === '--follow') {
      options.follow = true;
    } else if (arg === '--interval' && subArgs[i + 1]) {
      options.interval = subArgs[++i];
    } else if (arg === '--lines' && subArgs[i + 1]) {
      options.lines = subArgs[++i];
    } else if (!arg.startsWith('-')) {
      positionalArgs.push(arg);
    }
  }

  switch (subcommand) {
    case 'watch':
      await hudWatch(options);
      break;

    case 'status':
      await hudStatus(options);
      break;

    case 'teams':
      await hudTeams();
      break;

    case 'logs':
      await hudLogs(options);
      break;

    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      process.exit(1);
  }
}
