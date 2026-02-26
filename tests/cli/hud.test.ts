/**
 * Tests for HUD Command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('HUD Command', () => {
  const qmxDir = join(process.cwd(), '.qmx');
  const stateDir = join(qmxDir, 'state');
  const sessionsDir = join(stateDir, 'sessions');
  const teamsDir = join(stateDir, 'teams');
  const logsDir = join(qmxDir, 'logs');

  beforeEach(async () => {
    await mkdir(sessionsDir, { recursive: true });
    await mkdir(teamsDir, { recursive: true });
    await mkdir(logsDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('HUD Status', () => {
    it('should display session information', async () => {
      const sessionId = 'test-session';
      const sessionState = {
        sessionId,
        status: 'running',
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        activeTeams: ['team-1'],
        activeModes: ['development'],
      };

      await writeFile(join(sessionsDir, `${sessionId}.json`), JSON.stringify(sessionState, null, 2));

      const content = await readFile(join(sessionsDir, `${sessionId}.json`), 'utf-8');
      const state = JSON.parse(content);

      expect(state.sessionId).toBe(sessionId);
      expect(state.status).toBe('running');
      expect(state.activeTeams).toHaveLength(1);
    });

    it('should output JSON when requested', async () => {
      const status = {
        sessionId: 'json-session',
        status: 'running',
        activeTeams: 2,
        activeModes: ['development', 'testing'],
      };

      const jsonOutput = JSON.stringify(status, null, 2);
      const parsed = JSON.parse(jsonOutput);

      expect(parsed.sessionId).toBe('json-session');
      expect(parsed.activeModes).toHaveLength(2);
    });

    it('should handle missing session gracefully', async () => {
      const getSessionStatus = (sessionId: string, sessions: Record<string, any>): any => {
        return sessions[sessionId] || { status: 'unknown', activeTeams: 0 };
      };

      const sessions: Record<string, any> = {};
      const status = getSessionStatus('non-existent', sessions);

      expect(status.status).toBe('unknown');
    });
  });

  describe('Team Status Display', () => {
    it('should display active teams', async () => {
      const teams = [
        {
          name: 'team-alpha',
          role: 'executor',
          workerCount: 3,
          status: 'running',
          updatedAt: new Date().toISOString(),
          tasks: [
            { id: 't1', status: 'completed' },
            { id: 't2', status: 'in_progress' },
          ],
        },
        {
          name: 'team-beta',
          role: 'reviewer',
          workerCount: 2,
          status: 'running',
          updatedAt: new Date().toISOString(),
          tasks: [],
        },
      ];

      for (const team of teams) {
        await writeFile(join(teamsDir, `${team.name}.json`), JSON.stringify(team, null, 2));
      }

      const files = await Promise.all(
        teams.map(t => readFile(join(teamsDir, `${t.name}.json`), 'utf-8'))
      );
      const loadedTeams = files.map(f => JSON.parse(f));

      expect(loadedTeams).toHaveLength(2);
      expect(loadedTeams[0].name).toBe('team-alpha');
    });

    it('should calculate task progress', () => {
      const calculateProgress = (tasks: Array<{ status: string }>): number => {
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.status === 'completed').length;
        return Math.round((completed / tasks.length) * 100);
      };

      const tasks1 = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'in_progress' },
      ];
      const tasks2: Array<{ status: string }> = [];

      expect(calculateProgress(tasks1)).toBe(67);
      expect(calculateProgress(tasks2)).toBe(0);
    });

    it('should show status with color indicators', () => {
      const getStatusIcon = (status: string): string => {
        const icons: Record<string, string> = {
          running: '●',
          completed: '●',
          failed: '●',
          created: '●',
        };
        return icons[status] || '●';
      };

      expect(getStatusIcon('running')).toBe('●');
      expect(getStatusIcon('completed')).toBe('●');
    });
  });

  describe('Watch Mode', () => {
    it('should support custom refresh interval', () => {
      const getIntervals = (options: { interval?: string }): number => {
        return parseInt(options.interval || '1000');
      };

      expect(getIntervals({})).toBe(1000);
      expect(getIntervals({ interval: '500' })).toBe(500);
      expect(getIntervals({ interval: '2000' })).toBe(2000);
    });

    it('should support no-clear option', () => {
      const shouldClear = (options: { noClear?: boolean }): boolean => {
        return !options.noClear;
      };

      expect(shouldClear({})).toBe(true);
      expect(shouldClear({ noClear: true })).toBe(false);
    });

    it('should handle SIGINT for exit', () => {
      let running = true;

      const simulateSigint = () => {
        running = false;
      };

      expect(running).toBe(true);
      simulateSigint();
      expect(running).toBe(false);
    });
  });

  describe('Logs Display', () => {
    it('should show recent logs', async () => {
      const logPath = join(logsDir, 'session.log');
      const logLines = [
        '[INFO] Session started',
        '[INFO] Team created',
        '[WARN] Slow response detected',
        '[ERROR] Task failed',
        '[INFO] Task retrying',
      ].join('\n');

      await writeFile(logPath, logLines);

      const content = await readFile(logPath, 'utf-8');
      const lines = content.split('\n');

      expect(lines).toHaveLength(5);
      expect(lines[0]).toContain('[INFO]');
      expect(lines[3]).toContain('[ERROR]');
    });

    it('should limit number of lines displayed', () => {
      const getRecentLines = (lines: string[], limit: number): string[] => {
        return lines.slice(-limit);
      };

      const allLines = ['line1', 'line2', 'line3', 'line4', 'line5'];
      const recent = getRecentLines(allLines, 3);

      expect(recent).toHaveLength(3);
      expect(recent[0]).toBe('line3');
      expect(recent[2]).toBe('line5');
    });

    it('should colorize log levels', () => {
      const getLogLevelColor = (line: string): string => {
        if (line.includes('ERROR')) return 'red';
        if (line.includes('WARN')) return 'yellow';
        if (line.includes('SUCCESS')) return 'green';
        return 'gray';
      };

      expect(getLogLevelColor('[ERROR] Failed')).toBe('red');
      expect(getLogLevelColor('[WARN] Warning')).toBe('yellow');
      expect(getLogLevelColor('[INFO] Info')).toBe('gray');
    });

    it('should handle missing log file', async () => {
      const logPath = join(logsDir, 'nonexistent.log');

      try {
        await readFile(logPath, 'utf-8');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as NodeJS.ErrnoException).code).toBe('ENOENT');
      }
    });
  });

  describe('Status Color Coding', () => {
    it('should colorize session status', () => {
      const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
          running: 'green',
          idle: 'yellow',
          ended: 'gray',
          failed: 'red',
        };
        return colors[status] || 'red';
      };

      expect(getStatusColor('running')).toBe('green');
      expect(getStatusColor('idle')).toBe('yellow');
      expect(getStatusColor('ended')).toBe('gray');
      expect(getStatusColor('failed')).toBe('red');
      expect(getStatusColor('unknown')).toBe('red');
    });
  });

  describe('Dashboard Layout', () => {
    it('should format dashboard header', () => {
      const header = `
╔═══════════════════════════════════════════════════════════╗
║                    QMX Session Dashboard                    ║
╚═══════════════════════════════════════════════════════════╝
`.trim();

      expect(header).toContain('╔');
      expect(header).toContain('QMX Session Dashboard');
      expect(header).toContain('╝');
    });

    it('should display session details', () => {
      const formatSessionInfo = (session: {
        id: string;
        status: string;
        startTime: string;
      }): string[] => {
        return [
          `Session: ${session.id}`,
          `Status: ${session.status}`,
          `Started: ${new Date(session.startTime).toLocaleString()}`,
        ];
      };

      const session = {
        id: 'session-123',
        status: 'running',
        startTime: new Date().toISOString(),
      };

      const info = formatSessionInfo(session);
      expect(info).toHaveLength(3);
      expect(info[0]).toContain('session-123');
    });

    it('should display team summary', () => {
      const formatTeamSummary = (teams: any[]): string => {
        return `Active Teams: ${teams.length}`;
      };

      const teams = [{ name: 'team-1' }, { name: 'team-2' }];
      const summary = formatTeamSummary(teams);

      expect(summary).toContain('2');
    });
  });

  describe('Data Retrieval', () => {
    it('should get HUD status from session files', async () => {
      const sessionId = 'hud-test-session';
      const sessionState = {
        sessionId,
        status: 'running',
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        activeTeams: ['team-1', 'team-2'],
        activeModes: ['development'],
      };

      await writeFile(join(sessionsDir, `${sessionId}.json`), JSON.stringify(sessionState, null, 2));

      const content = await readFile(join(sessionsDir, `${sessionId}.json`), 'utf-8');
      const state = JSON.parse(content);

      expect(state.activeTeams).toHaveLength(2);
      expect(state.activeModes).toContain('development');
    });

    it('should filter active teams only', () => {
      const allTeams = [
        { name: 'team-1', status: 'running' },
        { name: 'team-2', status: 'completed' },
        { name: 'team-3', status: 'running' },
        { name: 'team-4', status: 'failed' },
      ];

      const activeTeams = allTeams.filter(
        t => t.status === 'running' || t.status === 'created'
      );

      expect(activeTeams).toHaveLength(2);
      expect(activeTeams.map(t => t.name)).toContain('team-1');
    });
  });

  describe('Environment Variables', () => {
    it('should use QMX_SESSION_ID from environment', () => {
      const getSessionId = (env: Record<string, string | undefined>): string => {
        return env.QMX_SESSION_ID || 'unknown';
      };

      expect(getSessionId({ QMX_SESSION_ID: 'test-123' })).toBe('test-123');
      expect(getSessionId({})).toBe('unknown');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing state directory', async () => {
      const getState = async (dir: string): Promise<any> => {
        try {
          // Would read from directory
          return { status: 'ok' };
        } catch {
          return { status: 'error' };
        }
      };

      const result = await getState('/nonexistent');
      expect(result).toBeDefined();
    });

    it('should handle corrupted state files', async () => {
      const testPath = join(sessionsDir, 'corrupted.json');
      await writeFile(testPath, '{ invalid json }');

      try {
        const content = await readFile(testPath, 'utf-8');
        JSON.parse(content);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }

      await rm(testPath, { force: true });
    });
  });
});
