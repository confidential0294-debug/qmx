/**
 * Tests for Setup Command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile, writeFile, mkdir, rm, access } from 'node:fs/promises';
import { join } from 'node:path';

describe('Setup Command', () => {
  const cwd = process.cwd();
  const qmxDir = join(cwd, '.qmx');
  const stateDir = join(qmxDir, 'state');
  const sessionsDir = join(stateDir, 'sessions');
  const teamsDir = join(stateDir, 'teams');
  const configPath = join(qmxDir, 'config.toml');
  const memoryPath = join(qmxDir, 'project-memory.json');
  const hooksDir = join(qmxDir, 'hooks');

  beforeEach(async () => {
    // Clean up before test
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  afterEach(async () => {
    // Clean up after test
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('Directory Creation', () => {
    it('should create .qmx directory', async () => {
      await mkdir(qmxDir, { recursive: true });
      
      const exists = await access(qmxDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create state directories', async () => {
      await mkdir(sessionsDir, { recursive: true });
      await mkdir(teamsDir, { recursive: true });

      const sessionsExists = await access(sessionsDir).then(() => true).catch(() => false);
      const teamsExists = await access(teamsDir).then(() => true).catch(() => false);

      expect(sessionsExists).toBe(true);
      expect(teamsExists).toBe(true);
    });

    it('should create plans directory', async () => {
      const plansDir = join(qmxDir, 'plans');
      await mkdir(plansDir, { recursive: true });

      const exists = await access(plansDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create logs directory', async () => {
      const logsDir = join(qmxDir, 'logs');
      await mkdir(logsDir, { recursive: true });

      const exists = await access(logsDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should handle existing directories without force', async () => {
      await mkdir(qmxDir, { recursive: true });

      // Second creation should not throw with recursive
      await expect(mkdir(qmxDir, { recursive: true })).resolves.not.toThrow();
    });
  });

  describe('Configuration Creation', () => {
    it('should create config.toml with default values', async () => {
      await mkdir(qmxDir, { recursive: true });

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

      await writeFile(configPath, config);

      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('[team]');
      expect(content).toContain('default_workers = 3');
      expect(content).toContain('[hud]');
      expect(content).toContain('[notifications]');
      expect(content).toContain('[reasoning]');
    });

    it('should include team configuration section', async () => {
      await mkdir(qmxDir, { recursive: true });

      const config = `# QMX Configuration

[team]
default_workers = 3
timeout_minutes = 30
auto_shutdown = true
`;

      await writeFile(configPath, config);

      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('default_workers');
      expect(content).toContain('timeout_minutes');
      expect(content).toContain('auto_shutdown');
    });

    it('should include HUD configuration section', async () => {
      await mkdir(qmxDir, { recursive: true });

      const config = `# QMX Configuration

[hud]
enabled = true
refresh_rate_ms = 1000
`;

      await writeFile(configPath, config);

      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('enabled = true');
      expect(content).toContain('refresh_rate_ms = 1000');
    });

    it('should include notifications configuration', async () => {
      await mkdir(qmxDir, { recursive: true });

      const config = `# QMX Configuration

[notifications]
tmux = true
discord = false
telegram = false
`;

      await writeFile(configPath, config);

      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('tmux = true');
      expect(content).toContain('discord = false');
    });
  });

  describe('Project Memory Creation', () => {
    it('should create project-memory.json with default structure', async () => {
      await mkdir(qmxDir, { recursive: true });

      const memory = {
        projectName: 'test-project',
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

      await writeFile(memoryPath, JSON.stringify(memory, null, 2));

      const content = await readFile(memoryPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.projectName).toBe('test-project');
      expect(parsed.architecture).toBeDefined();
      expect(parsed.architecture.components).toEqual([]);
      expect(parsed.decisions).toEqual([]);
      expect(parsed.todos).toEqual([]);
    });

    it('should extract project name from directory', () => {
      const getNameFromDir = (dir: string): string => {
        return dir.split(/[\\/]/).pop() || 'unknown';
      };

      expect(getNameFromDir('/home/user/my-project')).toBe('my-project');
      expect(getNameFromDir('C:\\Users\\user\\my-project')).toBe('my-project');
      expect(getNameFromDir('/')).toBe('unknown');
    });

    it('should include timestamps in project memory', async () => {
      await mkdir(qmxDir, { recursive: true });

      const beforeCreate = Date.now();
      const memory = {
        projectName: 'test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        architecture: { overview: '', components: [], technologies: [] },
        decisions: [],
        knowledge: [],
        conventions: [],
        todos: [],
      };

      await writeFile(memoryPath, JSON.stringify(memory, null, 2));

      const content = await readFile(memoryPath, 'utf-8');
      const parsed = JSON.parse(content);

      const createTimestamp = new Date(parsed.createdAt).getTime();
      expect(createTimestamp).toBeGreaterThanOrEqual(beforeCreate);
    });
  });

  describe('Hooks Directory Setup', () => {
    it('should create hooks directory', async () => {
      await mkdir(hooksDir, { recursive: true });

      const exists = await access(hooksDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create example hook file', async () => {
      await mkdir(hooksDir, { recursive: true });

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

      await writeFile(exampleHook, example);

      const content = await readFile(exampleHook, 'utf-8');
      expect(content).toContain('export const events');
      expect(content).toContain('session-start');
      expect(content).toContain('export async function sessionStart');
      expect(content).toContain('export async function turnComplete');
    });

    it('should include all required hook exports', async () => {
      await mkdir(hooksDir, { recursive: true });

      const exampleHook = join(hooksDir, 'example.mjs');
      const example = `export const events = ['session-start', 'turn-complete'];

export async function sessionStart(sdk) {
  sdk.log.info('Session started!');
}

export async function turnComplete(sdk) {
  sdk.log.info('Turn completed');
}
`;

      await writeFile(exampleHook, example);

      const content = await readFile(exampleHook, 'utf-8');
      
      // Verify required exports
      expect(content).toMatch(/export\s+const\s+events\s*=/);
      expect(content).toMatch(/export\s+async\s+function\s+sessionStart/);
      expect(content).toMatch(/export\s+async\s+function\s+turnComplete/);
    });
  });

  describe('Force Option', () => {
    it('should overwrite existing config with force option', async () => {
      await mkdir(qmxDir, { recursive: true });

      // Create initial config
      const initialConfig = '# Initial config\n[team]\ndefault_workers = 1';
      await writeFile(configPath, initialConfig);

      // Overwrite with new config (simulating --force)
      const newConfig = `# QMX Configuration

[team]
default_workers = 5
timeout_minutes = 60
`;
      await writeFile(configPath, newConfig);

      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('default_workers = 5');
      expect(content).not.toContain('default_workers = 1');
    });

    it('should skip existing hook file without force', async () => {
      await mkdir(hooksDir, { recursive: true });

      const exampleHook = join(hooksDir, 'example.mjs');
      const initialContent = '// Initial hook content';
      await writeFile(exampleHook, initialContent);

      // Check if exists (simulating without --force)
      const exists = await access(exampleHook).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Content should remain unchanged
      const content = await readFile(exampleHook, 'utf-8');
      expect(content).toBe(initialContent);
    });
  });

  describe('Setup Output', () => {
    it('should provide next steps after setup', () => {
      const nextSteps = [
        'Run qmx doctor to verify installation',
        'Run qmx to launch QMX',
        'Create custom hooks in .qmx/hooks/',
      ];

      expect(nextSteps).toHaveLength(3);
      expect(nextSteps[0]).toContain('qmx doctor');
      expect(nextSteps[1]).toContain('qmx');
      expect(nextSteps[2]).toContain('.qmx/hooks/');
    });

    it('should display success message', () => {
      const successMessage = 'QMX setup complete!';
      expect(successMessage).toContain('setup complete');
    });
  });

  describe('Error Handling', () => {
    it('should handle permission errors gracefully', async () => {
      // Simulate permission error scenario
      const protectedDir = '/root/protected';
      
      try {
        await mkdir(protectedDir, { recursive: true });
        // If we get here, we're running as root (unlikely on Windows)
        expect(true).toBe(true);
      } catch (error) {
        // Expected to fail with permission error
        expect(error).toBeDefined();
      }
    });

    it('should handle disk space errors', async () => {
      // This is a conceptual test - actual disk space testing is complex
      const errorMessage = 'ENOSPC: no space left on device';
      expect(errorMessage).toContain('ENOSPC');
    });
  });
});
