/**
 * QMX Hooks Command
 * 
 * Manages hook plugins: init, status, validate, test
 */

import { Command } from 'commander';
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { access } from 'node:fs/promises';
import chalk from 'chalk';
import ora from 'ora';

const QMX_DIR = join(process.cwd(), '.qmx');
const HOOKS_DIR = join(QMX_DIR, 'hooks');

export function hooksCommand(program: Command) {
  const hooks = program
    .command('hooks')
    .description('Manage hook plugins');

  hooks
    .command('init')
    .description('Initialize hooks directory')
    .option('--force', 'Overwrite existing')
    .action(async (options) => {
      await hooksInit(options);
    });

  hooks
    .command('status')
    .description('List installed plugins')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await hooksStatus(options);
    });

  hooks
    .command('validate')
    .description('Validate plugin syntax')
    .action(async () => {
      await hooksValidate();
    });

  hooks
    .command('test')
    .description('Test plugin execution')
    .argument('<plugin>', 'Plugin name')
    .option('--event <event>', 'Event to test')
    .action(async (plugin, options) => {
      await hooksTest(plugin, options);
    });
}

async function hooksInit(options: { force?: boolean }) {
  const spinner = ora('Initializing hooks directory...').start();
  
  try {
    await mkdir(HOOKS_DIR, { recursive: true });
    
    const examplePlugin = join(HOOKS_DIR, 'example.mjs');
    
    try {
      await access(examplePlugin);
      if (!options.force) {
        spinner.warn(chalk.yellow('Hooks directory already exists'));
        console.log(chalk.gray(`  Location: ${HOOKS_DIR}`));
        return;
      }
    } catch {
      // File doesn't exist, continue
    }
    
    const example = `// QMX Hook Plugin Example
// See docs/hooks-extension.md for full API

export const events = ['session-start', 'turn-complete'];

export async function sessionStart(sdk) {
  sdk.log.info('Session started!');
  await sdk.state.set('sessionStartTime', Date.now());
  await sdk.notify('info', 'QMX session started');
}

export async function turnComplete(sdk) {
  const state = await sdk.state.get();
  sdk.log.info(\`Turn completed. Active tasks: \${state.activeTasks?.length || 0}\`);
}

export const metadata = {
  name: 'example-plugin',
  version: '1.0.0',
  description: 'Example QMX hook plugin',
};
`;

    await writeFile(examplePlugin, example);
    
    spinner.succeed(chalk.green('Hooks directory initialized'));
    console.log('\n' + chalk.cyan('Next steps:'));
    console.log(`  1. Edit ${chalk.yellow('hooks/example.mjs')}`);
    console.log(`  2. Run ${chalk.yellow('qmx hooks validate')} to check syntax`);
    console.log(`  3. Run ${chalk.yellow('qmx hooks test example')} to test`);
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize hooks'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function hooksStatus(options: { json?: boolean }) {
  const spinner = ora('Loading plugins...').start();
  
  try {
    let files: string[] = [];
    
    try {
      files = await readdir(HOOKS_DIR);
      files = files.filter(f => f.endsWith('.mjs'));
    } catch {
      spinner.fail(chalk.red('Hooks directory not found'));
      console.log(chalk.yellow('Run "qmx hooks init" to initialize'));
      return;
    }
    
    const plugins = [];
    
    for (const file of files) {
      const filePath = join(HOOKS_DIR, file);
      const plugin = await loadPluginInfo(filePath, file);
      plugins.push(plugin);
    }
    
    spinner.succeed();
    
    if (options.json) {
      console.log(JSON.stringify(plugins, null, 2));
      return;
    }
    
    if (plugins.length === 0) {
      console.log(chalk.gray('No plugins installed'));
      console.log(chalk.yellow('\nRun "qmx hooks init" to create an example plugin'));
      return;
    }
    
    console.log('\n' + chalk.bold.cyan('Installed Plugins\n'));
    console.log(chalk.gray('='.repeat(60)));
    
    for (const plugin of plugins) {
      const icon =
        plugin.status === 'ok' ? chalk.green('✓') :
        chalk.red('✗');
      
      console.log(`\n${icon} ${chalk.bold(plugin.name)}`);
      console.log(`  File: ${chalk.gray(plugin.file)}`);
      
      if (plugin.metadata) {
        console.log(`  Version: ${chalk.gray(plugin.metadata.version || 'unknown')}`);
        console.log(`  Description: ${chalk.gray(plugin.metadata.description || 'No description')}`);
      }
      
      console.log(`  Events: ${chalk.cyan(plugin.events.join(', '))}`);
      
      if (plugin.error) {
        console.log(`  Error: ${chalk.red(plugin.error)}`);
      }
    }
    
    console.log('\n' + chalk.gray('='.repeat(60)));
    console.log(`Total: ${plugins.length} plugin(s)`);
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to load plugins'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function hooksValidate() {
  const spinner = ora('Validating plugins...').start();
  
  try {
    let files: string[] = [];
    
    try {
      files = await readdir(HOOKS_DIR);
      files = files.filter(f => f.endsWith('.mjs'));
    } catch {
      spinner.fail(chalk.red('Hooks directory not found'));
      return;
    }
    
    let valid = 0;
    let invalid = 0;
    const results = [];
    
    for (const file of files) {
      const filePath = join(HOOKS_DIR, file);
      const result = await validatePlugin(filePath, file);
      results.push(result);
      
      if (result.valid) {
        valid++;
      } else {
        invalid++;
      }
    }
    
    if (results.length === 0) {
      spinner.warn(chalk.yellow('No plugins found'));
      return;
    }
    
    if (invalid === 0) {
      spinner.succeed(chalk.green(`All ${valid} plugin(s) are valid`));
    } else {
      spinner.fail(chalk.red(`${invalid} plugin(s) failed validation`));
    }
    
    // Show details for invalid plugins
    const invalidPlugins = results.filter(r => !r.valid);
    if (invalidPlugins.length > 0) {
      console.log('\n' + chalk.bold.red('Validation Errors\n'));
      
      for (const plugin of invalidPlugins) {
        console.log(`${chalk.red('✗')} ${plugin.file}`);
        if (plugin.error) {
          console.log(`  ${chalk.gray(plugin.error)}`);
        }
      }
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Validation failed'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function hooksTest(pluginName: string, options: { event?: string }) {
  const spinner = ora(`Testing plugin: ${pluginName}...`).start();
  
  try {
    const pluginPath = join(HOOKS_DIR, pluginName.endsWith('.mjs') ? pluginName : `${pluginName}.mjs`);
    
    try {
      await access(pluginPath);
    } catch {
      spinner.fail(chalk.red(`Plugin not found: ${pluginName}`));
      return;
    }
    
    // Try to import the plugin
    let plugin;
    try {
      plugin = await import(`file://${pluginPath}`);
    } catch (error) {
      spinner.fail(chalk.red('Failed to load plugin'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      return;
    }
    
    // Check for events export
    if (!plugin.events || !Array.isArray(plugin.events)) {
      spinner.fail(chalk.red('Plugin must export "events" array'));
      return;
    }
    
    spinner.succeed(chalk.green(`Plugin loaded successfully`));
    
    console.log('\n' + chalk.bold.cyan(`Plugin: ${pluginName}`));
    console.log(chalk.gray('='.repeat(60)));
    
    console.log(`\n${chalk.bold('Registered Events')}:`);
    for (const event of plugin.events) {
      console.log(`  - ${chalk.cyan(event)}`);
    }
    
    if (plugin.metadata) {
      console.log(`\n${chalk.bold('Metadata')}:`);
      console.log(`  Name: ${plugin.metadata.name || 'unknown'}`);
      console.log(`  Version: ${plugin.metadata.version || 'unknown'}`);
      console.log(`  Description: ${plugin.metadata.description || 'none'}`);
    }
    
    // Test event handler if specified
    if (options.event) {
      const handler = plugin[options.event];
      
      if (!handler || typeof handler !== 'function') {
        console.log(`\n${chalk.yellow(`No handler for event: ${options.event}`)}`);
        return;
      }
      
      console.log(`\n${chalk.bold('Testing event handler')}: ${options.event}`);
      
      // Create mock SDK
      const mockSdk = {
        log: {
          info: (msg: string) => console.log(chalk.blue(`  [LOG] ${msg}`)),
          warn: (msg: string) => console.log(chalk.yellow(`  [WARN] ${msg}`)),
          error: (msg: string) => console.log(chalk.red(`  [ERROR] ${msg}`)),
          debug: (msg: string) => console.log(chalk.gray(`  [DEBUG] ${msg}`)),
        },
        state: {
          get: async (key?: string) => {
            console.log(chalk.gray(`  [STATE] get(${key || 'all'})`));
            return {};
          },
          set: async (key: string, value: any) => {
            console.log(chalk.gray(`  [STATE] set(${key}, ${JSON.stringify(value)})`));
          },
          delete: async (key: string) => {
            console.log(chalk.gray(`  [STATE] delete(${key})`));
          },
        },
        notify: async (type: string, message: string) => {
          console.log(chalk.gray(`  [NOTIFY] ${type}: ${message}`));
        },
        tmux: {
          sendKeys: async (pane: string, keys: string) => {
            console.log(chalk.gray(`  [TMUX] sendKeys(${pane}, ${keys})`));
          },
          capture: async (pane: string) => {
            console.log(chalk.gray(`  [TMUX] capture(${pane})`));
            return '';
          },
        },
        fs: {
          read: async (_path: string) => '',
          write: async (_path: string, _content: string) => {},
          exists: async (_path: string) => false,
        },
        exec: async (cmd: string) => {
          console.log(chalk.gray(`  [EXEC] ${cmd}`));
          return { stdout: '', stderr: '', exitCode: 0 };
        },
      };
      
      try {
        await handler(mockSdk);
        console.log(`\n${chalk.green('✓ Event handler executed successfully')}`);
      } catch (error) {
        console.log(`\n${chalk.red('✗ Event handler failed')}`);
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      }
    }
    
    console.log('\n' + chalk.gray('='.repeat(60)));
    
  } catch (error) {
    spinner.fail(chalk.red('Test failed'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

// Helper functions

async function loadPluginInfo(filePath: string, file: string) {
  try {
    const plugin = await import(`file://${filePath}`);
    
    const events = plugin.events || [];
    const metadata = plugin.metadata || {};
    
    return {
      name: metadata.name || file.replace('.mjs', ''),
      file,
      status: 'ok' as const,
      events,
      metadata,
    };
  } catch (error) {
    return {
      name: file.replace('.mjs', ''),
      file,
      status: 'error' as const,
      events: [],
      metadata: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function validatePlugin(filePath: string, file: string) {
  try {
    // Check syntax by trying to import
    const plugin = await import(`file://${filePath}`);

    // Check required exports
    if (!plugin.events || !Array.isArray(plugin.events)) {
      return {
        valid: false,
        file,
        error: 'Missing "events" export (must be an array)',
      };
    }

    // Check that event handlers exist
    for (const event of plugin.events) {
      if (typeof event !== 'string') {
        return {
          valid: false,
          file,
          error: `Invalid event name: ${event}`,
        };
      }

      if (!plugin[event] || typeof plugin[event] !== 'function') {
        return {
          valid: false,
          file,
          error: `Missing handler function for event: ${event}`,
        };
      }
    }

    return {
      valid: true,
      file,
      events: plugin.events,
    };
  } catch (error) {
    return {
      valid: false,
      file,
      error: error instanceof Error ? error.message : 'Syntax error',
    };
  }
}

/**
 * Default export for CLI execution from bin/qmx.js
 */
export default async function run(args: string[]) {
  const subcommand = args[0];
  const subArgs = args.slice(1);

  if (!subcommand) {
    console.log('Usage: qmx hooks <subcommand> [options]');
    console.log('\nSubcommands:');
    console.log('  init              - Initialize hooks directory');
    console.log('  status            - List installed plugins');
    console.log('  validate          - Validate plugin syntax');
    console.log('  test <plugin>     - Test plugin execution');
    return;
  }

  // Parse subcommand options
  const options: any = {};
  const positionalArgs: string[] = [];

  for (let i = 0; i < subArgs.length; i++) {
    const arg = subArgs[i];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--event' && subArgs[i + 1]) {
      options.event = subArgs[++i];
    } else if (!arg.startsWith('-')) {
      positionalArgs.push(arg);
    }
  }

  switch (subcommand) {
    case 'init':
      await hooksInit(options);
      break;

    case 'status':
      await hooksStatus(options);
      break;

    case 'validate':
      await hooksValidate();
      break;

    case 'test':
      if (positionalArgs.length < 1) {
        console.error('Error: test requires <plugin> argument');
        process.exit(1);
      }
      await hooksTest(positionalArgs[0], options);
      break;

    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      process.exit(1);
  }
}
