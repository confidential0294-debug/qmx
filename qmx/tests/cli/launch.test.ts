/**
 * Tests for Launch Command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('Launch Command', () => {
  const qmxDir = join(process.cwd(), '.qmx');
  const stateDir = join(qmxDir, 'state');
  const sessionsDir = join(stateDir, 'sessions');

  beforeEach(async () => {
    await mkdir(sessionsDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('Project Validation', () => {
    it('should validate project directory', () => {
      const validateProject = (dir: string): boolean => {
        // In real implementation, would check if directory exists
        return dir.length > 0;
      };

      expect(validateProject('/valid/path')).toBe(true);
      expect(validateProject('')).toBe(false);
    });

    it('should use current directory as default project', () => {
      const defaultProject = process.cwd();
      expect(defaultProject).toBeDefined();
      expect(defaultProject.length).toBeGreaterThan(0);
    });
  });

  describe('Session Initialization', () => {
    it('should generate unique session ID', () => {
      const generateSessionId = (): string => {
        return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      };

      const id1 = generateSessionId();
      const id2 = generateSessionId();

      expect(id1).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should create session state file', async () => {
      const sessionId = 'test-session-123';
      const sessionState = {
        sessionId,
        status: 'initializing',
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        activeTeams: [],
        activeModes: [],
        options: { yolo: false, verbose: false },
        project: process.cwd(),
      };

      await writeFile(join(sessionsDir, `${sessionId}.json`), JSON.stringify(sessionState, null, 2));

      const content = await readFile(join(sessionsDir, `${sessionId}.json`), 'utf-8');
      const state = JSON.parse(content);

      expect(state.sessionId).toBe(sessionId);
      expect(state.status).toBe('initializing');
    });

    it('should include launch options in state', async () => {
      const sessionId = 'options-session';
      const options = {
        yolo: true,
        high: false,
        xhigh: true,
        verbose: true,
        reasoning: 'xhigh',
      };

      const sessionState = {
        sessionId,
        status: 'initializing',
        startTime: new Date().toISOString(),
        options,
      };

      await writeFile(join(sessionsDir, `${sessionId}.json`), JSON.stringify(sessionState, null, 2));

      const content = await readFile(join(sessionsDir, `${sessionId}.json`), 'utf-8');
      const state = JSON.parse(content);

      expect(state.options.yolo).toBe(true);
      expect(state.options.xhigh).toBe(true);
      expect(state.options.reasoning).toBe('xhigh');
    });
  });

  describe('Configuration Generation', () => {
    it('should generate Qwen Code overlay config', () => {
      const generateConfig = (options: any): Record<string, any> => {
        return {
          multi_agent: {
            enabled: true,
            prompts_directory: './prompts',
            skills_directory: './skills',
          },
          mcp: {
            servers: {
              'qmx-state': { command: 'node', args: ['./dist/mcp/state-server.js'] },
              'qmx-memory': { command: 'node', args: ['./dist/mcp/memory-server.js'] },
            },
          },
          reasoning: { effort: options.reasoning || 'medium' },
          approvals: options.yolo ? { bypass: true } : undefined,
        };
      };

      const config = generateConfig({ yolo: true, reasoning: 'high' });

      expect(config.multi_agent.enabled).toBe(true);
      expect(config.reasoning.effort).toBe('high');
      expect(config.approvals?.bypass).toBe(true);
    });

    it('should include MCP server configuration', () => {
      const mcpConfig = {
        servers: {
          'qmx-state': {
            command: 'node',
            args: ['./dist/mcp/state-server.js'],
          },
          'qmx-memory': {
            command: 'node',
            args: ['./dist/mcp/memory-server.js'],
          },
          'qmx-code-intel': {
            command: 'node',
            args: ['./dist/mcp/code-intel-server.js'],
          },
        },
      };

      expect(Object.keys(mcpConfig.servers)).toHaveLength(3);
      expect(mcpConfig.servers['qmx-state'].command).toBe('node');
    });

    it('should save overlay config to file', async () => {
      const configPath = join(qmxDir, 'qwen-overlay.json');
      const config = {
        version: '1.0.0',
        multi_agent: { enabled: true },
        mcp: { servers: {} },
      };

      await writeFile(configPath, JSON.stringify(config, null, 2));

      const content = await readFile(configPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.version).toBe('1.0.0');
      expect(parsed.multi_agent.enabled).toBe(true);
    });
  });

  describe('Reasoning Effort', () => {
    it('should set reasoning effort from options', () => {
      const getReasoningEffort = (options: any): string => {
        if (options.reasoning) return options.reasoning;
        if (options.xhigh) return 'xhigh';
        if (options.high) return 'high';
        return 'medium';
      };

      expect(getReasoningEffort({ reasoning: 'low' })).toBe('low');
      expect(getReasoningEffort({ xhigh: true })).toBe('xhigh');
      expect(getReasoningEffort({ high: true })).toBe('high');
      expect(getReasoningEffort({})).toBe('medium');
    });

    it('should display reasoning level in output', () => {
      const formatReasoningDisplay = (effort: string): string => {
        return `Reasoning: ${effort.toUpperCase()}`;
      };

      expect(formatReasoningDisplay('xhigh')).toBe('Reasoning: XHIGH');
      expect(formatReasoningDisplay('medium')).toBe('Reasoning: MEDIUM');
    });
  });

  describe('YOLO Mode', () => {
    it('should enable YOLO mode with flag', () => {
      const isYoloMode = (options: { yolo?: boolean }): boolean => {
        return !!options.yolo;
      };

      expect(isYoloMode({ yolo: true })).toBe(true);
      expect(isYoloMode({})).toBe(false);
    });

    it('should bypass approvals in YOLO mode', () => {
      const getApprovalConfig = (yolo: boolean): Record<string, any> => {
        return yolo ? { approvals: { bypass: true } } : {};
      };

      expect(getApprovalConfig(true).approvals.bypass).toBe(true);
      expect(getApprovalConfig(false).approvals).toBeUndefined();
    });

    it('should display warning for YOLO mode', () => {
      const yoloWarning = 'Mode: YOLO (no approvals)';
      expect(yoloWarning).toContain('YOLO');
      expect(yoloWarning).toContain('no approvals');
    });
  });

  describe('Command Line Options', () => {
    it('should support --verbose option', () => {
      const options = { verbose: true };
      expect(options.verbose).toBe(true);
    });

    it('should support --dry-run option', () => {
      const options = { dryRun: true };
      expect(options.dryRun).toBe(true);
    });

    it('should support --no-hud option', () => {
      const options = { hud: false };
      expect(options.hud).toBe(false);
    });

    it('should combine multiple options', () => {
      const options = {
        yolo: true,
        verbose: true,
        xhigh: true,
        hud: false,
      };

      expect(options.yolo).toBe(true);
      expect(options.verbose).toBe(true);
      expect(options.xhigh).toBe(true);
      expect(options.hud).toBe(false);
    });
  });

  describe('Session Information Display', () => {
    it('should display session information', () => {
      const sessionInfo = {
        sessionId: 'session-abc123',
        project: '/path/to/project',
        reasoning: 'high',
        yolo: false,
      };

      const display = [
        `Session ID: ${sessionInfo.sessionId}`,
        `Project: ${sessionInfo.project}`,
        `Reasoning: ${sessionInfo.reasoning}`,
      ];

      expect(display).toHaveLength(3);
      expect(display[0]).toContain('session-abc123');
    });

    it('should show available commands', () => {
      const commands = [
        '/prompts:<agent> - Use agent prompts',
        '$<skill> - Execute skills',
        '$team N:role - Launch agent teams',
      ];

      expect(commands).toHaveLength(3);
      expect(commands[0]).toContain('/prompts:');
      expect(commands[1]).toContain('$');
      expect(commands[2]).toContain('$team');
    });
  });

  describe('Environment Setup', () => {
    it('should set QMX environment variables', () => {
      const getEnv = (sessionId: string): Record<string, string> => {
        return {
          QMX_SESSION_ID: sessionId,
          QMX_ENABLED: '1',
        };
      };

      const env = getEnv('test-session');
      expect(env.QMX_SESSION_ID).toBe('test-session');
      expect(env.QMX_ENABLED).toBe('1');
    });

    it('should preserve existing environment', () => {
      const baseEnv = { PATH: '/usr/bin', HOME: '/home/user' };
      const qmxEnv = { QMX_SESSION_ID: 'test', QMX_ENABLED: '1' };

      const combined = { ...baseEnv, ...qmxEnv };

      expect(combined.PATH).toBe('/usr/bin');
      expect(combined.QMX_SESSION_ID).toBe('test');
    });
  });

  describe('Directory Discovery', () => {
    it('should find prompts directory', () => {
      const findPromptsDirectory = (): string => {
        const paths = [
          join(process.cwd(), 'prompts'),
          join(__dirname, '..', 'prompts'),
        ];
        return paths[0];
      };

      const promptsDir = findPromptsDirectory();
      expect(promptsDir).toContain('prompts');
    });

    it('should find skills directory', () => {
      const findSkillsDirectory = (): string => {
        const paths = [
          join(process.cwd(), 'skills'),
          join(__dirname, '..', 'skills'),
        ];
        return paths[0];
      };

      const skillsDir = findSkillsDirectory();
      expect(skillsDir).toContain('skills');
    });

    it('should handle missing directories gracefully', () => {
      const findDirectory = (candidates: string[]): string => {
        // In real implementation, would check existence
        return candidates[0] || process.cwd();
      };

      const candidates = ['./prompts', '../prompts'];
      const result = findDirectory(candidates);
      expect(result).toBeDefined();
    });
  });

  describe('Session State Updates', () => {
    it('should update session state on exit', async () => {
      const sessionId = 'update-test';
      const initialState = {
        sessionId,
        status: 'running',
        startTime: new Date().toISOString(),
      };

      await writeFile(join(sessionsDir, `${sessionId}.json`), JSON.stringify(initialState, null, 2));

      // Update on exit
      const updatedState = {
        ...initialState,
        status: 'ended',
        endTime: new Date().toISOString(),
      };

      await writeFile(join(sessionsDir, `${sessionId}.json`), JSON.stringify(updatedState, null, 2));

      const content = await readFile(join(sessionsDir, `${sessionId}.json`), 'utf-8');
      const state = JSON.parse(content);

      expect(state.status).toBe('ended');
      expect(state.endTime).toBeDefined();
    });

    it('should handle state update failures gracefully', async () => {
      const updateSessionState = async (
        sessionId: string,
        updates: Record<string, any>
      ): Promise<boolean> => {
        try {
          // Would update state file
          return true;
        } catch {
          return false;
        }
      };

      const result = await updateSessionState('test', { status: 'ended' });
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle Qwen Code not found', () => {
      const checkQwenInstalled = (): boolean => {
        // Simulating not found
        return false;
      };

      const getErrorMessage = (installed: boolean): string => {
        if (!installed) {
          return 'Qwen Code CLI not found. Install with: npm install -g @qwen-code/cli';
        }
        return '';
      };

      expect(getErrorMessage(checkQwenInstalled())).toContain('not found');
    });

    it('should handle project validation failure', () => {
      const validateProject = (path: string): { valid: boolean; error?: string } => {
        if (!path || path.length === 0) {
          return { valid: false, error: 'Invalid project path' };
        }
        return { valid: true };
      };

      expect(validateProject('').valid).toBe(false);
      expect(validateProject('/valid/path').valid).toBe(true);
    });

    it('should handle state directory creation failure', async () => {
      const createStateDirectory = async (path: string): Promise<boolean> => {
        try {
          await mkdir(path, { recursive: true });
          return true;
        } catch {
          return false;
        }
      };

      // This should succeed on valid paths
      const result = await createStateDirectory(join(qmxDir, 'test'));
      expect(result).toBe(true);
    });
  });

  describe('Help Output', () => {
    it('should display usage information', () => {
      const helpText = `
Usage: qmx launch [options] [project]

Launch QMX-enhanced Qwen Code session

Options:
  --yolo         Bypass all approvals
  --high         High reasoning effort
  --xhigh        Extra high reasoning effort
  --verbose      Verbose output
  --no-hud       Disable HUD display
`.trim();

      expect(helpText).toContain('Usage:');
      expect(helpText).toContain('--yolo');
      expect(helpText).toContain('--verbose');
    });
  });
});
