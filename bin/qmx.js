#!/usr/bin/env node

/**
 * QMX - Qwen Multi-agent eXtension
 * Main CLI entry point
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { Command } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

const distEntry = join(root, 'dist', 'cli', 'launch.js');
const args = process.argv.slice(2);
const command = args[0];

const builtInCommands = ['setup', 'doctor', 'team', 'hooks', 'hud', 'status', 'cancel', 'reasoning'];

// Launch Qwen Code when run without arguments
if (args.length === 0) {
  launchQwenCode();
}

// Show help
if (command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

// Show version
if (command === '--version' || command === '-V') {
  console.log('1.0.0');
  process.exit(0);
}

// Handle built-in commands
if (builtInCommands.includes(command)) {
  runCommand(command, args.slice(1));
} else if (args.length > 0 && !command.startsWith('--')) {
  console.error(`Unknown command: ${command}`);
  console.log('Run "qmx --help" for usage');
  process.exit(1);
}

function launchQwenCode() {
  const qwen = spawn('qwen', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      QMX_ENABLED: '1',
      QMX_SESSION_ID: `session-${Date.now()}`,
    }
  });
  
  qwen.on('error', (error) => {
    console.error('Failed to start Qwen Code:', error.message);
    console.log('\nMake sure Qwen Code CLI is installed:');
    console.log('  npm install -g @qwen-code/cli');
    process.exit(1);
  });
  
  qwen.on('close', (code) => {
    if (code !== 0) {
      process.exit(code);
    }
  });
}

async function runCommand(commandName, commandArgs) {
  try {
    const modulePath = join(root, 'dist', 'cli', `${commandName}.js`);
    if (!existsSync(modulePath)) {
      console.error(`Command '${commandName}' not found. Run "npm run build" first.`);
      process.exit(1);
    }
    
    const module = await import(modulePath);
    
    // Create program and register command
    const program = new Command();
    program.name('qmx').version('1.0.0');
    
    if (module[`${commandName}Command`]) {
      module[`${commandName}Command`](program);
      program.parse(['node', 'qmx', commandName, ...commandArgs]);
    } else if (module.default) {
      await module.default(commandArgs);
    } else {
      console.log(`Command '${commandName}' executed`);
    }
  } catch (error) {
    console.error(`Error running ${commandName}:`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
QMX - Qwen Multi-agent eXtension v1.0.0

Usage: qmx [command] [options]

Commands:
  setup       Initialize QMX for your project
  doctor      Check QMX installation and configuration
  team        Manage agent teams
  hooks       Manage hook plugins
  hud         Heads-Up Display for monitoring
  status      Show active QMX status
  cancel      Cancel active executions
  reasoning   Set reasoning effort level

Options:
  --yolo      Bypass all approvals (use with caution)
  --high      High reasoning effort
  --xhigh     Extra high reasoning effort
  --verbose   Verbose output
  --no-hud    Disable HUD display
  --version   Show version number
  --help      Show help

Examples:
  qmx                     Launch Qwen Code
  qmx team start 2:debugger "Find bugs" --name test
  qmx team list
  qmx team status <name>
  qmx setup               Initialize QMX
  qmx doctor              Check installation
`);
}
