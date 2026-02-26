/**
 * QMX Config Generator
 *
 * Generates Qwen Code overlay configuration files.
 * Creates .qwen/settings.json overlays, skill configurations, and mode presets.
 */

import { readdir, rm } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { z } from 'zod';
import { cliLogger } from '../utils/logger.js';
import { ensureDir, readJson, writeJson, fileExists, readText } from '../utils/fs.js';

// Schema definitions

const SkillConfigSchema = z.object({
  enabled: z.boolean().default(true),
  priority: z.number().default(1),
  autoTrigger: z.array(z.string()).optional(),
  parameters: z.record(z.unknown()).optional(),
});

const ModeConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  skills: z.array(z.string()),
  settings: z.record(z.unknown()).optional(),
  prompts: z.array(z.string()).optional(),
});

const McpServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  disabled: z.boolean().default(false),
  timeout: z.number().optional(),
});

const QwenOverlayConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  generatedAt: z.string(),
  projectRoot: z.string(),
  settings: z.record(z.unknown()).optional(),
  skills: z.record(z.string(), SkillConfigSchema).optional(),
  modes: z.array(ModeConfigSchema).optional(),
  mcpServers: z.record(z.string(), McpServerConfigSchema).optional(),
  prompts: z.record(z.string(), z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

type QwenOverlayConfig = z.infer<typeof QwenOverlayConfigSchema>;

export type SkillConfig = z.infer<typeof SkillConfigSchema>;
export type ModeConfig = z.infer<typeof ModeConfigSchema>;
export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;
export type { QwenOverlayConfig };

// Config paths
const QWEN_DIR = join(process.cwd(), '.qwen');
const QMX_DIR = join(process.cwd(), '.qmx');
const CONFIG_DIR = join(QMX_DIR, 'config');
const OVERLAYS_DIR = join(CONFIG_DIR, 'overlays');

// Default configurations
const DEFAULT_SETTINGS: Record<string, unknown> = {
  theme: 'dark',
  fontSize: 14,
  autoSave: true,
  confirmBeforeExecute: true,
  maxContextTokens: 8192,
  enableCodeActions: true,
  enableInlineChat: true,
};

const DEFAULT_SKILLS: Record<string, SkillConfig> = {
  plan: { enabled: true, priority: 1 },
  team: { enabled: true, priority: 2 },
  review: { enabled: true, priority: 1 },
  test: { enabled: true, priority: 1 },
  debug: { enabled: true, priority: 2 },
  refactor: { enabled: true, priority: 1 },
  document: { enabled: true, priority: 1 },
  modernize: { enabled: true, priority: 1 },
  migrate: { enabled: true, priority: 2 },
  secure: { enabled: true, priority: 2 },
  optimize: { enabled: true, priority: 2 },
  deploy: { enabled: true, priority: 3 },
};

const DEFAULT_MODES: ModeConfig[] = [
  {
    name: 'development',
    description: 'Standard development mode with all core skills',
    skills: ['plan', 'team', 'review', 'test', 'debug', 'refactor'],
    settings: {
      autoSave: true,
      confirmBeforeExecute: false,
    },
  },
  {
    name: 'review',
    description: 'Code review focused mode',
    skills: ['review', 'test', 'document'],
    settings: {
      maxContextTokens: 16384,
    },
  },
  {
    name: 'refactor',
    description: 'Large-scale refactoring mode',
    skills: ['plan', 'review', 'refactor', 'test'],
    settings: {
      confirmBeforeExecute: true,
    },
  },
  {
    name: 'debug',
    description: 'Debugging and troubleshooting mode',
    skills: ['debug', 'test', 'review'],
    settings: {
      enableCodeActions: true,
      enableInlineChat: true,
    },
  },
  {
    name: 'documentation',
    description: 'Documentation generation mode',
    skills: ['document', 'review'],
    settings: {
      maxContextTokens: 16384,
    },
  },
  {
    name: 'modernization',
    description: 'Legacy code modernization mode',
    skills: ['modernize', 'review', 'test', 'refactor'],
    settings: {
      confirmBeforeExecute: true,
    },
  },
];

const DEFAULT_MCP_SERVERS: Record<string, McpServerConfig> = {
  'qmx-memory': {
    command: 'node',
    args: ['./.qmx/dist/mcp/memory-server.js'],
    disabled: false,
  },
  'qmx-state': {
    command: 'node',
    args: ['./.qmx/dist/mcp/state-server.js'],
    disabled: false,
  },
  'qmx-code-intel': {
    command: 'node',
    args: ['./.qmx/dist/mcp/code-intel-server.js'],
    disabled: false,
  },
  'qmx-trace': {
    command: 'node',
    args: ['./.qmx/dist/mcp/trace-server.js'],
    disabled: false,
  },
};

// Config Generator class
export class ConfigGenerator {
  private configPath: string;
  private overlaysDir: string;

  constructor(options?: { configPath?: string; overlaysDir?: string }) {
    this.configPath = options?.configPath || join(CONFIG_DIR, 'qwen-overlay.json');
    this.overlaysDir = options?.overlaysDir || OVERLAYS_DIR;
  }

  /**
   * Generate complete Qwen Code overlay configuration
   */
  async generate(options: GenerateOptions = {}): Promise<QwenOverlayConfig> {
    const config: QwenOverlayConfig = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      projectRoot: process.cwd(),
      settings: options.includeSettings !== false ? { ...DEFAULT_SETTINGS, ...options.settings } : undefined,
      skills: options.includeSkills !== false ? { ...DEFAULT_SKILLS, ...options.skills } as Record<string, { priority: number; enabled: boolean; autoTrigger?: string[]; parameters?: Record<string, unknown> }> : undefined,
      modes: options.includeModes !== false ? [...DEFAULT_MODES, ...(options.modes || [])] as { name: string; description: string; skills: string[]; prompts?: string[]; settings?: Record<string, unknown> }[] : undefined,
      mcpServers: options.includeMcpServers !== false ? { ...DEFAULT_MCP_SERVERS, ...options.mcpServers } as Record<string, { disabled: boolean; command: string; timeout?: number; args?: string[]; env?: Record<string, string> }> : undefined,
      prompts: options.includePrompts !== false ? await this.discoverPrompts() : undefined,
      metadata: {
        generator: 'qmx-config-generator',
        generatorVersion: '1.0.0',
        ...options.metadata,
      },
    };

    return config;
  }

  /**
   * Generate and save configuration to file
   */
  async generateAndSave(options: GenerateOptions = {}): Promise<string> {
    const config = await this.generate(options);
    await ensureDir(dirname(this.configPath));
    await writeJson(this.configPath, config);
    cliLogger.info(`Configuration saved to: ${this.configPath}`);
    return this.configPath;
  }

  /**
   * Generate overlay for specific Qwen Code settings file
   */
  async generateSettingsOverlay(
    targetPath: string,
    overlay: Record<string, unknown>
  ): Promise<string> {
    await ensureDir(dirname(targetPath));

    let existing = {};
    if (await fileExists(targetPath)) {
      existing = await readJson(targetPath);
    }

    const merged = {
      ...existing,
      ...overlay,
      _qmxOverlay: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    await writeJson(targetPath, merged);
    cliLogger.info(`Settings overlay saved to: ${targetPath}`);
    return targetPath;
  }

  /**
   * Generate skill configuration
   */
  async generateSkillConfig(_skillName: string, config: Partial<SkillConfig> = {}): Promise<SkillConfig> {
    const skillConfig: SkillConfig = {
      enabled: true,
      priority: 1,
      ...config,
    };

    return skillConfig;
  }

  /**
   * Generate mode configuration
   */
  async generateModeConfig(mode: Partial<ModeConfig>): Promise<ModeConfig> {
    if (!mode.name) {
      throw new Error('Mode name is required');
    }

    const modeConfig: ModeConfig = {
      name: mode.name,
      description: mode.description || `${mode.name} mode`,
      skills: mode.skills || [],
      settings: mode.settings,
      prompts: mode.prompts,
    };

    return modeConfig;
  }

  /**
   * Generate MCP server configuration
   */
  async generateMcpServerConfig(
    _serverName: string,
    config: Partial<McpServerConfig>
  ): Promise<McpServerConfig> {
    if (!config.command) {
      throw new Error('MCP server command is required');
    }

    const mcpConfig: McpServerConfig = {
      command: config.command,
      args: config.args || [],
      env: config.env,
      disabled: config.disabled ?? false,
      timeout: config.timeout,
    };

    return mcpConfig;
  }

  /**
   * Discover and catalog prompts in the project
   */
  async discoverPrompts(): Promise<Record<string, string>> {
    const prompts: Record<string, string> = {};
    const promptDirs = [
      join(process.cwd(), '.qwen', 'prompts'),
      join(process.cwd(), 'prompts'),
      join(QMX_DIR, 'prompts'),
    ];

    for (const dir of promptDirs) {
      try {
        const files = await this.findPromptFiles(dir);
        for (const file of files) {
          const relativePath = relative(dir, file);
          const name = relativePath.replace(/\.[^.]+$/, '');
          const content = await readText(file);
          prompts[name] = content;
        }
      } catch {
        // Directory might not exist
      }
    }

    return prompts;
  }

  /**
   * Discover skills in the project
   */
  async discoverSkills(): Promise<string[]> {
    const skills: string[] = [];
    const skillDirs = [
      join(process.cwd(), '.qwen', 'skills'),
      join(process.cwd(), 'skills'),
      join(QMX_DIR, 'skills'),
    ];

    for (const dir of skillDirs) {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const skillPath = join(dir, entry.name, 'SKILL.md');
            if (await fileExists(skillPath)) {
              skills.push(entry.name);
            }
          }
        }
      } catch {
        // Directory might not exist
      }
    }

    return skills;
  }

  /**
   * Load existing configuration
   */
  async loadConfig(): Promise<QwenOverlayConfig | null> {
    try {
      if (await fileExists(this.configPath)) {
        return await readJson<QwenOverlayConfig>(this.configPath);
      }
    } catch (error) {
      cliLogger.warn('Failed to load config:', error);
    }
    return null;
  }

  /**
   * Merge configurations
   */
  async mergeConfigs(...configs: Partial<QwenOverlayConfig>[]): Promise<QwenOverlayConfig> {
    const merged: QwenOverlayConfig = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      projectRoot: process.cwd(),
    };

    for (const config of configs) {
      if (config.settings) {
        merged.settings = { ...merged.settings, ...config.settings };
      }
      if (config.skills) {
        merged.skills = { ...merged.skills, ...config.skills };
      }
      if (config.modes) {
        merged.modes = [...(merged.modes || []), ...config.modes];
      }
      if (config.mcpServers) {
        merged.mcpServers = { ...merged.mcpServers, ...config.mcpServers };
      }
      if (config.prompts) {
        merged.prompts = { ...merged.prompts, ...config.prompts };
      }
      if (config.metadata) {
        merged.metadata = { ...merged.metadata, ...config.metadata };
      }
    }

    return merged;
  }

  /**
   * Validate configuration
   */
  async validateConfig(config: QwenOverlayConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate version
    if (!config.version) {
      errors.push('Missing version field');
    }

    // Validate skills
    if (config.skills) {
      for (const [name, skill] of Object.entries(config.skills)) {
        if (skill.priority < 1 || skill.priority > 10) {
          warnings.push(`Skill "${name}" has unusual priority: ${skill.priority}`);
        }
      }
    }

    // Validate modes
    if (config.modes) {
      const modeNames = new Set<string>();
      for (const mode of config.modes) {
        if (modeNames.has(mode.name)) {
          errors.push(`Duplicate mode name: ${mode.name}`);
        }
        modeNames.add(mode.name);

        if (!mode.skills || mode.skills.length === 0) {
          warnings.push(`Mode "${mode.name}" has no skills`);
        }
      }
    }

    // Validate MCP servers
    if (config.mcpServers) {
      for (const [name, server] of Object.entries(config.mcpServers)) {
        if (!server.command) {
          errors.push(`MCP server "${name}" missing command`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Export configuration to different formats
   */
  async exportConfig(
    config: QwenOverlayConfig,
    format: 'json' | 'toml' | 'yaml' = 'json'
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(config, null, 2);

      case 'toml':
        return this.convertToToml(config);

      case 'yaml':
        return this.convertToYaml(config);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Create preset configuration
   */
  async createPreset(name: string, preset: PresetConfig): Promise<string> {
    const presetPath = join(this.overlaysDir, `${name}.json`);
    await ensureDir(dirname(presetPath));

    const config: QwenOverlayConfig = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      projectRoot: process.cwd(),
      settings: preset.settings,
      skills: preset.skills,
      modes: preset.modes,
      mcpServers: preset.mcpServers,
      metadata: {
        preset: name,
        description: preset.description,
      },
    };

    await writeJson(presetPath, config);
    cliLogger.info(`Preset saved to: ${presetPath}`);
    return presetPath;
  }

  /**
   * Load preset configuration
   */
  async loadPreset(name: string): Promise<QwenOverlayConfig | null> {
    const presetPath = join(this.overlaysDir, `${name}.json`);
    try {
      return await readJson<QwenOverlayConfig>(presetPath);
    } catch {
      return null;
    }
  }

  /**
   * List available presets
   */
  async listPresets(): Promise<string[]> {
    try {
      const files = await readdir(this.overlaysDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  }

  /**
   * Delete preset configuration
   */
  async deletePreset(name: string): Promise<boolean> {
    const presetPath = join(this.overlaysDir, `${name}.json`);
    try {
      await rm(presetPath, { force: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Apply configuration to Qwen Code
   */
  async applyToQwen(config: QwenOverlayConfig): Promise<ApplyResult> {
    const results: ApplyResult = {
      applied: [],
      failed: [],
      skipped: [],
    };

    // Apply settings
    if (config.settings) {
      const settingsPath = join(QWEN_DIR, 'settings.json');
      try {
        await this.generateSettingsOverlay(settingsPath, config.settings);
        results.applied.push('settings');
      } catch (error) {
        results.failed.push({ target: 'settings', error: String(error) });
      }
    }

    // Apply MCP servers
    if (config.mcpServers) {
      const mcpConfigPath = join(QWEN_DIR, 'mcp.json');
      try {
        const mcpConfig = this.convertMcpServersToQwenFormat(config.mcpServers);
        await this.generateSettingsOverlay(mcpConfigPath, { mcpServers: mcpConfig });
        results.applied.push('mcpServers');
      } catch (error) {
        results.failed.push({ target: 'mcpServers', error: String(error) });
      }
    }

    // Save QMX overlay config
    try {
      await this.generateAndSave({
        settings: config.settings,
        skills: config.skills,
        modes: config.modes,
        mcpServers: config.mcpServers,
      });
      results.applied.push('qmxOverlay');
    } catch (error) {
      results.failed.push({ target: 'qmxOverlay', error: String(error) });
    }

    return results;
  }

  // Private helper methods

  private async findPromptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true, recursive: true });
      for (const entry of entries) {
        if (entry.isFile() && /\.(md|txt|prompt)$/.test(entry.name)) {
          files.push(join(dir, entry.path || entry.name));
        }
      }
    } catch {
      // Directory might not exist
    }

    return files;
  }

  private convertMcpServersToQwenFormat(
    servers: Record<string, McpServerConfig>
  ): Record<string, McpServerConfig> {
    const result: Record<string, McpServerConfig> = {};

    for (const [name, config] of Object.entries(servers)) {
      if (!config.disabled) {
        result[name] = config;
      }
    }

    return result;
  }

  private convertToToml(config: QwenOverlayConfig): string {
    // Simple TOML conversion (in production, use a proper library)
    let toml = `# QMX Configuration\n`;
    toml += `version = "${config.version}"\n`;
    toml += `generatedAt = "${config.generatedAt}"\n`;
    toml += `projectRoot = "${config.projectRoot}"\n\n`;

    if (config.settings) {
      toml += '[settings]\n';
      for (const [key, value] of Object.entries(config.settings)) {
        toml += `${key} = ${this.tomlValue(value)}\n`;
      }
      toml += '\n';
    }

    return toml;
  }

  private convertToYaml(config: QwenOverlayConfig): string {
    // Simple YAML conversion (in production, use a proper library)
    let yaml = `# QMX Configuration\n`;
    yaml += `version: "${config.version}"\n`;
    yaml += `generatedAt: "${config.generatedAt}"\n`;
    yaml += `projectRoot: "${config.projectRoot}"\n`;

    return yaml;
  }

  private tomlValue(value: unknown): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map(v => this.tomlValue(v)).join(', ')}]`;
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return '""';
  }
}

// Type definitions
export interface GenerateOptions {
  includeSettings?: boolean;
  includeSkills?: boolean;
  includeModes?: boolean;
  includeMcpServers?: boolean;
  includePrompts?: boolean;
  settings?: Record<string, unknown>;
  skills?: Record<string, Partial<SkillConfig>>;
  modes?: Partial<ModeConfig>[];
  mcpServers?: Record<string, Partial<McpServerConfig>>;
  metadata?: Record<string, unknown>;
}

export interface PresetConfig {
  description?: string;
  settings?: Record<string, unknown>;
  skills?: Record<string, SkillConfig>;
  modes?: ModeConfig[];
  mcpServers?: Record<string, McpServerConfig>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ApplyResult {
  applied: string[];
  failed: Array<{ target: string; error: string }>;
  skipped: string[];
}

// Singleton instance
let generatorInstance: ConfigGenerator | null = null;

/**
 * Get the global config generator instance
 */
export function getGenerator(): ConfigGenerator {
  if (!generatorInstance) {
    generatorInstance = new ConfigGenerator();
  }
  return generatorInstance;
}

/**
 * Generate default configuration
 */
export async function generateDefaultConfig(): Promise<QwenOverlayConfig> {
  const generator = getGenerator();
  return generator.generate();
}

/**
 * Generate and save default configuration
 */
export async function generateAndSaveConfig(): Promise<string> {
  const generator = getGenerator();
  return generator.generateAndSave();
}

/**
 * Create a new config generator
 */
export function createGenerator(options?: {
  configPath?: string;
  overlaysDir?: string;
}): ConfigGenerator {
  return new ConfigGenerator(options);
}
