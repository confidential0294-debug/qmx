/**
 * QMX Hook Dispatcher
 *
 * Event dispatching system for QMX lifecycle events.
 * Supports synchronous and asynchronous hooks with priority ordering.
 */

import { join, dirname } from 'node:path';
import { EventEmitter } from 'node:events';
import { z } from 'zod';
import { hookLogger } from '../utils/logger.js';
import { ensureDir, readJson, writeJson, fileExists } from '../utils/fs.js';

// Schema definitions
const HookPriority = z.enum(['high', 'normal', 'low']);
const HookType = z.enum(['sync', 'async', 'once']);
const HookStatus = z.enum(['active', 'disabled', 'error']);

const HookSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: HookType,
  priority: HookPriority,
  status: HookStatus,
  event: z.string(),
  handler: z.string(),
  description: z.string().optional(),
  timeout: z.number().optional(),
  retryCount: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastTriggered: z.string().optional(),
  executionCount: z.number().default(0),
  errorCount: z.number().default(0),
});

const HookExecutionSchema = z.object({
  hookId: z.string(),
  eventId: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  durationMs: z.number().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'timeout']),
  result: z.unknown().optional(),
  error: z.object({
    message: z.string(),
    stack: z.string().optional(),
  }).optional(),
});

type HookExecution = z.infer<typeof HookExecutionSchema>;

export type Hook = z.infer<typeof HookSchema>;
export type { HookExecution };

// Hook configuration paths
const QMX_DIR = join(process.cwd(), '.qmx');
const HOOKS_DIR = join(QMX_DIR, 'hooks');
const HOOKS_CONFIG_PATH = join(HOOKS_DIR, 'hooks.json');
const HOOKS_LOG_DIR = join(HOOKS_DIR, 'logs');

// Built-in events
export const BUILT_IN_EVENTS = [
  // Session lifecycle
  'session:start',
  'session:end',
  'session:idle',
  'session:resume',

  // Team lifecycle
  'team:create',
  'team:start',
  'team:running',
  'team:complete',
  'team:fail',
  'team:cancel',
  'team:destroy',

  // Task lifecycle
  'task:create',
  'task:assign',
  'task:start',
  'task:complete',
  'task:fail',

  // File operations
  'file:create',
  'file:modify',
  'file:delete',
  'file:save',

  // Git operations
  'git:commit',
  'git:push',
  'git:pull',
  'git:merge',
  'git:rebase',

  // Skill execution
  'skill:before',
  'skill:after',
  'skill:error',

  // MCP operations
  'mcp:connect',
  'mcp:disconnect',
  'mcp:request',
  'mcp:response',

  // Error handling
  'error:uncaught',
  'error:unhandled',
  'error:recovery',
] as const;

export type BuiltInEvent = (typeof BUILT_IN_EVENTS)[number];

// Hook handler function type
export type HookHandler = (context: HookContext) => Promise<HookResult> | HookResult;

export interface HookContext {
  eventId: string;
  event: string;
  timestamp: string;
  payload: Record<string, unknown>;
  metadata: {
    sessionId?: string;
    teamName?: string;
    taskId?: string;
    userId?: string;
    [key: string]: unknown;
  };
}

export interface HookResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Hook Dispatcher class
export class HookDispatcher extends EventEmitter {
  private hooks: Map<string, Hook> = new Map();
  private executions: Map<string, HookExecution[]> = new Map();
  private handlers: Map<string, HookHandler> = new Map();
  private configPath: string;
  private logDir: string;
  private initialized: boolean = false;

  constructor(options?: { configPath?: string; logDir?: string }) {
    super();
    this.configPath = options?.configPath || HOOKS_CONFIG_PATH;
    this.logDir = options?.logDir || HOOKS_LOG_DIR;
  }

  /**
   * Initialize the hook dispatcher
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await ensureDir(dirname(this.configPath));
    await ensureDir(this.logDir);

    // Load existing hooks
    await this.loadHooks();

    this.initialized = true;
    hookLogger.info('Hook dispatcher initialized');
  }

  /**
   * Register a hook handler programmatically
   */
  registerHandler(event: string, handler: HookHandler): void {
    const key = `${event}:${handler.name || 'anonymous'}`;
    this.handlers.set(key, handler);
    hookLogger.debug(`Registered handler for event: ${event}`);
  }

  /**
   * Add a new hook
   */
  async addHook(hook: Omit<Hook, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'errorCount'>): Promise<Hook> {
    const now = new Date().toISOString();
    const newHook: Hook = {
      ...hook,
      id: this.generateId('hook'),
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
      errorCount: 0,
    };

    this.hooks.set(newHook.id, newHook);
    await this.saveHooks();

    hookLogger.info(`Hook added: ${newHook.name} for event: ${hook.event}`);
    return newHook;
  }

