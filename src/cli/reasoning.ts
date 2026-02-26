/**
 * QMX Reasoning Command
 * 
 * Set reasoning effort level for Qwen Code
 */

import { Command } from 'commander';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';

const QMX_DIR = join(process.cwd(), '.qmx');
const CONFIG_PATH = join(QMX_DIR, 'config.toml');

export function reasoningCommand(program: Command) {
  program
    .command('reasoning')
    .description('Set reasoning effort level')
    .argument('[level]', 'Effort level (low|medium|high|xhigh)', 'medium')
    .option('--show', 'Show current setting')
    .option('--permanent', 'Save to config permanently')
    .action(async (level, options) => {
      await setReasoning(level, options);
    });
}

async function setReasoning(level: string, options: { show?: boolean; permanent?: boolean }) {
  const validLevels = ['low', 'medium', 'high', 'xhigh'];
  
  if (options.show) {
    await showReasoning();
    return;
  }
  
  if (!validLevels.includes(level)) {
    console.error(chalk.red(`Invalid reasoning level: ${level}`));
    console.error(chalk.gray(`Valid levels: ${validLevels.join(', ')}`));
    process.exit(1);
  }
  
  console.log(chalk.cyan('\nReasoning Effort Configuration'));
  console.log(chalk.gray('='.repeat(50)));
  
  console.log(`\nSetting reasoning level to: ${chalk.bold(getLevelDisplay(level))}`);
  
  if (options.permanent) {
    await saveToConfig(level);
    console.log(chalk.green('✓ Saved to config.toml'));
  } else {
    console.log(chalk.yellow('ℹ Temporary (session only)'));
    console.log(chalk.gray('  Use --permanent to save permanently'));
  }
  
  console.log('\n' + chalk.gray('Reasoning Levels:'));
  console.log(`  ${chalk.gray('low')}      - Fast, minimal reasoning`);
  console.log(`  ${chalk.gray('medium')}   - Balanced speed and quality (default)`);
  console.log(`  ${chalk.gray('high')}     - Thorough reasoning, slower`);
  console.log(`  ${chalk.gray('xhigh')}    - Maximum reasoning, slowest`);
  
  console.log('\n' + chalk.cyan('Usage:'));
  console.log('  qmx --high          - Launch with high reasoning');
  console.log('  qmx --xhigh         - Launch with extra high reasoning');
  console.log('  qmx reasoning high  - Set default to high');
  console.log();
}

async function showReasoning() {
  try {
    const config = await readConfig();
    const currentLevel = config.reasoning?.default_effort || 'medium';
    
    console.log(chalk.cyan('\nCurrent Reasoning Setting'));
    console.log(chalk.gray('='.repeat(50)));
    console.log(`\nDefault Level: ${chalk.bold(getLevelDisplay(currentLevel))}`);
    
    // Check environment variable
    const envLevel = process.env.QMX_REASONING_EFFORT;
    if (envLevel) {
      console.log(`Environment:   ${chalk.yellow(getLevelDisplay(envLevel))}`);
    }
    
    console.log();
  } catch {
    console.log(chalk.yellow('No configuration found'));
    console.log(chalk.gray('Default reasoning level: medium'));
  }
}

async function readConfig(): Promise<any> {
  try {
    const content = await readFile(CONFIG_PATH, 'utf-8');
    // Simple TOML parsing (production should use proper TOML parser)
    const config: any = {};
    const lines = content.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1);
        config[currentSection] = {};
        continue;
      }
      
      const [key, value] = trimmed.split('=').map(s => s.trim());
      if (key && value) {
        const cleanValue = value.replace(/"/g, '');
        if (currentSection) {
          config[currentSection][key] = cleanValue;
        } else {
          config[key] = cleanValue;
        }
      }
    }
    
    return config;
  } catch {
    return {};
  }
}

async function saveToConfig(level: string) {
  try {
    let content = '';
    
    try {
      content = await readFile(CONFIG_PATH, 'utf-8');
    } catch {
      // Create new config
      content = `# QMX Configuration\n\n`;
    }
    
    // Update or add reasoning section
    if (content.includes('[reasoning]')) {
      content = content.replace(
        /(default_effort\s*=\s*)"[^"]*"/,
        `$1"${level}"`
      );
    } else {
      content += `\n[reasoning]\ndefault_effort = "${level}"\n`;
    }
    
    await writeFile(CONFIG_PATH, content);
  } catch (error) {
    throw new Error('Failed to save config: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function getLevelDisplay(level: string): string {
  const displays: Record<string, string> = {
    low: '⚡ Low (Fast)',
    medium: '⚖️  Medium (Balanced)',
    high: '🎯 High (Thorough)',
    xhigh: '🔬 XHigh (Maximum)',
  };

  return displays[level] || level;
}

/**
 * Default export for CLI execution from bin/qmx.js
 */
export default async function run(args: string[]) {
  const options: { show?: boolean; permanent?: boolean } = {};
  let level = 'medium';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--show') {
      options.show = true;
    } else if (arg === '--permanent') {
      options.permanent = true;
    } else if (!arg.startsWith('-')) {
      // Check if it's a valid level
      const validLevels = ['low', 'medium', 'high', 'xhigh'];
      if (validLevels.includes(arg)) {
        level = arg;
      }
    }
  }

  await setReasoning(level, options);
}
