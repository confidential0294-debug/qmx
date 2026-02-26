/**
 * QMX Team Command
 * 
 * Manages team lifecycle: create, list, status, shutdown
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  createTeam,
  startTeam,
  shutdownTeam,
  shutdownAllTeams,
  listTeams,
  getTeamStatus,
  isTmuxAvailable,
  teamSessionExists,
} from '../team/runtime.js';

export function teamCommand(program: Command) {
  const team = program
    .command('team')
    .description('Manage agent teams');

  team
    .command('start')
    .argument('<workers>', 'Number of workers (e.g., 3:executor)')
    .argument('<task>', 'Task description')
    .option('--name <name>', 'Team name')
    .option('--no-start', 'Create but don\'t start')
    .action(async (workersArg, task, options) => {
      await teamStart(workersArg, task, options);
    });

  team
    .command('list')
    .description('List all active teams')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await teamList(options);
    });

  team
    .command('status')
    .description('Show team status')
    .argument('<name>', 'Team name')
    .option('--json', 'Output as JSON')
    .action(async (name, options) => {
      await teamStatus(name, options);
    });

  team
    .command('shutdown')
    .description('Shutdown a team')
    .argument('<name>', 'Team name')
    .option('--all', 'Shutdown all teams')
    .option('--force', 'Force shutdown')
    .action(async (name, options) => {
      await teamShutdown(name, options);
    });

  team
    .command('cleanup')
    .description('Clean up orphaned team sessions')
    .action(async () => {
      await teamCleanup();
    });
}

async function teamStart(
  workersArg: string,
  task: string,
  options: { name?: string; noStart?: boolean }
) {
  if (!isTmuxAvailable()) {
    console.error(chalk.red('Error: tmux is required for team mode'));
    console.error(chalk.yellow('Install tmux or use WSL2 on Windows'));
    process.exit(1);
  }

  const spinner = ora('Creating team...').start();
  
  try {
    // Parse workers argument (e.g., "3:executor")
    const [countStr, role] = workersArg.split(':');
    const workerCount = parseInt(countStr);
    
    if (isNaN(workerCount) || workerCount < 1) {
      throw new Error('Invalid worker count');
    }
    
    if (!role) {
      throw new Error('Invalid role format. Use: N:role (e.g., 3:executor)');
    }

    const teamName = options.name || `team-${Date.now()}`;
    
    // Create team
    const team = await createTeam({
      name: teamName,
      role,
      workerCount,
      task,
      cwd: process.cwd(),
    });

    spinner.succeed(chalk.green(`Team "${team.name}" created with ${workerCount} workers`));

    // Start team unless --no-start
    if (!options.noStart) {
      const startSpinner = ora('Starting team...').start();
      
      try {
        await startTeam(team.name, {
          name: teamName,
          role,
          workerCount,
          task,
          cwd: process.cwd(),
        });
        
        startSpinner.succeed(chalk.green('Team started successfully'));
        
        console.log('\n' + chalk.cyan('Team Info:'));
        console.log(`  Name: ${chalk.bold(team.name)}`);
        console.log(`  Role: ${role}`);
        console.log(`  Workers: ${workerCount}`);
        console.log(`  Task: ${task}`);
        console.log(`\nMonitor with: ${chalk.yellow(`qmx team status ${team.name}`)}`);
        console.log(`Shutdown with: ${chalk.yellow(`qmx team shutdown ${team.name}`)}`);
        
      } catch (error) {
        startSpinner.fail(chalk.red('Failed to start team'));
        await shutdownTeam(team.name);
        throw error;
      }
    } else {
      console.log('\n' + chalk.yellow('Team created but not started'));
      console.log(`Start with: ${chalk.yellow(`qmx team start ${team.name}`)}`);
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to create team'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function teamList(options: { json?: boolean }) {
  try {
    const teams = await listTeams();
    
    if (options.json) {
      console.log(JSON.stringify(teams, null, 2));
      return;
    }
    
    if (teams.length === 0) {
      console.log(chalk.gray('No active teams'));
      return;
    }
    
    console.log(chalk.bold.cyan('\nActive Teams\n'));
    console.log(chalk.gray('='.repeat(60)));
    
    for (const team of teams) {
      const statusIcon = 
        team.status === 'running' ? chalk.green('●') :
        team.status === 'completed' ? chalk.blue('●') :
        team.status === 'failed' ? chalk.red('●') :
        chalk.yellow('●');
      
      console.log(`\n${statusIcon} ${chalk.bold(team.name)}`);
      console.log(`  Role: ${team.role}`);
      console.log(`  Workers: ${team.workerCount}`);
      console.log(`  Status: ${chalk.bold(team.status)}`);
      console.log(`  Created: ${new Date(team.createdAt).toLocaleString()}`);
    }
    
    console.log('\n' + chalk.gray('='.repeat(60)));
    console.log(`Total: ${teams.length} team(s)`);
    
  } catch (error) {
    console.error(chalk.red('Failed to list teams'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function teamStatus(name: string, options: { json?: boolean }) {
  const spinner = ora('Fetching team status...').start();
  
  try {
    const team = await getTeamStatus(name);
    
    if (options.json) {
      console.log(JSON.stringify(team, null, 2));
      spinner.succeed();
      return;
    }
    
    spinner.succeed();
    
    const exists = teamSessionExists(name);
    
    console.log('\n' + chalk.bold.cyan(`Team: ${name}`));
    console.log(chalk.gray('='.repeat(60)));
    
    console.log(`\n${chalk.bold('Configuration')}`);
    console.log(`  Role: ${team.role}`);
    console.log(`  Workers: ${team.workerCount}`);
    console.log(`  Created: ${new Date(team.createdAt).toLocaleString()}`);
    console.log(`  Updated: ${new Date(team.updatedAt).toLocaleString()}`);
    
    console.log(`\n${chalk.bold('Status')}`);
    const statusColor = 
      team.status === 'running' ? chalk.green :
      team.status === 'completed' ? chalk.blue :
      team.status === 'failed' ? chalk.red :
      chalk.yellow;
    console.log(`  State: ${statusColor(team.status)}`);
    console.log(`  tmux Session: ${exists ? chalk.green('Active') : chalk.gray('Inactive')}`);
    
    console.log(`\n${chalk.bold('Workers')}`);
    for (const worker of team.workers) {
      const icon = 
        worker.status === 'running' ? chalk.green('●') :
        worker.status === 'completed' ? chalk.blue('●') :
        worker.status === 'failed' ? chalk.red('●') :
        chalk.yellow('●');
      
      console.log(`  ${icon} ${worker.id}: ${chalk.bold(worker.status)}`);
      if (worker.task) {
        console.log(`     Task: ${worker.task}`);
      }
    }
    
    console.log('\n' + chalk.gray('='.repeat(60)));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to get team status'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function teamShutdown(name: string, options: { all?: boolean; force?: boolean }) {
  const spinner = ora('Shutting down team...').start();
  
  try {
    if (options.all) {
      await shutdownAllTeams();
      spinner.succeed(chalk.green('All teams shutdown'));
    } else {
      await shutdownTeam(name);
      spinner.succeed(chalk.green(`Team "${name}" shutdown`));
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to shutdown team'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function teamCleanup() {
  const spinner = ora('Cleaning up orphaned teams...').start();

  try {
    const teams = await listTeams();
    let cleaned = 0;

    for (const team of teams) {
      const exists = teamSessionExists(team.name);

      if (!exists && team.status === 'running') {
        // Orphaned team - update state
        await shutdownTeam(team.name);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      spinner.succeed(chalk.green(`Cleaned up ${cleaned} orphaned team(s)`));
    } else {
      spinner.succeed(chalk.green('No orphaned teams found'));
    }

  } catch (error) {
    spinner.fail(chalk.red('Cleanup failed'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

/**
 * Default export for CLI execution from bin/qmx.js
 */
