#!/usr/bin/env node

/**
 * QMX - Qwen Multi-agent eXtension
 * Main CLI entry point
 */

import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

// Show help if no command
if (args.length === 0 || command === '--help' || command === '-h') {
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
  qmx                     Launch QMX in current directory
  qmx setup               Initialize QMX
  qmx doctor              Check installation
  qmx status              Show current status
  qmx --high              Launch with high reasoning
`);
  process.exit(0);
}

// Show version
if (command === '--version' || command === '-V') {
  console.log('1.0.0');
  process.exit(0);
}

// Simple command routing
const cmd = command === 'setup' || command === 'doctor' || command === 'status' || 
            command === 'cancel' || command === 'reasoning' || command === 'team' ||
            command === 'hooks' || command === 'hud' ? command : null;

if (cmd) {
  // Import and run the command module directly
  try {
    const module = await import(`../dist/cli/${cmd}.js`);
    if (module.default) {
      await module.default(args.slice(1));
    } else {
      console.log(`Command '${cmd}' executed`);
    }
  } catch (error) {
    console.error(`Error running ${cmd}:`, error.message);
    process.exit(1);
  }
} else {
  // Launch Qwen Code with QMX
  const project = args[args.length - 1];
  const options = args.filter(a => a.startsWith('--'));
  
  console.log('Launching QMX...');
  console.log('Project:', project || process.cwd());
  console.log('Options:', options.join(' ') || 'none');
  console.log('\nQMX is ready! Run "qmx setup" to initialize your project.');
}
