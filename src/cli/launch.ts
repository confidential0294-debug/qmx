/**
 * QMX Launch Command
 * 
 * Main launch functionality for QMX-enhanced Qwen Code sessions
 */

import { Command } from 'commander';
import { execSync, spawn } from 'node:child_process';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';
import ora from 'ora';

const QMX_DIR = join(process.cwd(), '.qmx');
const STATE_DIR = join(QMX_DIR, 'state');
const SESSIONS_DIR = join(STATE_DIR, 'sessions');

export function launchCommand(program: Command) {
  program
    .argument('[project]', 'Project directory', process.cwd())
    .option('--yolo', 'Bypass all approvals (use with caution)')
    .option('--high', 'High reasoning effort')
    .option('--xhigh', 'Extra high reasoning effort')
    .option('--verbose', 'Verbose output')
    .option('--dry-run', 'Simulate without executing')
    .option('--no-hud', 'Disable HUD display')
    .option('--reasoning <level>', 'Set reasoning effort (low|medium|high|xhigh)')
    .action(async (project, options) => {
      await launch(project, options);
    });
}

export async function launch(project: string, options: any) {
  const spinner = ora('Launching QMX...').start();
  
  try {
    // Validate project directory
    spinner.text = 'Validating project...';
    
    // Ensure .qmx directory exists
    await mkdir(QMX_DIR, { recursive: true });
    await mkdir(STATE_DIR, { recursive: true });
    await mkdir(SESSIONS_DIR, { recursive: true });
    
    // Generate session ID
    const sessionId = `session-${uuidv4().slice(0, 8)}`;
    
    // Create session state
    spinner.text = 'Initializing session...';
    const sessionState = {
      sessionId,
      status: 'initializing',
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      activeTeams: [],
      activeModes: [],
      options,
      project,
    };
    
    await writeFile(
      join(SESSIONS_DIR, `${sessionId}.json`),
      JSON.stringify(sessionState, null, 2)
    );
    
    // Generate Qwen Code overlay configuration
    spinner.text = 'Generating configuration...';
    await generateOverlayConfig(options);
    
    // Check for Qwen Code installation
    let qwenCmd: string;
    try {
      execSync('qwen --version', { stdio: 'ignore' });
      qwenCmd = 'qwen';
    } catch {
      spinner.warn(chalk.yellow('Qwen Code CLI not found in PATH'));
      console.log(chalk.gray('Attempting to launch anyway...'));
      qwenCmd = 'qwen';
    }
    
    spinner.succeed(chalk.green('QMX ready!'));
    
    console.log('\n' + chalk.bold.cyan('Session Information'));
    console.log(chalk.gray('='.repeat(60)));
    console.log(`  Session ID: ${chalk.bold(sessionId)}`);
    console.log(`  Project: ${chalk.bold(project)}`);
    console.log(`  Reasoning: ${chalk.bold(options.reasoning || options.xhigh ? 'xhigh' : options.high ? 'high' : 'medium')}`);
    
    if (options.yolo) {
      console.log(`  Mode: ${chalk.red.bold('YOLO (no approvals)')}`);
    }
    
    if (!options.hud) {
      console.log(`  HUD: ${chalk.gray('Disabled')}`);
    }
    
    console.log(chalk.gray('='.repeat(60)));
    
    console.log('\n' + chalk.cyan('Available Commands:'));
    console.log('  ' + chalk.yellow('/prompts:<agent>'));
    console.log('    architect, planner, executor, debugger, reviewer, security, ...');
    console.log('  ' + chalk.yellow('$<skill>'));
    console.log('    plan, team, review, test, refactor, research, ...');
    console.log('  ' + chalk.yellow('$team N:role'));
    console.log('    Launch parallel agent teams');
    
    console.log('\n' + chalk.gray('Press Ctrl+C to end session'));
    console.log(chalk.gray('Session state saved to: .qmx/state/sessions/\n'));
    
    // Build Qwen Code command
    const qwenArgs: string[] = [];
    
    if (options.yolo) {
      qwenArgs.push('--yolo');
    }
    
    if (options.verbose) {
      qwenArgs.push('--verbose');
    }
    
    // Set working directory
    const launchOptions = {
      cwd: project,
      stdio: 'inherit' as const,
      env: {
        ...process.env,
        QMX_SESSION_ID: sessionId,
        QMX_ENABLED: '1',
      },
    };
    
    // Launch Qwen Code
    try {
      const qwen = spawn(qwenCmd, qwenArgs, launchOptions);
      
      qwen.on('error', (error) => {
        console.error(chalk.red('Failed to start Qwen Code:'), error.message);
        console.log(chalk.yellow('\nMake sure Qwen Code CLI is installed:'));
        console.log(chalk.gray('  npm install -g @qwen-code/cli'));
      });
      
      qwen.on('close', (code) => {
        // Update session state
        updateSessionState(sessionId, {
          status: 'ended',
          endTime: new Date().toISOString(),
        }).catch(console.error);
        
        if (code !== 0) {
          console.log(chalk.yellow(`\nQwen Code exited with code ${code}`));
        } else {
          console.log(chalk.green('\nSession ended'));
        }
      });
      
    } catch (error) {
      throw new Error('Failed to launch Qwen Code. Make sure it\'s installed.');
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Launch failed'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function generateOverlayConfig(options: any) {
  const config: any = {
    multi_agent: {
      enabled: true,
      prompts_directory: await findPromptsDirectory(),
      skills_directory: await findSkillsDirectory(),
    },
    mcp: {
      servers: {
        'qmx-state': {
          command: 'node',
          args: [findMcpServerPath('state-server.js')],
        },
        'qmx-memory': {
          command: 'node',
          args: [findMcpServerPath('memory-server.js')],
        },
      },
    },
  };
  
  // Add reasoning effort
  if (options.reasoning) {
    config.reasoning = { effort: options.reasoning };
  } else if (options.xhigh) {
    config.reasoning = { effort: 'xhigh' };
  } else if (options.high) {
    config.reasoning = { effort: 'high' };
  }
  
  // Add YOLO mode
  if (options.yolo) {
    config.approvals = { bypass: true };
  }
  
  // Write overlay config
  const overlayPath = join(QMX_DIR, 'qwen-overlay.json');
  await writeFile(overlayPath, JSON.stringify(config, null, 2));
  
  return config;
}

async function updateSessionState(sessionId: string, updates: any) {
  const statePath = join(SESSIONS_DIR, `${sessionId}.json`);
  
  try {
    const current = JSON.parse(await readFile(statePath, 'utf-8'));
    const updated = { ...current, ...updates };
    await writeFile(statePath, JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error('Failed to update session state:', error);
  }
}

async function findPromptsDirectory(): Promise<string> {
  // Try common locations
  const paths = [
    join(process.cwd(), 'prompts'),
    join(__dirname, '..', '..', 'prompts'),
    join(process.argv[1], '..', '..', 'prompts'),
  ];
  
  for (const path of paths) {
    try {
      await readFile(join(path, 'architect.md'));
      return path;
    } catch {
      // Try next path
    }
  }
  
  return join(process.cwd(), 'prompts');
}

async function findSkillsDirectory(): Promise<string> {
  const paths = [
    join(process.cwd(), 'skills'),
    join(__dirname, '..', '..', 'skills'),
    join(process.argv[1], '..', '..', 'skills'),
  ];
  
  for (const path of paths) {
    try {
      await readFile(join(path, 'plan', 'SKILL.md'));
      return path;
    } catch {
      // Try next path
    }
  }
  
  return join(process.cwd(), 'skills');
}

function findMcpServerPath(serverFile: string): string {
  const paths = [
    join(process.cwd(), 'dist', 'mcp', serverFile),
    join(__dirname, '..', 'mcp', serverFile),
    join(process.argv[1], '..', '..', 'dist', 'mcp', serverFile),
  ];
  
  return paths[0]; // Default to first path
}
