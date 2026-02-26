/**
 * QMX Doctor Command
 * 
 * Diagnoses QMX installation and configuration issues.
 */

import { Command } from 'commander';
import { execSync } from 'node:child_process';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';

export function doctorCommand(program: Command) {
  program
    .command('doctor')
    .description('Check QMX installation and configuration')
    .option('--verbose', 'Show detailed output')
    .option('--team', 'Check team mode specifically')
    .action(async (options) => {
      await doctor(options);
    });
}

interface CheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
}

async function doctor(options: { verbose?: boolean; team?: boolean }) {
  console.log(chalk.bold.cyan('\n🔍 QMX Doctor\n'));
  
  const results: CheckResult[] = [];

  // Check Node.js version
  results.push(checkNodeVersion());

  // Check QMX installation
  results.push(await checkQmxInstallation());

  // Check tmux (required for team mode)
  if (options.team) {
    results.push(checkTmux());
    results.push(await checkTeamState());
  }

  // Check project configuration
  results.push(await checkProjectConfig());

  // Check MCP servers
  results.push(await checkMcpServers());

  // Print results
  for (const result of results) {
    printResult(result);
  }

  // Summary
  const errors = results.filter(r => r.status === 'error').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  console.log('\n' + '='.repeat(50));
  
  if (errors === 0 && warnings === 0) {
    console.log(chalk.green('✓ All checks passed!'));
  } else {
    if (errors > 0) {
      console.log(chalk.red(`✗ ${errors} error(s) found`));
    }
    if (warnings > 0) {
      console.log(chalk.yellow(`⚠ ${warnings} warning(s) found`));
    }
  }

  if (errors > 0) {
    console.log('\n' + chalk.yellow('Please fix the errors above before using QMX.'));
    process.exit(1);
  }
}

function checkNodeVersion(): CheckResult {
  try {
    const version = execSync('node --version', { encoding: 'utf-8' }).trim();
    const major = parseInt(version.replace('v', '').split('.')[0]);
    
    if (major >= 20) {
      return {
        name: 'Node.js',
        status: 'ok',
        message: `Node.js ${version}`,
      };
    } else {
      return {
        name: 'Node.js',
        status: 'error',
        message: `Node.js ${version} (requires >= 20.0.0)`,
        details: 'Please upgrade Node.js to version 20 or higher',
      };
    }
  } catch (error) {
    return {
      name: 'Node.js',
      status: 'error',
      message: 'Node.js not found',
      details: 'Please install Node.js from https://nodejs.org',
    };
  }
}

async function checkQmxInstallation(): Promise<CheckResult> {
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
    
    const hasQmx = pkg.dependencies?.qmx || pkg.devDependencies?.qmx;
    
    if (hasQmx) {
      return {
        name: 'QMX Installation',
        status: 'ok',
        message: `QMX ${hasQmx} found in dependencies`,
      };
    } else {
      return {
        name: 'QMX Installation',
        status: 'warning',
        message: 'QMX not found in project dependencies',
        details: 'Run "npm install -g qmx" for global installation',
      };
    }
  } catch (error) {
    return {
      name: 'QMX Installation',
      status: 'warning',
      message: 'Could not verify QMX installation',
      details: 'Make sure QMX is installed globally or in project',
    };
  }
}

function checkTmux(): CheckResult {
  try {
    const version = execSync('tmux -V', { encoding: 'utf-8' }).trim();
    const versionNum = parseFloat(version.replace('tmux ', ''));
    
    if (versionNum >= 3.0) {
      return {
        name: 'tmux',
        status: 'ok',
        message: version,
      };
    } else {
      return {
        name: 'tmux',
        status: 'warning',
        message: `${version} (requires >= 3.0 for team mode)`,
        details: 'Some team mode features may not work with this version',
      };
    }
  } catch (error) {
    return {
      name: 'tmux',
      status: 'error',
      message: 'tmux not found',
      details: 'Install tmux or use WSL2 on Windows for team mode',
    };
  }
}

async function checkProjectConfig(): Promise<CheckResult> {
  const configPath = join(process.cwd(), '.qmx', 'config.toml');
  
  try {
    await access(configPath);
    return {
      name: 'Project Configuration',
      status: 'ok',
      message: '.qmx/config.toml found',
    };
  } catch {
    return {
      name: 'Project Configuration',
      status: 'warning',
      message: '.qmx/config.toml not found',
      details: 'Run "qmx setup" to initialize project configuration',
    };
  }
}

async function checkTeamState(): Promise<CheckResult> {
  const teamsDir = join(process.cwd(), '.qmx', 'state', 'teams');
  
  try {
    await access(teamsDir);
    
    // Check for orphaned teams
    try {
      const output = execSync('tmux list-sessions -F #{session_name}', {
        encoding: 'utf-8',
      });
      const sessions = output.trim().split('\n').filter(Boolean);
      const orphaned = sessions.filter(s => s.startsWith('qmx-team-'));
      
      if (orphaned.length > 0) {
        return {
          name: 'Team State',
          status: 'warning',
          message: `${orphaned.length} orphaned team session(s) found`,
          details: `Run "qmx team cleanup" to remove: ${orphaned.join(', ')}`,
        };
      }
      
      return {
        name: 'Team State',
        status: 'ok',
        message: 'No orphaned teams',
      };
    } catch {
      return {
        name: 'Team State',
        status: 'ok',
        message: 'No active team sessions',
      };
    }
  } catch {
    return {
      name: 'Team State',
      status: 'warning',
      message: 'Team state directory not found',
      details: 'Run "qmx setup" to initialize',
    };
  }
}

async function checkMcpServers(): Promise<CheckResult> {
  // Check if MCP servers can be started
  // This is a simplified check - in production, actually try to connect
  
  const stateServerPath = join(process.cwd(), 'dist', 'mcp', 'state-server.js');
  
  try {
    await access(stateServerPath);
    return {
      name: 'MCP Servers',
      status: 'ok',
      message: 'MCP server files found',
    };
  } catch {
    return {
      name: 'MCP Servers',
      status: 'warning',
      message: 'MCP server files not found',
      details: 'Run "npm run build" to compile TypeScript',
    };
  }
}

function printResult(result: CheckResult) {
  const icon =
    result.status === 'ok'
      ? chalk.green('✓')
      : result.status === 'warning'
      ? chalk.yellow('⚠')
      : chalk.red('✗');

  console.log(`${icon} ${chalk.bold(result.name)}`);
  console.log(`  ${result.message}`);
  
  if (result.details) {
    console.log(`  ${chalk.gray(result.details)}`);
  }

  console.log();
}

// Default export for CLI execution
export default async function run(args: string[] = []) {
  const options = {
    verbose: args.includes('--verbose'),
    team: args.includes('--team'),
  };
  await doctor(options);
}
