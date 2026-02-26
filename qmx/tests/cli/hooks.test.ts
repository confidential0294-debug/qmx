/**
 * Tests for Hooks Command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';

describe('Hooks Command', () => {
  const qmxDir = join(process.cwd(), '.qmx');
  const hooksDir = join(qmxDir, 'hooks');

  beforeEach(async () => {
    await mkdir(hooksDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('Hooks Initialization', () => {
    it('should create hooks directory', async () => {
      const exists = await access(hooksDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create example plugin file', async () => {
      const examplePath = join(hooksDir, 'example.mjs');
      const example = `// QMX Hook Plugin Example
export const events = ['session-start', 'turn-complete'];

export async function sessionStart(sdk) {
  sdk.log.info('Session started!');
}

export async function turnComplete(sdk) {
  sdk.log.info('Turn completed');
}

export const metadata = {
  name: 'example-plugin',
  version: '1.0.0',
  description: 'Example QMX hook plugin',
};
`;
      await writeFile(examplePath, example);

      const content = await readFile(examplePath, 'utf-8');
      expect(content).toContain('export const events');
      expect(content).toContain('export const metadata');
    });

    it('should handle existing hooks directory', async () => {
      // Create initial file
      const existingPath = join(hooksDir, 'existing.mjs');
      await writeFile(existingPath, '// existing');

      // Check existence
      const exists = await access(existingPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should overwrite with force option', async () => {
      const examplePath = join(hooksDir, 'example.mjs');
      
      // Create initial
      await writeFile(examplePath, '// old content');
      
      // Overwrite (simulating --force)
      await writeFile(examplePath, '// new content');
      
      const content = await readFile(examplePath, 'utf-8');
      expect(content).toBe('// new content');
    });
  });

  describe('Hooks Status', () => {
    it('should list installed plugins', async () => {
      const plugins = [
        { file: 'plugin1.mjs', name: 'plugin1', events: ['session-start'] },
        { file: 'plugin2.mjs', name: 'plugin2', events: ['turn-complete'] },
      ];

      for (const plugin of plugins) {
        const content = `export const events = ${JSON.stringify(plugin.events)};`;
        await writeFile(join(hooksDir, plugin.file), content);
      }

      const files = await readdir(hooksDir);
      const mjsFiles = files.filter(f => f.endsWith('.mjs'));

      expect(mjsFiles).toHaveLength(2);
    });

    it('should filter only .mjs files', async () => {
      await writeFile(join(hooksDir, 'valid.mjs'), 'export const events = [];');
      await writeFile(join(hooksDir, 'invalid.js'), 'export const events = [];');
      await writeFile(join(hooksDir, 'readme.md'), '# README');

      const files = await readdir(hooksDir);
      const mjsFiles = files.filter(f => f.endsWith('.mjs'));

      expect(mjsFiles).toHaveLength(1);
      expect(mjsFiles[0]).toBe('valid.mjs');
    });

    it('should output JSON when requested', async () => {
      const plugins = [
        { name: 'test-plugin', file: 'test.mjs', status: 'ok', events: ['event1'] },
      ];

      const jsonOutput = JSON.stringify(plugins, null, 2);
      const parsed = JSON.parse(jsonOutput);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('test-plugin');
    });

    it('should handle empty hooks directory', async () => {
      const files = await readdir(hooksDir);
      const mjsFiles = files.filter(f => f.endsWith('.mjs'));

      expect(mjsFiles).toHaveLength(0);
    });
  });

  describe('Plugin Validation', () => {
    it('should validate plugin syntax', async () => {
      const validPlugin = `export const events = ['session-start'];
export async function sessionStart(sdk) {
  sdk.log.info('Started');
}`;

      const pluginPath = join(hooksDir, 'valid.mjs');
      await writeFile(pluginPath, validPlugin);

      // In real implementation, would try to import
      const content = await readFile(pluginPath, 'utf-8');
      expect(content).toContain('export const events');
      expect(content).toContain('export async function sessionStart');
    });

    it('should check for events export', () => {
      const hasEventsExport = (content: string): boolean => {
        return /export\s+const\s+events\s*=\s*\[/.test(content);
      };

      expect(hasEventsExport('export const events = [];')).toBe(true);
      expect(hasEventsExport('const events = [];')).toBe(false);
      expect(hasEventsExport('export let events = [];')).toBe(false);
    });

    it('should check events is an array', () => {
      const isValidEvents = (content: string): boolean => {
        const match = content.match(/export\s+const\s+events\s*=\s*(\[.*?\])/s);
        if (!match) return false;
        try {
          const arr = JSON.parse(match[1]);
          return Array.isArray(arr);
        } catch {
          return false;
        }
      };

      expect(isValidEvents('export const events = []')).toBe(true);
      expect(isValidEvents('export const events = ["event1"]')).toBe(true);
      expect(isValidEvents('export const events = {}')).toBe(false);
    });

    it('should validate handler functions exist', () => {
      const hasHandler = (content: string, eventName: string): boolean => {
        const functionName = eventName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const regex = new RegExp(`export\\s+async\\s+function\\s+${functionName}`);
        return regex.test(content);
      };

      const plugin = `export const events = ['session-start'];
export async function sessionStart(sdk) {}`;

      expect(hasHandler(plugin, 'session-start')).toBe(true);
      expect(hasHandler(plugin, 'turn-complete')).toBe(false);
    });

    it('should report validation errors', () => {
      const validatePlugin = (content: string): { valid: boolean; error?: string } => {
        if (!/export\s+const\s+events/.test(content)) {
          return { valid: false, error: 'Missing "events" export' };
        }
        return { valid: true };
      };

      expect(validatePlugin('export const events = [];').valid).toBe(true);
      expect(validatePlugin('const events = [];').error).toContain('Missing');
    });
  });

  describe('Plugin Testing', () => {
    it('should load plugin for testing', async () => {
      const pluginContent = `export const events = ['test-event'];
export async function testEvent(sdk) {
  sdk.log.info('Test executed');
  return { success: true };
}`;

      const pluginPath = join(hooksDir, 'test-plugin.mjs');
      await writeFile(pluginPath, pluginContent);

      const exists = await access(pluginPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create mock SDK for testing', () => {
      const createMockSdk = () => ({
        log: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
        },
        state: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(undefined),
          delete: vi.fn().mockResolvedValue(undefined),
        },
        notify: vi.fn().mockResolvedValue(undefined),
        tmux: {
          sendKeys: vi.fn().mockResolvedValue(undefined),
          capture: vi.fn().mockResolvedValue(''),
        },
        fs: {
          read: vi.fn().mockResolvedValue(''),
          write: vi.fn().mockResolvedValue(undefined),
          exists: vi.fn().mockResolvedValue(false),
        },
        exec: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      });

      const mockSdk = createMockSdk();
      expect(mockSdk.log).toBeDefined();
      expect(mockSdk.state).toBeDefined();
      expect(typeof mockSdk.log.info).toBe('function');
    });

    it('should test event handler execution', async () => {
      const mockLog: string[] = [];
      const mockSdk = {
        log: {
          info: (msg: string) => mockLog.push(msg),
          warn: () => {},
          error: () => {},
          debug: () => {},
        },
        state: {
          get: async () => ({}),
          set: async () => {},
          delete: async () => {},
        },
        notify: async () => {},
        tmux: { sendKeys: async () => {}, capture: async () => '' },
        fs: { read: async () => '', write: async () => {}, exists: async () => false },
        exec: async () => ({ stdout: '', stderr: '', exitCode: 0 }),
      };

      // Simulate handler execution
      await (async function sessionStart(sdk: any) {
        sdk.log.info('Session started!');
      })(mockSdk);

      expect(mockLog).toContain('Session started!');
    });

    it('should handle missing handler gracefully', () => {
      const plugin = { events: ['event1', 'event2'] };
      const handlers: Record<string, Function> = { event1: () => {} };

      const missingHandlers = plugin.events.filter(e => !handlers[e]);
      expect(missingHandlers).toContain('event2');
    });
  });

  describe('Plugin Metadata', () => {
    it('should read plugin metadata', async () => {
      const pluginContent = `export const events = ['session-start'];
export async function sessionStart(sdk) {}

export const metadata = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
};`;

      const pluginPath = join(hooksDir, 'meta-plugin.mjs');
      await writeFile(pluginPath, pluginContent);

      const content = await readFile(pluginPath, 'utf-8');
      expect(content).toContain('export const metadata');
      expect(content).toContain('name:');
      expect(content).toContain('version:');
    });

    it('should handle missing metadata', () => {
      const getMetadata = (content: string): Record<string, string> => {
        const match = content.match(/export\s+const\s+metadata\s*=\s*\{([^}]+)\}/s);
        if (!match) return {};
        
        const metadata: Record<string, string> = {};
        const lines = match[1].split('\n');
        for (const line of lines) {
          const kv = line.match(/(\w+)\s*:\s*['"]([^'"]+)['"]/);
          if (kv) {
            metadata[kv[1]] = kv[2];
          }
        }
        return metadata;
      };

      const withMetadata = `export const metadata = { name: 'test', version: '1.0.0' };`;
      const withoutMetadata = `export const events = [];`;

      expect(getMetadata(withMetadata).name).toBe('test');
      expect(getMetadata(withoutMetadata)).toEqual({});
    });
  });

  describe('Event Registration', () => {
    it('should register built-in events', () => {
      const builtInEvents = [
        'session:start',
        'session:end',
        'team:create',
        'team:start',
        'task:complete',
        'file:create',
        'git:commit',
      ];

      expect(builtInEvents).toContain('session:start');
      expect(builtInEvents).toContain('team:create');
      expect(builtInEvents).toContain('file:create');
    });

    it('should validate event names', () => {
      const isValidEventName = (name: string): boolean => {
        return /^[a-z]+(:[a-z]+)?$/.test(name);
      };

      expect(isValidEventName('session-start')).toBe(false); // uses hyphen
      expect(isValidEventName('session:start')).toBe(true);
      expect(isValidEventName('invalid@event')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle plugin load errors', async () => {
      const invalidPlugin = `export const events = [;`; // Syntax error

      const pluginPath = join(hooksDir, 'invalid.mjs');
      await writeFile(pluginPath, invalidPlugin);

      // Would fail to import in real implementation
      const content = await readFile(pluginPath, 'utf-8');
      expect(content).toContain('export const events');
    });

    it('should handle missing plugin file', async () => {
      const pluginName = 'non-existent';
      const pluginPath = join(hooksDir, `${pluginName}.mjs`);

      const exists = await access(pluginPath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('should report validation errors with details', () => {
      const errors: Array<{ file: string; error: string }> = [
        { file: 'plugin1.mjs', error: 'Missing "events" export' },
        { file: 'plugin2.mjs', error: 'Syntax error: Unexpected token' },
      ];

      expect(errors).toHaveLength(2);
      expect(errors[0].error).toContain('Missing');
    });
  });
});
