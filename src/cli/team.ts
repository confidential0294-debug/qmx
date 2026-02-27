/**
 * QMX Team Command
 * 
 * Manages team lifecycle: create, list, status, shutdown
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'node:readline';
import {
  startTeam,
  shutdownTeam,
  monitorTeam,
  listTeamSessions,
  
  isTmuxAvailable,
  sanitizeTeamName,
} from '../team/runtime.js';

export function teamCommand(program: Command) {
  const team = program
    .command('team')
    .description('Manage agent teams');

  team
    .command('start')
    .argument('<workers>', 'Number of workers (e.g., 3:executor)')
    .argument('[task]', 'Task description')
    .option('--name <name>', 'Team name')
    .option('--yolo', 'Auto-approve all actions', true)
    .option('--model <model>', 'Model to use')
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
    .command('monitor')
    .description('Monitor team progress')
    .argument('<name>', 'Team name')
    .option('--interval <ms>', 'Poll interval in ms', '2000')
    .action(async (name, options) => {
      await teamMonitor(name, options);
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
}

/**
 * Prompt user for input
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function teamStart(
  workersArg: string,
  task: string | undefined,
  options: { name?: string; yolo?: boolean; model?: string }
) {
  if (!isTmuxAvailable()) {
    console.error(chalk.red('Error: tmux is required for team mode'));
    console.error(chalk.yellow('Install tmux: apt install tmux / brew install tmux'));
    process.exit(1);
  }

  if (!process.env.TMUX) {
    console.error(chalk.red('Error: Team mode requires running inside tmux'));
    console.error(chalk.yellow('Start tmux first, then run this command'));
    process.exit(1);
  }

  const spinner = ora('Starting team...').start();
  
  try {
    const [countStr, role] = workersArg.split(':');
    const workerCount = parseInt(countStr);
    
    if (isNaN(workerCount) || workerCount < 1) {
      throw new Error('Invalid worker count. Use format: N:role (e.g., 3:executor)');
    }
    
    if (!role) {
      throw new Error('Invalid role format. Use format: N:role (e.g., 3:executor)');
    }

    // Prompt for task if not provided
    if (!task) {
      spinner.stop();
      task = await prompt(chalk.cyan('Enter task description: '));
      
      if (!task || task.trim() === '') {
        console.error(chalk.red('Error: Task description is required'));
        process.exit(1);
      }
      
      spinner.start('Starting team...');
    }

    const teamName = options.name || `team-${Date.now()}`;
    const sanitized = sanitizeTeamName(teamName);
    
    // Start team
    const runtime = await startTeam(
      sanitized,
      task,
      role,
      workerCount,
      [{ subject: 'Main task', description: task }],
      process.cwd(),
      {
        yolo: options.yolo ?? true,
        model: options.model,
      }
    );

    spinner.succeed(chalk.green(`Team "${runtime.config.name}" started with ${workerCount} workers`));
    
    console.log('\n' + chalk.cyan.bold('Team Info:'));
    console.log(chalk.gray('='.repeat(60)));
    console.log(`  Name:        ${chalk.bold(runtime.config.name)}`);
    console.log(`  Role:        ${runtime.config.agentType}`);
    console.log(`  Workers:     ${chalk.bold(workerCount.toString())}`);
    console.log(`  Task:        ${task}`);
    console.log(`  tmux:        ${runtime.config.tmux_session || 'N/A'}`);
    console.log(`  Leader Pane: ${runtime.config.leader_pane_id || 'N/A'}`);
    console.log(`  YOLO Mode:   ${true ? chalk.green('enabled') : chalk.yellow('disabled')}`);
    console.log(chalk.gray('='.repeat(60)));
    console.log(`\n${chalk.cyan.bold('Commands:')}`);
    console.log(`  Monitor:  ${chalk.yellow(`qmx team monitor ${runtime.config.name}`)}`);
    console.log(`  Status:   ${chalk.yellow(`qmx team status ${runtime.config.name}`)}`);
    console.log(`  Shutdown: ${chalk.yellow(`qmx team shutdown ${runtime.config.name}`)}`);
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to start team'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function teamList(options: { json?: boolean }) {
  try {
    const sessions = listTeamSessions();
    
    if (options.json) {
      console.log(JSON.stringify({ sessions }, null, 2));
      return;
    }
    
    if (sessions.length === 0) {
      console.log(chalk.gray('No active teams'));
      return;
    }
    
    console.log(chalk.bold.cyan('\nActive Teams\n'));
    console.log(chalk.gray('='.repeat(60)));
    
    for (const session of sessions) {
      const teamName = session.replace('qmx-team-', '');
      console.log(`\n${chalk.green('●')} ${chalk.bold(teamName)}`);
      console.log(`  tmux Session: ${session}`);
    }
    
    console.log('\n' + chalk.gray('='.repeat(60)));
    console.log(`Total: ${chalk.bold(sessions.length.toString())} team(s)`);
    
  } catch (error) {
    console.error(chalk.red('Failed to list teams'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function teamStatus(name: string, options: { json?: boolean }) {
  const spinner = ora('Fetching team status...').start();
  
  try {
    const snapshot = await monitorTeam(name, process.cwd());
    
    if (!snapshot) {
      spinner.fail(chalk.red(`Team "${name}" not found`));
      process.exit(1);
    }
    
    if (options.json) {
      console.log(JSON.stringify(snapshot, null, 2));
      spinner.succeed();
      return;
    }
    
    spinner.succeed();
    
    console.log('\n' + chalk.bold.cyan(`Team: ${snapshot.teamName}`));
    console.log(chalk.gray('='.repeat(60)));
    
    console.log(`\n${chalk.bold('Task Summary')}`);
    console.log(`  Total:      ${snapshot.tasks.total}`);
    console.log(`  Pending:    ${chalk.yellow(snapshot.tasks.pending.toString())}`);
    console.log(`  In Progress:${chalk.blue(snapshot.tasks.in_progress.toString())}`);
    console.log(`  Blocked:    ${chalk.red(snapshot.tasks.blocked.toString())}`);
    console.log(`  Completed:  ${chalk.green(snapshot.tasks.completed.toString())}`);
    console.log(`  Failed:     ${chalk.red(snapshot.tasks.failed.toString())}`);
    
    console.log(`\n${chalk.bold('Workers')}`);
    console.log(`  Total:           ${snapshot.workerCount}`);
    console.log(`  Alive:           ${chalk.green((snapshot.workerCount - snapshot.deadWorkers.length).toString())}`);
    console.log(`  Dead:            ${chalk.red(snapshot.deadWorkers.length.toString())}`);
    console.log(`  Not Reporting:   ${chalk.yellow(snapshot.nonReportingWorkers.length.toString())}`);
    
    if (snapshot.workers.length > 0) {
      console.log(`\n${chalk.bold('Worker Details')}`);
      for (const worker of snapshot.workers) {
        const icon = worker.alive ? chalk.green('●') : chalk.red('●');
        console.log(`  ${icon} ${worker.name}`);
        console.log(`     Status: ${worker.status?.state || 'unknown'}`);
        console.log(`     Tasks:  ${worker.assignedTasks.join(', ') || 'none'}`);
      }
    }
    
    const allDone = snapshot.allTasksTerminal;
    console.log(`\n${chalk.bold('Status')}: ${allDone ? chalk.green('All tasks terminal') : chalk.yellow('Work in progress')}`);
    console.log(chalk.gray('='.repeat(60)));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to get team status'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function teamMonitor(name: string, options: { interval?: string }) {
  const interval = parseInt(options.interval || '2000');
  
  console.log(chalk.cyan.bold(`Monitoring team: ${name}`));
  console.log(chalk.gray(`Poll interval: ${interval}ms`));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));
  
  const poll = async () => {
    try {
      const snapshot = await monitorTeam(name, process.cwd());
      
      if (!snapshot) {
        console.log(chalk.red('Team not found or already shutdown'));
        return false;
      }
      
      process.stdout.write('\x1Bc');
      console.log(chalk.cyan.bold(`Team: ${snapshot.teamName}`));
      console.log(chalk.gray('='.repeat(60)));
      console.log(`Tasks: ${snapshot.tasks.pending} pending, ${snapshot.tasks.in_progress} in progress, ${snapshot.tasks.completed} completed`);
      console.log(`Workers: ${snapshot.workerCount - snapshot.deadWorkers.length} alive, ${snapshot.deadWorkers.length} dead`);
      console.log(chalk.gray('='.repeat(60)));
      
      if (snapshot.allTasksTerminal) {
        console.log(chalk.green('\nAll tasks completed!'));
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      return false;
    }
  };
  
  let running = await poll();
  
  while (running) {
    await new Promise(resolve => setTimeout(resolve, interval));
    running = await poll();
  }
}

async function teamShutdown(name: string, options: { all?: boolean; force?: boolean }) {
  const spinner = ora('Shutting down team...').start();
  
  try {
    if (options.all) {
      const sessions = listTeamSessions();
      let count = 0;
      
      for (const session of sessions) {
        const teamName = session.replace('qmx-team-', '');
        try {
          await shutdownTeam(teamName, process.cwd(), { force: options.force });
          count++;
        } catch {
          // Continue with other teams
        }
      }
      
      spinner.succeed(chalk.green(`Shutdown ${count} team(s)`));
    } else {
      await shutdownTeam(name, process.cwd(), { force: options.force });
      spinner.succeed(chalk.green(`Team "${name}" shutdown`));
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to shutdown team'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