  /**
   * Remove a hook
   */
  async removeHook(hookId: string): Promise<boolean> {
    const removed = this.hooks.delete(hookId);
    if (removed) {
      await this.saveHooks();
      hookLogger.info(`Hook removed: ${hookId}`);
    }
    return removed;
  }

  /**
   * Update a hook
   */
  async updateHook(hookId: string, updates: Partial<Hook>): Promise<Hook | null> {
    const hook = this.hooks.get(hookId);
    if (!hook) {
      return null;
    }

    const updated: Hook = {
      ...hook,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.hooks.set(hookId, updated);
    await this.saveHooks();

    hookLogger.info(`Hook updated: ${hookId}`);
    return updated;
  }

  /**
   * Get a hook by ID
   */
  getHook(hookId: string): Hook | undefined {
    return this.hooks.get(hookId);
  }

  /**
   * Get all hooks for an event
   */
  getHooksForEvent(event: string): Hook[] {
    const hooks = Array.from(this.hooks.values())
      .filter(h => h.event === event && h.status === 'active')
      .sort((a, b) => this.comparePriority(a.priority, b.priority));

    return hooks;
  }

  /**
   * Get all hooks
   */
  getAllHooks(): Hook[] {
    return Array.from(this.hooks.values());
  }

  /**
   * Enable a hook
   */
  async enableHook(hookId: string): Promise<boolean> {
    return this.updateHookStatus(hookId, 'active');
  }

  /**
   * Disable a hook
   */
  async disableHook(hookId: string): Promise<boolean> {
    return this.updateHookStatus(hookId, 'disabled');
  }

  /**
   * Dispatch an event to all registered hooks
   */
  async dispatch(event: string, payload: Record<string, unknown> = {}, metadata: HookContext['metadata'] = {}): Promise<DispatchResult> {
    const eventId = this.generateId('event');
    const timestamp = new Date().toISOString();

    const context: HookContext = {
      eventId,
      event,
      timestamp,
      payload,
      metadata,
    };

    hookLogger.debug(`Dispatching event: ${event} (ID: ${eventId})`);

    const hooks = this.getHooksForEvent(event);
    const results: HookExecution[] = [];

    // Execute hooks in priority order
    for (const hook of hooks) {
      const execution = await this.executeHook(hook, context);
      results.push(execution);

      // Handle once hooks
      if (hook.type === 'once' && execution.status === 'completed') {
        await this.removeHook(hook.id);
      }
    }

    // Emit to programmatic handlers
    const handlerResults = await this.executeHandlers(event, context);
    results.push(...handlerResults);

    // Emit event for listeners
    this.emit(event, context);
    this.emit('*', { event, context });

    const successCount = results.filter(r => r.status === 'completed').length;
    const failCount = results.filter(r => r.status === 'failed' || r.status === 'timeout').length;

    const result: DispatchResult = {
      eventId,
      event,
      timestamp,
      totalHooks: results.length,
      successCount,
      failCount,
      executions: results,
    };

    // Log execution
    await this.logExecution(result);

    hookLogger.info(`Event ${event} dispatched: ${successCount}/${results.length} successful`);

    return result;
  }

  /**
   * Dispatch event before an operation (with abort capability)
   */
  async dispatchBefore(event: string, payload: Record<string, unknown> = {}): Promise<BeforeResult> {
    const result = await this.dispatch(event, payload);

    const hasFailure = result.executions.some(e => e.status === 'failed' || e.status === 'timeout');
    const abortSignal = result.executions.find(e => e.result && (e.result as any)?.abort === true);

    return {
      ...result,
      shouldAbort: hasFailure || !!abortSignal,
      abortReason: abortSignal ? (abortSignal.result as any)?.reason : undefined,
    };
  }

  /**
   * Dispatch event after an operation
   */
  async dispatchAfter(event: string, payload: Record<string, unknown> = {}): Promise<DispatchResult> {
    return this.dispatch(event, payload);
  }

  /**
   * Get execution history for a hook
   */
  getExecutionHistory(hookId: string, limit: number = 50): HookExecution[] {
    const executions = this.executions.get(hookId) || [];
    return executions.slice(-limit);
  }

  /**
   * Get execution history for an event
   */
  getEventHistory(event: string, limit: number = 50): DispatchResult[] {
    const history: DispatchResult[] = [];

    for (const [hookId, executions] of this.executions.entries()) {
      const hook = this.hooks.get(hookId);
      if (hook?.event === event) {
        for (const execution of executions.slice(-limit)) {
          if (execution.endTime) {
            history.push({
              eventId: execution.eventId,
              event,
              timestamp: execution.startTime,
              totalHooks: 1,
              successCount: execution.status === 'completed' ? 1 : 0,
              failCount: execution.status === 'failed' || execution.status === 'timeout' ? 1 : 0,
              executions: [execution],
            });
          }
        }
      }
    }

    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  /**
   * Clear execution history
   */
  async clearHistory(olderThan?: string): Promise<number> {
    let cleared = 0;

    if (olderThan) {
      const cutoff = new Date(olderThan).getTime();

      for (const [hookId, executions] of this.executions.entries()) {
        const filtered = executions.filter(e => {
          if (!e.startTime) return true;
          return new Date(e.startTime).getTime() >= cutoff;
        });

        cleared += executions.length - filtered.length;
        this.executions.set(hookId, filtered);
      }
    } else {
      cleared = Array.from(this.executions.values()).reduce((sum, arr) => sum + arr.length, 0);
      this.executions.clear();
    }

    hookLogger.info(`Cleared ${cleared} execution records`);
    return cleared;
  }

  /**
   * Get statistics
   */
  getStats(): HookStats {
    const hooks = Array.from(this.hooks.values());
    const allExecutions = Array.from(this.executions.values()).flat();

    return {
      totalHooks: hooks.length,
      activeHooks: hooks.filter(h => h.status === 'active').length,
      disabledHooks: hooks.filter(h => h.status === 'disabled').length,
      hooksByEvent: hooks.reduce((acc, h) => {
        acc[h.event] = (acc[h.event] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalExecutions: allExecutions.length,
      successfulExecutions: allExecutions.filter(e => e.status === 'completed').length,
      failedExecutions: allExecutions.filter(e => e.status === 'failed' || e.status === 'timeout').length,
      avgDurationMs: allExecutions.filter(e => e.durationMs).reduce((sum, e) => sum + (e.durationMs || 0), 0) / (allExecutions.filter(e => e.durationMs).length || 1),
    };
  }

  /**
   * Load hooks from config file
   */
  private async loadHooks(): Promise<void> {
    try {
      if (await fileExists(this.configPath)) {
        const config = await readJson<HookConfig>(this.configPath);
        for (const hook of config.hooks || []) {
          this.hooks.set(hook.id, hook);
        }
        hookLogger.info(`Loaded ${config.hooks?.length || 0} hooks from config`);
      }
    } catch (error) {
      hookLogger.warn('Failed to load hooks config:', error);
    }
  }

  /**
   * Save hooks to config file
   */
  private async saveHooks(): Promise<void> {
    const config: HookConfig = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      hooks: Array.from(this.hooks.values()),
    };

    await writeJson(this.configPath, config);
  }

  /**
   * Execute a single hook
   */
  private async executeHook(hook: Hook, context: HookContext): Promise<HookExecution> {
    const execution: HookExecution = {
      hookId: hook.id,
      eventId: context.eventId,
      startTime: new Date().toISOString(),
      status: 'running',
    };

    try {
      const timeout = hook.timeout || 30000;
      const result = await this.executeWithTimeout(hook, context, timeout);

      execution.endTime = new Date().toISOString();
      execution.durationMs = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
      execution.status = result.success ? 'completed' : 'failed';
      execution.result = result.data;

      if (!result.success) {
        execution.error = { message: result.error || 'Unknown error' };
      }

      // Update hook stats
      await this.updateHookStats(hook.id, result.success);
    } catch (error) {
      execution.endTime = new Date().toISOString();
      execution.durationMs = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
      execution.status = 'failed';
      execution.error = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };

      await this.updateHookStats(hook.id, false);
    }

    // Store execution
    const executions = this.executions.get(hook.id) || [];
    executions.push(execution);
    this.executions.set(hook.id, executions);

    return execution;
  }

  /**
   * Execute hook with timeout
   */
  private async executeWithTimeout(hook: Hook, context: HookContext, timeout: number): Promise<HookResult> {
    const timeoutPromise = new Promise<HookResult>((_, reject) => {
      setTimeout(() => reject(new Error(`Hook timeout after ${timeout}ms`)), timeout);
    });

    const executionPromise = this.executeHandler(hook, context);

    try {
      return await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      if ((error as Error).message.includes('timeout')) {
        return { success: false, error: (error as Error).message };
      }
      throw error;
    }
  }

  /**
   * Execute hook handler
   */
  private async executeHandler(hook: Hook, context: HookContext): Promise<HookResult> {
    // Check if there's a programmatic handler
    const handlerKey = `${hook.event}:${hook.handler}`;
    const handler = this.handlers.get(handlerKey);

    if (handler) {
      return await handler(context);
    }

    // For file-based handlers, load and execute
    try {
      const handlerPath = join(process.cwd(), hook.handler);
      const module = await import(handlerPath);
      const execute = module.default || module.execute;

      if (typeof execute !== 'function') {
        return { success: false, error: 'Handler does not export a function' };
      }

      return await execute(context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute programmatic handlers
   */
  private async executeHandlers(event: string, context: HookContext): Promise<HookExecution[]> {
    const results: HookExecution[] = [];

    for (const [key, handler] of this.handlers.entries()) {
      if (key.startsWith(`${event}:`)) {
        const execution: HookExecution = {
          hookId: key,
          eventId: context.eventId,
          startTime: new Date().toISOString(),
          status: 'running',
        };

        try {
          const result = await handler(context);

          execution.endTime = new Date().toISOString();
          execution.durationMs = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
          execution.status = result.success ? 'completed' : 'failed';
          execution.result = result.data;

          if (!result.success) {
            execution.error = { message: result.error || 'Unknown error' };
          }
        } catch (error) {
          execution.endTime = new Date().toISOString();
          execution.durationMs = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
          execution.status = 'failed';
          execution.error = {
            message: error instanceof Error ? error.message : String(error),
          };
        }

        results.push(execution);
      }
    }

    return results;
  }

  /**
   * Update hook statistics
   */
  private async updateHookStats(hookId: string, success: boolean): Promise<void> {
    const hook = this.hooks.get(hookId);
    if (!hook) return;

    hook.executionCount++;
    if (!success) {
      hook.errorCount++;
    }
    hook.lastTriggered = new Date().toISOString();
    hook.updatedAt = new Date().toISOString();

    // Mark as error if too many failures
    if (hook.errorCount > 10) {
      hook.status = 'error';
    }

    this.hooks.set(hookId, hook);
    await this.saveHooks();
  }

  /**
   * Update hook status
   */
  private async updateHookStatus(hookId: string, status: Hook['status']): Promise<boolean> {
    const hook = this.hooks.get(hookId);
    if (!hook) return false;

    hook.status = status;
    hook.updatedAt = new Date().toISOString();

    this.hooks.set(hookId, hook);
    await this.saveHooks();

    hookLogger.info(`Hook ${hookId} status updated to: ${status}`);
    return true;
  }

  /**
   * Log execution to file
   */
  private async logExecution(result: DispatchResult): Promise<void> {
    const date = result.timestamp.split('T')[0];
    const logPath = join(this.logDir, `${date}.jsonl`);

    const logEntry = JSON.stringify({
      timestamp: result.timestamp,
      eventId: result.eventId,
      event: result.event,
      totalHooks: result.totalHooks,
      successCount: result.successCount,
      failCount: result.failCount,
    });

    try {
      const { appendFile } = await import('node:fs/promises');
      await appendFile(logPath, logEntry + '\n');
    } catch (error) {
      hookLogger.warn('Failed to write execution log:', error);
    }
  }

  /**
   * Compare hook priorities
   */
  private comparePriority(a: Hook['priority'], b: Hook['priority']): number {
    const order: Record<Hook['priority'], number> = {
      high: 0,
      normal: 1,
      low: 2,
    };
    return order[a] - order[b];
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

// Type definitions
interface HookConfig {
  version: string;
  updatedAt: string;
  hooks: Hook[];
}

export interface DispatchResult {
  eventId: string;
  event: string;
  timestamp: string;
  totalHooks: number;
  successCount: number;
  failCount: number;
  executions: HookExecution[];
}

export interface BeforeResult extends DispatchResult {
  shouldAbort: boolean;
  abortReason?: string;
}

export interface HookStats {
  totalHooks: number;
  activeHooks: number;
  disabledHooks: number;
  hooksByEvent: Record<string, number>;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDurationMs: number;
}

// Singleton instance
let dispatcherInstance: HookDispatcher | null = null;

/**
 * Get the global hook dispatcher instance
 */
export function getDispatcher(): HookDispatcher {
  if (!dispatcherInstance) {
    dispatcherInstance = new HookDispatcher();
  }
  return dispatcherInstance;
}

/**
 * Initialize the global hook dispatcher
 */
export async function initializeDispatcher(): Promise<HookDispatcher> {
  const dispatcher = getDispatcher();
  await dispatcher.initialize();
  return dispatcher;
}

/**
 * Create a new hook dispatcher instance
 */
export function createDispatcher(options?: { configPath?: string; logDir?: string }): HookDispatcher {
  return new HookDispatcher(options);
}
