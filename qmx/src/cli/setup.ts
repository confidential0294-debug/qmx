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

    // Install MCP servers
    spinner.text = 'Installing MCP servers...';
    await installMcpServers(qmxDir, options.force);

    // Install skills
    spinner.text = 'Installing workflow skills...';
    await installSkills(qmxDir, options.force);

    // Install agent prompts
    spinner.text = 'Installing agent prompts...';
    await installPrompts(qmxDir, options.force);

    // Verify installation
    spinner.text = 'Verifying installation...';
    await verifyInstallation(qmxDir);

    spinner.succeed(chalk.green('QMX setup complete!'));

    console.log('\n' + chalk.cyan('Next steps:'));
    console.log('  1. Run ' + chalk.yellow('qmx doctor') + ' to verify installation');
    console.log('  2. Run ' + chalk.yellow('qmx') + ' to launch QMX');
    console.log('  3. Create custom hooks in ' + chalk.yellow('.qmx/hooks/'));
    console.log('  4. Skills: ' + chalk.yellow('/skill:plan'), chalk.yellow('/skill:team'));
    console.log('  5. Agents: ' + chalk.yellow('/prompts:architect'));
    console.log('  6. Terminal: ' + chalk.yellow('team 3:executor "task"'));

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
 * Install workflow skills
 */
async function installSkills(qmxDir: string, _force: boolean | undefined) {
  const skillsDir = join(qmxDir, 'skills');
  const globalSkillsDir = join(process.env.HOME || '', 'qmx', 'skills');
  
  // Create skills directory
  await mkdir(skillsDir, { recursive: true });
  
  // Try to copy from global install
  try {
    const { cp } = await import('node:fs/promises');
    const skills = await import('node:fs/promises').then(fs => 
      fs.readdir(globalSkillsDir, { withFileTypes: true })
    );
    
    for (const skill of skills) {
      if (skill.isDirectory()) {
        try {
          await cp(
            join(globalSkillsDir, skill.name),
            join(skillsDir, skill.name),
            { recursive: true }
          );
        } catch {
          // Skip if already exists or error
        }
      }
    }
  } catch {
    // Global skills not found, will use from QMX directory
  }
}

/**
 * Install agent prompts
 */
async function installPrompts(qmxDir: string, _force: boolean | undefined) {
  const promptsDir = join(qmxDir, 'prompts');
  const globalPromptsDir = join(process.env.HOME || '', 'qmx', 'prompts');
  
  // Create prompts directory
  await mkdir(promptsDir, { recursive: true });
  
  // Try to copy from global install
  try {
    const { cp } = await import('node:fs/promises');
    const prompts = await import('node:fs/promises').then(fs => 
      fs.readdir(globalPromptsDir)
    );
    
    for (const prompt of prompts) {
      if (prompt.endsWith('.md')) {
        try {
          await cp(
            join(globalPromptsDir, prompt),
            join(promptsDir, prompt),
            { recursive: true }
          );
        } catch {
          // Skip if already exists or error
        }
      }
    }
  } catch {
    // Global prompts not found, will use from QMX directory
  }
}

/**
 * Verify complete installation
 */
async function verifyInstallation(qmxDir: string) {
  const { access } = await import('node:fs/promises');
  
  // Check for skills
  const skillsDir = join(qmxDir, 'skills');
  try {
    await access(skillsDir);
  } catch {
    throw new Error('Skills directory not created');
  }
  
  // Check for prompts
  const promptsDir = join(qmxDir, 'prompts');
  try {
    await access(promptsDir);
  } catch {
    throw new Error('Prompts directory not created');
  }
  
  // Verify MCP servers (reuse existing function)
  await verifyMcpServers(qmxDir);
}

/**
 * Install MCP servers to project
 */
async function installMcpServers(qmxDir: string, _force: boolean | undefined) {
  const mcpDir = join(qmxDir, 'mcp');
  const configPath = join(qmxDir, 'mcp-config.json');

  // Create MCP directory
  await mkdir(mcpDir, { recursive: true });

  // Create MCP configuration
  const mcpConfig = {
    version: '1.0.0',
    servers: {
      'qmx-state': {
        command: 'node',
        args: ['dist/mcp/state-server.js'],
        enabled: true,
        description: 'State management for sessions and teams',
      },
      'qmx-memory': {
        command: 'node',
        args: ['dist/mcp/memory-server.js'],
        enabled: true,
        description: 'Persistent project memory',
      },
      'qmx-code-intel': {
        command: 'node',
        args: ['dist/mcp/code-intel-server.js'],
        enabled: true,
        description: 'Code intelligence and symbol tracking',
      },
      'qmx-trace': {
        command: 'node',
        args: ['dist/mcp/trace-server.js'],
        enabled: true,
        description: 'Execution tracing and audit trail',
      },
    },
  };

  await writeFile(configPath, JSON.stringify(mcpConfig, null, 2));

  // Create MCP readme
  const readmePath = join(mcpDir, 'README.md');
  const readme = `# QMX MCP Servers

These MCP servers provide state management, memory, code intelligence, and tracing for QMX.

## Available Servers

1. **qmx-state** - Session and team state management
2. **qmx-memory** - Persistent project memory
3. **qmx-code-intel** - Code symbol tracking and analysis
4. **qmx-trace** - Execution tracing and audit trail

## Configuration

See \`.qmx/mcp-config.json\` for server configuration.

## Usage

MCP servers are automatically started when QMX launches.
`;
  await writeFile(readmePath, readme);
}

/**
 * Verify MCP servers are built and available
 */
async function verifyMcpServers(qmxDir: string) {
  const { access } = await import('node:fs/promises');
  // Check multiple possible locations for MCP servers
  const possiblePaths = [
    join(qmxDir, '..', 'dist', 'mcp'),  // Project install
    join(qmxDir, 'dist', 'mcp'),         // Local dist
    join(process.env.HOME || '', 'qmx', 'dist', 'mcp'),  // Global install in WSL
  ];

  const servers = [
    'state-server.js',
    'memory-server.js',
    'code-intel-server.js',
    'trace-server.js',
  ];

  let allFound = false;

  for (const distDir of possiblePaths) {
    let found = 0;
    for (const server of servers) {
      try {
        await access(join(distDir, server));
        found++;
      } catch {
        // Server not found in this path
      }
    }
    if (found === servers.length) {
      allFound = true;
      break;
    }
  }

  if (!allFound) {
    throw new Error(
      `MCP servers not built. Missing: ${servers.join(', ')}\n` +
      `Run: npm run build`
    );
  }
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