export default async function run(args: string[]) {
  const subcommand = args[0];
  const subArgs = args.slice(1);

  if (!subcommand) {
    console.log('Usage: qmx team <subcommand> [options]');
    console.log('\nSubcommands:');
    console.log('  start <workers> <task>  - Start a new team');
    console.log('  list                    - List all active teams');
    console.log('  status <name>           - Show team status');
    console.log('  shutdown <name>         - Shutdown a team');
    console.log('  cleanup                 - Clean up orphaned teams');
    return;
  }

  // Parse subcommand options
  const options: any = {};
  const positionalArgs: string[] = [];

  for (let i = 0; i < subArgs.length; i++) {
    const arg = subArgs[i];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--no-start') {
      options.noStart = true;
    } else if (arg === '--name' && subArgs[i + 1]) {
      options.name = subArgs[++i];
    } else if (!arg.startsWith('-')) {
      positionalArgs.push(arg);
    }
  }

  switch (subcommand) {
    case 'start':
      if (positionalArgs.length < 2) {
        console.error('Error: start requires <workers> and <task> arguments');
        process.exit(1);
      }
      await teamStart(positionalArgs[0], positionalArgs[1], options);
      break;

    case 'list':
      await teamList(options);
      break;

    case 'status':
      if (positionalArgs.length < 1) {
        console.error('Error: status requires <name> argument');
        process.exit(1);
      }
      await teamStatus(positionalArgs[0], options);
      break;

    case 'shutdown':
      if (positionalArgs.length < 1 && !options.all) {
        console.error('Error: shutdown requires <name> argument or --all flag');
        process.exit(1);
      }
      await teamShutdown(positionalArgs[0] || '', options);
      break;

    case 'cleanup':
      await teamCleanup();
      break;

    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      process.exit(1);
  }
}
