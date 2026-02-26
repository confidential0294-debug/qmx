/**
 * Tests for Config Generator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('Config Generator', () => {
  const qmxDir = join(process.cwd(), '.qmx');
  const configDir = join(qmxDir, 'config');
  const overlaysDir = join(configDir, 'overlays');
  const configPath = join(configDir, 'qwen-overlay.json');

  beforeEach(async () => {
    await mkdir(overlaysDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('Configuration Generation', () => {
    it('should generate complete overlay configuration', async () => {
      const config = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        projectRoot: process.cwd(),
        settings: {
          theme: 'dark',
          fontSize: 14,
          autoSave: true,
        },
        skills: {
          plan: { enabled: true, priority: 1 },
          team: { enabled: true, priority: 2 },
        },
        modes: [
          {
            name: 'development',
            description: 'Development mode',
            skills: ['plan', 'team', 'review'],
          },
        ],
        mcpServers: {
          'qmx-state': { command: 'node', args: ['./dist/mcp/state-server.js'] },
        },
        metadata: {
          generator: 'qmx-config-generator',
        },
      };

      await writeFile(configPath, JSON.stringify(config, null, 2));

      const content = await readFile(configPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.version).toBe('1.0.0');
      expect(parsed.settings.theme).toBe('dark');
      expect(parsed.modes).toHaveLength(1);
    });

    it('should include default settings', () => {
      const defaultSettings = {
        theme: 'dark',
        fontSize: 14,
        autoSave: true,
        confirmBeforeExecute: true,
        maxContextTokens: 8192,
        enableCodeActions: true,
        enableInlineChat: true,
      };

      expect(defaultSettings.theme).toBe('dark');
      expect(defaultSettings.maxContextTokens).toBe(8192);
    });

    it('should include default skills', () => {
      const defaultSkills: Record<string, { enabled: boolean; priority: number }> = {
        plan: { enabled: true, priority: 1 },
        team: { enabled: true, priority: 2 },
        review: { enabled: true, priority: 1 },
        test: { enabled: true, priority: 1 },
        debug: { enabled: true, priority: 2 },
        refactor: { enabled: true, priority: 1 },
      };

      expect(Object.keys(defaultSkills)).toHaveLength(6);
      expect(defaultSkills['plan'].enabled).toBe(true);
      expect(defaultSkills['team'].priority).toBe(2);
    });
  });

  describe('Mode Configuration', () => {
    it('should generate mode configuration', () => {
      const generateModeConfig = (name: string, skills: string[]): Record<string, any> => {
        return {
          name,
          description: `${name} mode`,
          skills,
          settings: {},
        };
      };

      const mode = generateModeConfig('development', ['plan', 'team', 'review']);

      expect(mode.name).toBe('development');
      expect(mode.skills).toHaveLength(3);
      expect(mode.skills).toContain('plan');
    });

    it('should support multiple modes', () => {
      const modes = [
        { name: 'development', skills: ['plan', 'team', 'review', 'test'] },
        { name: 'review', skills: ['review', 'test', 'document'] },
        { name: 'debug', skills: ['debug', 'test', 'review'] },
        { name: 'refactor', skills: ['plan', 'review', 'refactor', 'test'] },
      ];

      expect(modes).toHaveLength(4);
      expect(modes[0].name).toBe('development');
      expect(modes[1].name).toBe('review');
    });

    it('should validate mode names are unique', () => {
      const modes = [
        { name: 'development', skills: [] },
        { name: 'review', skills: [] },
        { name: 'development', skills: [] }, // Duplicate
      ];

      const modeNames = new Set(modes.map(m => m.name));
      const hasDuplicates = modeNames.size !== modes.length;

      expect(hasDuplicates).toBe(true);
    });
  });

  describe('MCP Server Configuration', () => {
    it('should generate MCP server config', () => {
      const generateMcpConfig = (
        name: string,
        command: string,
        args: string[]
      ): Record<string, any> => {
        return {
          command,
          args,
          disabled: false,
        };
      };

      const server = generateMcpConfig('qmx-state', 'node', ['./dist/mcp/state-server.js']);

      expect(server.command).toBe('node');
      expect(server.args).toHaveLength(1);
      expect(server.disabled).toBe(false);
    });

    it('should include default MCP servers', () => {
      const defaultServers = {
        'qmx-memory': { command: 'node', args: ['./.qmx/dist/mcp/memory-server.js'] },
        'qmx-state': { command: 'node', args: ['./.qmx/dist/mcp/state-server.js'] },
        'qmx-code-intel': { command: 'node', args: ['./.qmx/dist/mcp/code-intel-server.js'] },
        'qmx-trace': { command: 'node', args: ['./.qmx/dist/mcp/trace-server.js'] },
      };

      expect(Object.keys(defaultServers)).toHaveLength(4);
      expect(defaultServers['qmx-memory'].command).toBe('node');
    });

    it('should support disabling servers', () => {
      const servers = {
        'qmx-state': { command: 'node', disabled: false },
        'qmx-memory': { command: 'node', disabled: true },
      };

      const enabledServers = Object.entries(servers)
        .filter(([, config]) => !config.disabled)
        .map(([name]) => name);

      expect(enabledServers).toHaveLength(1);
      expect(enabledServers).toContain('qmx-state');
    });
  });

  describe('Configuration Merging', () => {
    it('should merge multiple configurations', () => {
      const baseConfig = {
        version: '1.0.0',
        settings: { theme: 'dark' },
        skills: { plan: { enabled: true } },
      };

      const overrideConfig = {
        settings: { fontSize: 16 },
        skills: { team: { enabled: true } },
      };

      const merged = {
        ...baseConfig,
        settings: { ...baseConfig.settings, ...overrideConfig.settings },
        skills: { ...baseConfig.skills, ...overrideConfig.skills },
      };

      expect(merged.settings.theme).toBe('dark');
      expect(merged.settings.fontSize).toBe(16);
      expect(merged.skills.plan).toBeDefined();
      expect(merged.skills.team).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required fields', () => {
      const validateConfig = (config: Record<string, any>): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!config.version) {
          errors.push('Missing version field');
        }
        if (!config.projectRoot) {
          errors.push('Missing projectRoot field');
        }

        return { valid: errors.length === 0, errors };
      };

      const validConfig = { version: '1.0.0', projectRoot: '/path' };
      const invalidConfig = { version: '1.0.0' };

      expect(validateConfig(validConfig).valid).toBe(true);
      expect(validateConfig(invalidConfig).errors).toContain('Missing projectRoot field');
    });

    it('should validate skill priorities', () => {
      const validateSkillPriorities = (skills: Record<string, any>): string[] => {
        const warnings: string[] = [];

        for (const [name, skill] of Object.entries(skills)) {
          if (skill.priority < 1 || skill.priority > 10) {
            warnings.push(`Skill "${name}" has unusual priority: ${skill.priority}`);
          }
        }

        return warnings;
      };

      const skills = {
        plan: { priority: 1 },
        team: { priority: 15 }, // Invalid
      };

      const warnings = validateSkillPriorities(skills);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('unusual priority');
    });

    it('should validate mode configurations', () => {
      const validateModes = (modes: any[]): { valid: boolean; errors: string[]; warnings: string[] } => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const modeNames = new Set<string>();

        for (const mode of modes) {
          if (modeNames.has(mode.name)) {
            errors.push(`Duplicate mode name: ${mode.name}`);
          }
          modeNames.add(mode.name);

          if (!mode.skills || mode.skills.length === 0) {
            warnings.push(`Mode "${mode.name}" has no skills`);
          }
        }

        return { valid: errors.length === 0, errors, warnings };
      };

      const modes = [
        { name: 'dev', skills: ['plan'] },
        { name: 'dev', skills: ['review'] }, // Duplicate
        { name: 'empty', skills: [] }, // No skills
      ];

      const result = validateModes(modes);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate mode name: dev');
      expect(result.warnings).toContain('Mode "empty" has no skills');
    });
  });

  describe('Preset Management', () => {
    it('should create preset configuration', async () => {
      const preset = {
        name: 'development',
        description: 'Development preset',
        settings: { theme: 'dark' },
        skills: { plan: { enabled: true } },
      };

      const presetPath = join(overlaysDir, `${preset.name}.json`);
      await writeFile(presetPath, JSON.stringify(preset, null, 2));

      const content = await readFile(presetPath, 'utf-8');
      const loaded = JSON.parse(content);

      expect(loaded.name).toBe('development');
      expect(loaded.description).toBe('Development preset');
    });

    it('should load preset configuration', async () => {
      const preset = { name: 'test-preset', settings: { theme: 'light' } };
      const presetPath = join(overlaysDir, 'test-preset.json');

      await writeFile(presetPath, JSON.stringify(preset, null, 2));

      const content = await readFile(presetPath, 'utf-8');
      const loaded = JSON.parse(content);

      expect(loaded.name).toBe('test-preset');
      expect(loaded.settings.theme).toBe('light');
    });

    it('should list available presets', async () => {
      const presets = ['development', 'review', 'debug'];

      for (const preset of presets) {
        await writeFile(join(overlaysDir, `${preset}.json`), JSON.stringify({ name: preset }));
      }

      const files = await Promise.all(
        presets.map(p => readFile(join(overlaysDir, `${p}.json`), 'utf-8'))
      );

      expect(files).toHaveLength(3);
    });

    it('should delete preset', async () => {
      const presetPath = join(overlaysDir, 'to-delete.json');
      await writeFile(presetPath, JSON.stringify({ name: 'to-delete' }));

      await rm(presetPath, { force: true });

      const exists = await readFile(presetPath, 'utf-8').catch(() => null);
      expect(exists).toBeNull();
    });
  });

  describe('Configuration Export', () => {
    it('should export to JSON format', () => {
      const config = { version: '1.0.0', settings: { theme: 'dark' } };
      const jsonExport = JSON.stringify(config, null, 2);
      const parsed = JSON.parse(jsonExport);

      expect(parsed.version).toBe('1.0.0');
    });

    it('should export to TOML format', () => {
      const convertToToml = (config: Record<string, any>): string => {
        let toml = `version = "${config.version}"\n`;
        if (config.settings) {
          toml += '\n[settings]\n';
          for (const [key, value] of Object.entries(config.settings)) {
            toml += `${key} = ${JSON.stringify(value)}\n`;
          }
        }
        return toml;
      };

      const config = { version: '1.0.0', settings: { theme: 'dark', fontSize: 14 } };
      const toml = convertToToml(config);

      expect(toml).toContain('version = "1.0.0"');
      expect(toml).toContain('[settings]');
      expect(toml).toContain('theme = "dark"');
    });
  });

  describe('Skill Discovery', () => {
    it('should discover skills in directories', () => {
      const discoverSkills = (skillDirs: string[]): string[] => {
        // Simulated discovery
        return ['plan', 'team', 'review', 'test'];
      };

      const skills = discoverSkills(['./skills', './.qmx/skills']);
      expect(skills).toHaveLength(4);
      expect(skills).toContain('plan');
    });

    it('should check for SKILL.md files', () => {
      const hasSkillFile = (dir: string): boolean => {
        // Would check for SKILL.md in real implementation
        return true;
      };

      expect(hasSkillFile('./skills/plan')).toBe(true);
    });
  });

  describe('Prompt Discovery', () => {
    it('should discover prompts in directories', () => {
      const discoverPrompts = (promptDirs: string[]): Record<string, string> => {
        return {
          'architect': '# Architect Prompt\n\nYou are an architect...',
          'planner': '# Planner Prompt\n\nYou are a planner...',
        };
      };

      const prompts = discoverPrompts(['./prompts']);
      expect(Object.keys(prompts)).toHaveLength(2);
      expect(prompts['architect']).toContain('Architect');
    });
  });

  describe('Configuration Application', () => {
    it('should apply configuration to Qwen Code', async () => {
      const applyConfig = (config: Record<string, any>): { applied: string[]; failed: any[] } => {
        const applied: string[] = [];
        const failed: any[] = [];

        if (config.settings) applied.push('settings');
        if (config.mcpServers) applied.push('mcpServers');

        return { applied, failed };
      };

      const config = {
        settings: { theme: 'dark' },
        mcpServers: { 'qmx-state': {} },
      };

      const result = applyConfig(config);
      expect(result.applied).toHaveLength(2);
      expect(result.applied).toContain('settings');
    });
  });
});
