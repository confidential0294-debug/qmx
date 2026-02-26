/**
 * QMX Cancel Command
 * 
 * Cancel active execution modes and teams
 */

import { Command } from 'commander';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';

const QMX_DIR = join(process.cwd(), '.qmx');
const SESSIONS_DIR = join(QMX_DIR, 'state', 'sessions');
const TEAMS_DIR = join(QMX_DIR, 'state', 'teams');

export function cancelCommand(program: Command) {
  program
    .command('cancel')
    .description('Cancel active executions')
    .option('--all', 'Cancel everything (teams and modes)')
    .option('--teams', 'Cancel all teams only')
    .option('--modes', 'Cancel all modes only')
    .option('--team <name>', 'Cancel specific team')
    .action(async (options) => {
      await cancelExecution(options);
    });
}

async function cancelExecution(options: any) {
  const spinner = ora('Cancelling executions...').start();
  
  try {
    let cancelled = {
      teams: 0,
      modes: 0,
    };
    
    // Cancel teams
    if (options.all || options.teams || options.team) {
      const teamCount = await cancelTeams(options.team);
      cancelled.teams = teamCount;
    }
    
    // Cancel modes
    if (options.all || options.modes) {
      const modeCount = await cancelModes();
      cancelled.modes = modeCount;
    }
    
    // If no specific option, cancel both
    if (!options.all && !options.teams && !options.modes && !options.team) {
      cancelled.teams = await cancelTeams();
      cancelled.modes = await cancelModes();
    }
    
    if (cancelled.teams === 0 && cancelled.modes === 0) {
      spinner.info(chalk.yellow('Nothing to cancel'));
    } else {
      spinner.succeed(chalk.green(`Cancelled ${cancelled.teams} team(s) and ${cancelled.modes} mode(s)`));
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Cancel failed'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function cancelTeams(specificTeam?: string): Promise<number> {
  let cancelled = 0;
  
  try {
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(TEAMS_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const teamPath = join(TEAMS_DIR, file);
      const content = await readFile(teamPath, 'utf-8');
      const team = JSON.parse(content);
      
      // Skip non-running teams
      if (team.status !== 'running' && team.status !== 'starting') {
        continue;
      }
      
      // If specific team requested, check name
      if (specificTeam && team.name !== specificTeam) {
        continue;
      }
      
      // Update team state
      team.status = 'cancelled';
      team.updatedAt = new Date().toISOString();
      team.workers = team.workers.map((w: any) => ({
        ...w,
        status: 'cancelled',
      }));
      
      await writeFile(teamPath, JSON.stringify(team, null, 2));
      
      // Try to kill tmux session
      try {
        const { execSync } = await import('node:child_process');
        execSync(`tmux kill-session -t ${team.name}`, { stdio: 'ignore' });
      } catch {
        // Session might already be dead
      }
      
      cancelled++;
    }
  } catch {
    // Teams directory might not exist
  }
  
  return cancelled;
}

async function cancelModes(): Promise<number> {
  const sessionId = process.env.QMX_SESSION_ID;

  if (!sessionId) {
    return 0;
  }

  try {
    const sessionPath = join(SESSIONS_DIR, `${sessionId}.json`);
    const content = await readFile(sessionPath, 'utf-8');
    const session = JSON.parse(content);

    const activeModes = session.activeModes || [];

    if (activeModes.length === 0) {
      return 0;
    }

    // Clear active modes
    session.activeModes = [];
    session.updatedAt = new Date().toISOString();

    await writeFile(sessionPath, JSON.stringify(session, null, 2));

    return activeModes.length;
  } catch {
    return 0;
  }
}

/**
 * Default export for CLI execution from bin/qmx.js
 */
export default async function run(args: string[]) {
  const options: any = {};

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') {
      options.all = true;
    } else if (arg === '--teams') {
      options.teams = true;
    } else if (arg === '--modes') {
      options.modes = true;
    } else if (arg === '--team' && args[i + 1]) {
      options.team = args[++i];
    }
  }

  await cancelExecution(options);
}
