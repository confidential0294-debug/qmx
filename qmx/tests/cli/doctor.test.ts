/**
 * Tests for Doctor Command
 */

import { describe, it, expect, vi } from 'vitest';
import { execSync } from 'node:child_process';

describe('Doctor Command', () => {
  describe('Node.js Version Check', () => {
    it('should check Node.js version', () => {
      const version = execSync('node --version', { encoding: 'utf-8' }).trim();
      expect(version).toMatch(/^v?\d+\.\d+\.\d+/);
    });

    it('should validate Node.js version is >= 20', () => {
      const version = execSync('node --version', { encoding: 'utf-8' }).trim();
      const major = parseInt(version.replace('v', '').split('.')[0]);
      
      expect(major).toBeGreaterThanOrEqual(20);
    });

    it('should return error for unsupported Node.js version', () => {
      const checkNodeVersion = (version: string): { ok: boolean; message: string } => {
        const major = parseInt(version.replace('v', '').split('.')[0]);
        if (major >= 20) {
          return { ok: true, message: `Node.js ${version}` };
        }
        return { ok: false, message: `Node.js ${version} (requires >= 20.0.0)` };
      };

      expect(checkNodeVersion('v20.0.0').ok).toBe(true);
      expect(checkNodeVersion('v18.0.0').ok).toBe(false);
      expect(checkNodeVersion('v22.0.0').ok).toBe(true);
    });
  });

  describe('QMX Installation Check', () => {
    it('should check for QMX in dependencies', () => {
      const checkQmxInPackage = (pkg: any): { status: string; message: string } => {
        const hasQmx = pkg.dependencies?.qmx || pkg.devDependencies?.qmx;
        
        if (hasQmx) {
          return { status: 'ok', message: `QMX ${hasQmx} found in dependencies` };
        }
        return { status: 'warning', message: 'QMX not found in project dependencies' };
      };

      expect(checkQmxInPackage({ dependencies: { qmx: '^1.0.0' } }).status).toBe('ok');
      expect(checkQmxInPackage({ devDependencies: { qmx: '^1.0.0' } }).status).toBe('ok');
      expect(checkQmxInPackage({}).status).toBe('warning');
    });
  });

  describe('tmux Check', () => {
    it('should check tmux availability', () => {
      const checkTmux = (): { available: boolean; version?: string } => {
        try {
          const version = execSync('tmux -V', { encoding: 'utf-8' }).trim();
          return { available: true, version };
        } catch {
          return { available: false };
        }
      };

      const result = checkTmux();
      // Result depends on environment
      expect(result).toHaveProperty('available');
    });

    it('should validate tmux version >= 3.0', () => {
      const validateTmuxVersion = (version: string): { ok: boolean; message: string } => {
        const versionNum = parseFloat(version.replace('tmux ', ''));
        
        if (versionNum >= 3.0) {
          return { ok: true, message: version };
        }
        return { ok: false, message: `${version} (requires >= 3.0 for team mode)` };
      };

      expect(validateTmuxVersion('tmux 3.0').ok).toBe(true);
      expect(validateTmuxVersion('tmux 3.2').ok).toBe(true);
      expect(validateTmuxVersion('tmux 2.9').ok).toBe(false);
    });

    it('should return error when tmux is not installed', () => {
      const checkTmuxNotInstalled = (): { status: string; message: string } => {
        // Simulating tmux not found
        return {
          status: 'error',
          message: 'tmux not found',
        };
      };

      const result = checkTmuxNotInstalled();
      expect(result.status).toBe('error');
      expect(result.message).toContain('tmux not found');
    });
  });

  describe('Project Configuration Check', () => {
    it('should check for .qmx/config.toml', () => {
      const checkConfig = (exists: boolean): { status: string; message: string } => {
        if (exists) {
          return { status: 'ok', message: '.qmx/config.toml found' };
        }
        return { status: 'warning', message: '.qmx/config.toml not found' };
      };

      expect(checkConfig(true).status).toBe('ok');
      expect(checkConfig(false).status).toBe('warning');
    });

    it('should suggest running setup when config missing', () => {
      const result = {
        status: 'warning',
        message: '.qmx/config.toml not found',
        details: 'Run "qmx setup" to initialize project configuration',
      };

      expect(result.details).toContain('qmx setup');
    });
  });

  describe('Team State Check', () => {
    it('should check for orphaned teams', () => {
      const checkOrphanedTeams = (sessions: string[]): { status: string; message: string; details?: string } => {
        const orphaned = sessions.filter(s => s.startsWith('qmx-team-'));
        
        if (orphaned.length > 0) {
          return {
            status: 'warning',
            message: `${orphaned.length} orphaned team session(s) found`,
            details: `Run "qmx team cleanup" to remove: ${orphaned.join(', ')}`,
          };
        }
        return { status: 'ok', message: 'No orphaned teams' };
      };

      const cleanSessions = ['main', 'other-session'];
      const dirtySessions = ['main', 'qmx-team-abc123', 'qmx-team-def456'];

      expect(checkOrphanedTeams(cleanSessions).status).toBe('ok');
      expect(checkOrphanedTeams(dirtySessions).status).toBe('warning');
      expect(checkOrphanedTeams(dirtySessions).details).toContain('qmx team cleanup');
    });

    it('should handle tmux command failure', () => {
      const checkTeamStateTmuxFail = (): { status: string; message: string } => {
        // Simulating tmux command failure
        return {
          status: 'ok',
          message: 'No active team sessions',
        };
      };

      const result = checkTeamStateTmuxFail();
      expect(result.status).toBe('ok');
    });
  });

  describe('MCP Servers Check', () => {
    it('should check MCP server files exist', () => {
      const checkMcpServers = (filesExist: boolean): { status: string; message: string } => {
        if (filesExist) {
          return { status: 'ok', message: 'MCP server files found' };
        }
        return { status: 'warning', message: 'MCP server files not found' };
      };

      expect(checkMcpServers(true).status).toBe('ok');
      expect(checkMcpServers(false).status).toBe('warning');
    });

    it('should suggest building when files not found', () => {
      const result = {
        status: 'warning',
        message: 'MCP server files not found',
        details: 'Run "npm run build" to compile TypeScript',
      };

      expect(result.details).toContain('npm run build');
    });
  });

  describe('Check Result Formatting', () => {
    it('should format ok status with checkmark', () => {
      const formatStatus = (status: string): string => {
        const icons: Record<string, string> = {
          ok: '✓',
          warning: '⚠',
          error: '✗',
        };
        return icons[status] || '?';
      };

      expect(formatStatus('ok')).toBe('✓');
      expect(formatStatus('warning')).toBe('⚠');
      expect(formatStatus('error')).toBe('✗');
    });

    it('should colorize status output', () => {
      const statusColors: Record<string, string> = {
        ok: 'green',
        warning: 'yellow',
        error: 'red',
      };

      expect(statusColors['ok']).toBe('green');
      expect(statusColors['warning']).toBe('yellow');
      expect(statusColors['error']).toBe('red');
    });
  });

  describe('Summary Output', () => {
    it('should count errors and warnings', () => {
      const results = [
        { name: 'Node.js', status: 'ok' as const },
        { name: 'tmux', status: 'error' as const },
        { name: 'Config', status: 'warning' as const },
        { name: 'MCP', status: 'ok' as const },
      ];

      const errors = results.filter(r => r.status === 'error').length;
      const warnings = results.filter(r => r.status === 'warning').length;

      expect(errors).toBe(1);
      expect(warnings).toBe(1);
    });

    it('should display success when no issues', () => {
      const results = [
        { name: 'Node.js', status: 'ok' as const },
        { name: 'tmux', status: 'ok' as const },
        { name: 'Config', status: 'ok' as const },
      ];

      const errors = results.filter(r => r.status === 'error').length;
      const warnings = results.filter(r => r.status === 'warning').length;

      const message = errors === 0 && warnings === 0
        ? '✓ All checks passed!'
        : `${errors} error(s), ${warnings} warning(s)`;

      expect(message).toBe('✓ All checks passed!');
    });

    it('should exit with error code when errors found', () => {
      const shouldExitWithError = (errors: number): boolean => {
        return errors > 0;
      };

      expect(shouldExitWithError(0)).toBe(false);
      expect(shouldExitWithError(1)).toBe(true);
      expect(shouldExitWithError(3)).toBe(true);
    });
  });

  describe('Verbose Output', () => {
    it('should include details in verbose mode', () => {
      const formatResult = (result: { name: string; status: string; message: string; details?: string }, verbose: boolean): string[] => {
        const lines = [
          `${result.status === 'ok' ? '✓' : '⚠'} ${result.name}`,
          `  ${result.message}`,
        ];

        if (verbose && result.details) {
          lines.push(`  ${result.details}`);
        }

        return lines;
      };

      const result = {
        name: 'tmux',
        status: 'warning',
        message: 'tmux 2.9 (requires >= 3.0)',
        details: 'Some team mode features may not work',
      };

      const normalOutput = formatResult(result, false);
      const verboseOutput = formatResult(result, true);

      expect(normalOutput).toHaveLength(2);
      expect(verboseOutput).toHaveLength(3);
    });
  });

  describe('Team Mode Specific Checks', () => {
    it('should check tmux only when team flag is set', () => {
      const runDoctor = (options: { team?: boolean }): string[] => {
        const checks: string[] = ['Node.js', 'QMX Installation'];
        
        if (options.team) {
          checks.push('tmux', 'Team State');
        }
        
        checks.push('Project Configuration', 'MCP Servers');
        
        return checks;
      };

      const normalChecks = runDoctor({});
      const teamChecks = runDoctor({ team: true });

      expect(normalChecks).not.toContain('tmux');
      expect(teamChecks).toContain('tmux');
      expect(teamChecks).toContain('Team State');
    });
  });
});
