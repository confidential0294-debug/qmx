/**
 * QMX - Qwen Multi-agent eXtension
 * 
 * Main entry point for the QMX library.
 * Exports all public APIs.
 */

// CLI Commands
export { setupCommand } from './cli/setup.js';
export { doctorCommand } from './cli/doctor.js';
export { teamCommand } from './cli/team.js';
export { hooksCommand } from './cli/hooks.js';
export { hudCommand } from './cli/hud.js';
export { statusCommand } from './cli/status.js';
export { cancelCommand } from './cli/cancel.js';
export { reasoningCommand } from './cli/reasoning.js';

// Team Orchestration
export {
  createTeam,
  startTeam,
  getTeamStatus,
  listTeams,
  shutdownTeam,
  shutdownAllTeams,
  isTmuxAvailable,
  getTmuxVersion,
  teamSessionExists,
} from './team/runtime.js';

export type { TeamConfig, TeamState, WorkerState } from './team/runtime.js';

// MCP Servers
export { server as stateServer } from './mcp/state-server.js';
export { server as memoryServer } from './mcp/memory-server.js';
export { server as codeIntelServer } from './mcp/code-intel-server.js';
export { server as traceServer } from './mcp/trace-server.js';

// Types
export type { SessionState } from './mcp/state-server.js';
export type { ProjectMemory } from './mcp/memory-server.js';
export type { Symbol, SymbolIndex } from './mcp/code-intel-server.js';
export type { Trace, Span, AuditEntry } from './mcp/trace-server.js';

// Hook Dispatcher
export {
  HookDispatcher,
  getDispatcher,
  initializeDispatcher,
  createDispatcher,
  BUILT_IN_EVENTS,
} from './hooks/dispatcher.js';

export type {
  Hook,
  HookHandler,
  HookContext,
  HookResult,
  DispatchResult,
  BeforeResult,
  HookStats,
} from './hooks/dispatcher.js';

// Config Generator
export {
  ConfigGenerator,
  getGenerator,
  generateDefaultConfig,
  generateAndSaveConfig,
  createGenerator,
} from './config/generator.js';

export type {
  QwenOverlayConfig,
  SkillConfig,
  ModeConfig,
  McpServerConfig,
  GenerateOptions,
  PresetConfig,
  ValidationResult,
  ApplyResult,
} from './config/generator.js';

// Constants
export const QMX_VERSION = '1.0.0';
export const QMX_DIR = '.qmx';

// Utilities
export { ensureDir, readJson, writeJson } from './utils/fs.js';
export { logger } from './utils/logger.js';
