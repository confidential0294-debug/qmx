/**
 * QMX - Qwen Multi-agent eXtension
 * 
 * Main entry point for the QMX library.
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
  startTeam,
  assignTask,
  shutdownTeam,
  resumeTeam,
  monitorTeam,
  sendWorkerMessage,
  broadcastWorkerMessage,
  isTmuxAvailable,
  getTmuxVersion,
  sanitizeTeamName,
  listTeamSessions,
  resolveCanonicalTeamStateRoot,
  resolveWorkerLaunchArgsFromEnv,
  TEAM_LOW_COMPLEXITY_DEFAULT_MODEL,
} from './team/runtime.js';

// Team Operations - Types
export type {
  TeamConfig,
  WorkerConfig,
  TeamTask,
  WorkerStatus,
  WorkerHeartbeat,
  MailboxMessage,
  DispatchRequest,
  DispatchReceipt,
  TransportPreference,
} from './team/team-ops.js';

// Team Runtime - Types
export type {
  TeamRuntime,
  TeamSnapshot,
  TeamStartOptions,
} from './team/runtime.js';

// Team Operations - Functions
export {
  saveTeamConfig,
  readTeamConfig,
  writeWorkerStatus,
  readWorkerStatus,
  writeWorkerHeartbeat,
  readWorkerHeartbeat,
  createTeamTask,
  readTask,
  updateTask,
  listTasks,
  sendMailboxMessage,
  readMailbox,
  markMessageNotified,
  enqueueDispatchRequest,
  readDispatchRequest,
  transitionDispatchRequest,
  markDispatchRequestNotified,
  listDispatchRequests,
  waitForDispatchReceipt,
  teamDir,
  workerDir,
} from './team/team-ops.js';

// Worker Bootstrap
export {
  generateWorkerOverlay,
  generateInitialInbox,
  generateTaskAssignmentInbox,
  generateShutdownInbox,
  generateTriggerMessage,
  generateMailboxTriggerMessage,
  writeTeamWorkerInstructionsFile,
  removeTeamWorkerInstructionsFile,
} from './team/worker-bootstrap.js';

// tmux Session
export {
  createTeamSession,
  destroyTeamSession,
  sendToWorker,
  notifyLeaderStatus,
  listPanes,
  getCurrentTmuxContext,
  chooseLeaderPane,
} from './team/tmux-session.js';

export type {
  TeamSession,
  WorkerStartup,
  PaneInfo,
} from './team/tmux-session.js';

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
} from './hooks/dispatcher.js';

export type { Hook, HookContext, HookResult } from './hooks/dispatcher.js';
