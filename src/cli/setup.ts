/**
 * QMX Setup Command
 * 
 * Initializes QMX for a project, creating necessary directories and configuration.
 */

import { Command } from 'commander';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import ora from 'ora';
import chalk from 'chalk';

export function setupCommand(program: Command) {
  program
    .command('setup')
    .description('Initialize QMX for your project')
    .option('--force', 'Overwrite existing configuration')
    .action(async (options) => {
      await setup(options);
    });
}

async function setup(options: { force?: boolean }) {
  const spinner = ora('Setting up QMX...').start();
  const cwd = process.cwd();
  const qmxDir = join(cwd, '.qmx');
  
  try {
    // Create directories
    spinner.text = 'Creating directories...';
    await createDirectories(qmxDir, options.force);

    // Create configuration
    spinner.text = 'Creating configuration...';
    await createConfig(qmxDir, options.force);

    // Create project memory
    spinner.text = 'Initializing project memory...';
    await createProjectMemory(qmxDir, options.force);

    // Create hooks directory
    spinner.text = 'Setting up hooks...';
    await createHooksDir(qmxDir, options.force);

    spinner.succeed(chalk.green('QMX setup complete!'));
    
    console.log('\n' + chalk.cyan('Next steps:'));
    console.log('  1. Run ' + chalk.yellow('qmx doctor') + ' to verify installation');
    console.log('  2. Run ' + chalk.yellow('qmx') + ' to launch QMX');
    console.log('  3. Create custom hooks in ' + chalk.yellow('.qmx/hooks/'));
    
  } catch (error) {
    spinner.fail(chalk.red('Setup failed'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function createDirectories(qmxDir: string, force: boolean | undefined) {
  const dirs = [
    qmxDir,
    join(qmxDir, 'state'),
    join(qmxDir, 'state', 'sessions'),
    join(qmxDir, 'state', 'teams'),
    join(qmxDir, 'plans'),
    join(qmxDir, 'logs'),
    join(qmxDir, 'hooks'),
  ];

  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      if (!force && (error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new Error(`Directory ${dir} already exists. Use --force to overwrite.`);
      }
    }
  }
}

async function createConfig(qmxDir: string, force: boolean | undefined) {
  const configPath = join(qmxDir, 'config.toml');
  
  const config = `# QMX Configuration
# See docs/config.md for all options

[team]
default_workers = 3
timeout_minutes = 30
auto_shutdown = true

[hud]
enabled = true
refresh_rate_ms = 1000

[notifications]
tmux = true
discord = false
telegram = false

[reasoning]
default_effort = "medium"
`;

  try {
    await writeFile(configPath, config);
  } catch (error) {
    if (!force && (error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error('config.toml already exists. Use --force to overwrite.');
    }
    throw error;
  }
}

async function createProjectMemory(qmxDir: string, force: boolean | undefined) {
  const memoryPath = join(qmxDir, 'project-memory.json');
  
  const memory = {
    projectName: getNameFromDir(process.cwd()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    architecture: {
      overview: '',
      components: [],
      technologies: [],
    },
    decisions: [],
    knowledge: [],
    conventions: [],
    todos: [],
  };

  try {
    await writeFile(memoryPath, JSON.stringify(memory, null, 2));
  } catch (error) {
    if (!force && (error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error('project-memory.json already exists. Use --force to overwrite.');
    }
    throw error;
  }
}

async function createHooksDir(qmxDir: string, force: boolean | undefined) {
  const hooksDir = join(qmxDir, 'hooks');
  const exampleHook = join(hooksDir, 'example.mjs');
  
  const example = `// QMX Hook Plugin Example
// See docs/hooks-extension.md for full API

export const events = ['session-start', 'turn-complete'];

export async function sessionStart(sdk) {
  sdk.log.info('Session started!');
  await sdk.state.set('sessionStartTime', Date.now());
  
  // Send notification
  await sdk.notify('info', 'QMX session started');
}

export async function turnComplete(sdk) {
  const state = await sdk.state.get();
  sdk.log.info(\`Turn completed. Active tasks: \${state.activeTasks?.length || 0}\`);
}
`;

  try {
    await writeFile(exampleHook, example);
  } catch (error) {
    if (!force && (error as NodeJS.ErrnoException).code === 'EEXIST') {
      // Skip if exists
      return;
    }
    throw error;
  }
}

function getNameFromDir(dir: string): string {
  return dir.split(/[\\/]/).pop() || 'unknown';
}

/**
 * Default export for CLI execution from bin/qmx.js
 */
export default async function run(args: string[]) {
  const options: { force?: boolean } = {};

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--force') {
      options.force = true;
    }
  }

  await setup(options);
}
