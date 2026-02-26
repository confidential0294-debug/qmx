#!/usr/bin/env node

/**
 * QMX - Qwen Multi-agent eXtension
 * Main CLI entry point with fallback support
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

// Try compiled first, fall back to source
const distEntry = join(root, 'dist', 'cli', 'launch.js');
const srcEntry = join(root, 'src', 'cli', 'launch.ts');

const args = process.argv.slice(2);
const command = args[0];

// Handle built-in commands that don't need launch
const builtInCommands = ['setup', 'doctor', 'team', 'hooks', 'hud', 'status', 'cancel', 'reasoning'];

// Launch Qwen Code when run without arguments (like omx)
if (args.length === 0) {
  launchQwenCode();
}

// Show help only for --help or -h
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
  // Unknown command
  console.error(`Unknown command: ${command}`);
  console.log('Run "qmx --help" for usage');
  process.exit(1);
}

// Launch Qwen Code
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

// Run a QMX command
async function runCommand(command, commandArgs) {
  try {
    // Try compiled first
    if (existsSync(distEntry.replace('launch.js', `${command}.js`))) {
      const module = await import(`../dist/cli/${command}.js`);
      if (module.default) {
        await module.default(commandArgs);
      } else {
        console.log(`Command '${command}' executed`);
      }
    } else {
      console.error(`Command '${command}' not found. Run "npm run build" first.`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error running ${command}:`, error.message);
    process.exit(1);
  }
}

// Show help
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
  qmx setup               Initialize QMX
  qmx doctor              Check installation
  qmx status              Show current status
  qmx --high              Launch with high reasoning
  npm run setup           Run setup via npm script
  npm run doctor          Run doctor via npm script
`);
}
