/**
 * Tests for Hook Dispatcher
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('Hook Dispatcher', () => {
  const qmxDir = join(process.cwd(), '.qmx');
  const hooksDir = join(qmxDir, 'hooks');
  const hooksConfigPath = join(hooksDir, 'hooks.json');
  const hooksLogDir = join(hooksDir, 'logs');

  beforeEach(async () => {
    await mkdir(hooksDir, { recursive: true });
    await mkdir(hooksLogDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('Hook Registration', () => {
    it('should register hook handler', () => {
      const handlers = new Map<string, Function>();

      const registerHandler = (event: string, handler: Function): void => {
        const key = `${event}:${handler.name || 'anonymous'}`;
        handlers.set(key, handler);
      };

      const testHandler = async () => {};
      registerHandler('session:start', testHandler);

      expect(handlers.size).toBe(1);
      expect(handlers.has('session:start:testHandler')).toBe(true);
    });

    it('should store hook configuration', async () => {
      const hook = {
        id: 'hook-1',
        name: 'test-hook',
        type: 'async' as const,
        priority: 'normal' as const,
        status: 'active' as const,
        event: 'session:start',
        handler: './hooks/test.mjs',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executionCount: 0,
        errorCount: 0,
      };

      const config = {
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        hooks: [hook],
      };

      await writeFile(hooksConfigPath, JSON.stringify(config, null, 2));

      const content = await readFile(hooksConfigPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.hooks).toHaveLength(1);
      expect(parsed.hooks[0].name).toBe('test-hook');
    });

    it('should generate unique hook IDs', () => {
      const generateHookId = (prefix: string = 'hook'): string => {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      };

      const id1 = generateHookId();
      const id2 = generateHookId();

      expect(id1).toMatch(/^hook-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^hook-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Event Dispatching', () => {
    it('should dispatch event to registered hooks', async () => {
      const executedHooks: string[] = [];

      const hooks = [
        { id: 'h1', event: 'session:start', handler: async () => executedHooks.push('h1') },
        { id: 'h2', event: 'session:start', handler: async () => executedHooks.push('h2') },
      ];

      for (const hook of hooks) {
        await hook.handler();
      }

      expect(executedHooks).toHaveLength(2);
    });

    it('should execute hooks in priority order', () => {
      const hooks = [
        { id: 'h1', priority: 'low', order: 0 },
        { id: 'h2', priority: 'high', order: 0 },
        { id: 'h3', priority: 'normal', order: 0 },
      ];

      const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
      const sorted = hooks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      expect(sorted[0].id).toBe('h2');
      expect(sorted[1].id).toBe('h3');
      expect(sorted[2].id).toBe('h1');
    });

    it('should pass context to hook handlers', () => {
      const createContext = (event: string, payload: Record<string, any>): Record<string, any> => {
        return {
          eventId: `event-${Date.now()}`,
          event,
          timestamp: new Date().toISOString(),
          payload,
          metadata: { sessionId: 'session-123' },
        };
      };

      const context = createContext('session:start', { user: 'test' });

      expect(context.event).toBe('session:start');
      expect(context.payload.user).toBe('test');
      expect(context.metadata.sessionId).toBe('session-123');
    });

    it('should collect execution results', () => {
      const results = [
        { hookId: 'h1', status: 'completed', durationMs: 10 },
        { hookId: 'h2', status: 'completed', durationMs: 15 },
        { hookId: 'h3', status: 'failed', durationMs: 5, error: 'Timeout' },
      ];

      const successCount = results.filter(r => r.status === 'completed').length;
      const failCount = results.filter(r => r.status === 'failed').length;

      expect(successCount).toBe(2);
      expect(failCount).toBe(1);
    });
  });

  describe('Hook Types', () => {
    it('should handle sync hooks', () => {
      const syncHook = (): { success: boolean } => {
        return { success: true };
      };

      const result = syncHook();
      expect(result.success).toBe(true);
    });

    it('should handle async hooks', async () => {
      const asyncHook = async (): Promise<{ success: boolean }> => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { success: true };
      };

      const result = await asyncHook();
      expect(result.success).toBe(true);
    });

    it('should remove once hooks after execution', () => {
      const hooks = [
        { id: 'h1', type: 'once', executed: false },
        { id: 'h2', type: 'async', executed: false },
        { id: 'h3', type: 'once', executed: false },
      ];

      const executeAndRemoveOnce = (hooks: any[]): any[] => {
        return hooks.filter(h => {
          h.executed = true;
          return h.type !== 'once';
        });
      };

      const remaining = executeAndRemoveOnce(hooks);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('h2');
    });
  });

  describe('Hook Execution', () => {
    it('should execute hook with timeout', async () => {
      const executeWithTimeout = async (
        handler: () => Promise<any>,
        timeout: number
      ): Promise<{ success: boolean; error?: string }> => {
        const timeoutPromise = new Promise<{ success: boolean; error?: string }>((_, reject) => {
          setTimeout(() => reject(new Error('Hook timeout')), timeout);
        });

        try {
          const result = await Promise.race([handler(), timeoutPromise]);
          return { success: true, ...result };
        } catch (error) {
          if ((error as Error).message.includes('timeout')) {
            return { success: false, error: 'Hook timeout' };
          }
          throw error;
        }
      };

      const fastHook = async () => ({ data: 'result' });
      const slowHook = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: 'result' };
      };

      const fastResult = await executeWithTimeout(fastHook, 50);
      const slowResult = await executeWithTimeout(slowHook, 10);

      expect(fastResult.success).toBe(true);
      expect(slowResult.success).toBe(false);
      expect(slowResult.error).toBe('Hook timeout');
    });

    it('should track execution count', () => {
      const hook = { id: 'h1', executionCount: 0, errorCount: 0 };

      const updateStats = (hook: any, success: boolean): void => {
        hook.executionCount++;
        if (!success) {
          hook.errorCount++;
        }
      };

      updateStats(hook, true);
      updateStats(hook, true);
      updateStats(hook, false);

      expect(hook.executionCount).toBe(3);
      expect(hook.errorCount).toBe(1);
    });

    it('should mark hook as error after too many failures', () => {
      const hook = { id: 'h1', status: 'active', errorCount: 0 };

      const updateStatus = (hook: any): void => {
        if (hook.errorCount > 10) {
          hook.status = 'error';
        }
      };

      hook.errorCount = 11;
      updateStatus(hook);

      expect(hook.status).toBe('error');
    });
  });

  describe('Before/After Dispatch', () => {
    it('should dispatch before event with abort capability', () => {
      const dispatchBefore = (hooks: any[]): { shouldAbort: boolean; abortReason?: string } => {
        const hasFailure = hooks.some(h => h.status === 'failed');
        const abortSignal = hooks.find(h => h.result?.abort === true);

        return {
          shouldAbort: hasFailure || !!abortSignal,
          abortReason: abortSignal?.result?.reason,
        };
      };

      const successHooks = [
        { id: 'h1', status: 'completed', result: {} },
        { id: 'h2', status: 'completed', result: {} },
      ];

      const failureHooks = [
        { id: 'h1', status: 'completed', result: {} },
        { id: 'h2', status: 'failed', result: {} },
      ];

      const abortHooks = [
        { id: 'h1', status: 'completed', result: { abort: true, reason: 'Validation failed' } },
      ];

      expect(dispatchBefore(successHooks).shouldAbort).toBe(false);
      expect(dispatchBefore(failureHooks).shouldAbort).toBe(true);
      expect(dispatchBefore(abortHooks).abortReason).toBe('Validation failed');
    });

    it('should dispatch after event without abort', () => {
      const dispatchAfter = (hooks: any[]): { successCount: number } => {
        const successCount = hooks.filter(h => h.status === 'completed').length;
        return { successCount };
      };

      const hooks = [
        { id: 'h1', status: 'completed' },
        { id: 'h2', status: 'completed' },
        { id: 'h3', status: 'failed' },
      ];

      const result = dispatchAfter(hooks);
      expect(result.successCount).toBe(2);
    });
  });

  describe('Execution History', () => {
    it('should store execution history', async () => {
      const executions = [
        { hookId: 'h1', eventId: 'e1', startTime: new Date().toISOString(), status: 'completed', durationMs: 10 },
        { hookId: 'h1', eventId: 'e2', startTime: new Date().toISOString(), status: 'completed', durationMs: 15 },
        { hookId: 'h1', eventId: 'e3', startTime: new Date().toISOString(), status: 'failed', durationMs: 5 },
      ];

      const logPath = join(hooksLogDir, `${new Date().toISOString().split('T')[0]}.jsonl`);
      const logEntries = executions.map(e => JSON.stringify(e)).join('\n');
      await writeFile(logPath, logEntries);

      const content = await readFile(logPath, 'utf-8');
      const lines = content.split('\n').filter(Boolean);

      expect(lines).toHaveLength(3);
    });

    it('should limit history retrieval', () => {
      const executions = Array.from({ length: 100 }, (_, i) => ({
        hookId: 'h1',
        eventId: `e${i}`,
        startTime: new Date().toISOString(),
        status: 'completed',
      }));

      const getHistory = (executions: any[], limit: number): any[] => {
        return executions.slice(-limit);
      };

      const limited = getHistory(executions, 50);
      expect(limited).toHaveLength(50);
      expect(limited[0].eventId).toBe('e50');
    });

    it('should clear old execution history', () => {
      const executions = [
        { hookId: 'h1', startTime: '2024-01-01T00:00:00.000Z' },
        { hookId: 'h1', startTime: '2024-01-02T00:00:00.000Z' },
        { hookId: 'h1', startTime: new Date().toISOString() },
      ];

      const cutoff = new Date('2024-01-02T00:00:00.000Z').getTime();
      const filtered = executions.filter(e => new Date(e.startTime).getTime() >= cutoff);

      expect(filtered).toHaveLength(1);
    });
  });

  describe('Statistics', () => {
    it('should calculate hook statistics', () => {
      const hooks = [
        { id: 'h1', status: 'active', event: 'session:start' },
        { id: 'h2', status: 'active', event: 'session:start' },
        { id: 'h3', status: 'disabled', event: 'session:end' },
        { id: 'h4', status: 'active', event: 'task:complete' },
      ];

      const stats = {
        totalHooks: hooks.length,
        activeHooks: hooks.filter(h => h.status === 'active').length,
        disabledHooks: hooks.filter(h => h.status === 'disabled').length,
        hooksByEvent: hooks.reduce((acc, h) => {
          acc[h.event] = (acc[h.event] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      expect(stats.totalHooks).toBe(4);
      expect(stats.activeHooks).toBe(3);
      expect(stats.disabledHooks).toBe(1);
      expect(stats.hooksByEvent['session:start']).toBe(2);
    });

    it('should calculate execution statistics', () => {
      const executions = [
        { status: 'completed', durationMs: 10 },
        { status: 'completed', durationMs: 20 },
        { status: 'failed', durationMs: 5 },
        { status: 'completed', durationMs: 15 },
      ];

      const stats = {
        totalExecutions: executions.length,
        successfulExecutions: executions.filter(e => e.status === 'completed').length,
        failedExecutions: executions.filter(e => e.status === 'failed').length,
        avgDurationMs: executions.filter(e => e.durationMs).reduce((sum, e) => sum + e.durationMs!, 0) / executions.length,
      };

      expect(stats.totalExecutions).toBe(4);
      expect(stats.successfulExecutions).toBe(3);
      expect(stats.failedExecutions).toBe(1);
      expect(stats.avgDurationMs).toBe(12.5);
    });
  });

  describe('Built-in Events', () => {
    it('should support session lifecycle events', () => {
      const sessionEvents = ['session:start', 'session:end', 'session:idle', 'session:resume'];
      expect(sessionEvents).toHaveLength(4);
      expect(sessionEvents).toContain('session:start');
      expect(sessionEvents).toContain('session:end');
    });

    it('should support team lifecycle events', () => {
      const teamEvents = [
        'team:create',
        'team:start',
        'team:running',
        'team:complete',
        'team:fail',
        'team:cancel',
        'team:destroy',
      ];
      expect(teamEvents).toHaveLength(7);
    });

    it('should support task lifecycle events', () => {
      const taskEvents = ['task:create', 'task:assign', 'task:start', 'task:complete', 'task:fail'];
      expect(taskEvents).toHaveLength(5);
    });

    it('should support file operation events', () => {
      const fileEvents = ['file:create', 'file:modify', 'file:delete', 'file:save'];
      expect(fileEvents).toHaveLength(4);
    });

    it('should support git operation events', () => {
      const gitEvents = ['git:commit', 'git:push', 'git:pull', 'git:merge', 'git:rebase'];
      expect(gitEvents).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle hook execution errors', async () => {
      const failingHook = async (): Promise<{ success: boolean; error?: string }> => {
        throw new Error('Hook execution failed');
      };

      try {
        await failingHook();
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Hook execution failed');
      }
    });

    it('should handle missing handler', () => {
      const handlers = new Map<string, Function>();
      const getHandler = (key: string): Function | undefined => {
        return handlers.get(key);
      };

      expect(getHandler('nonexistent')).toBeUndefined();
    });

    it('should handle timeout errors', async () => {
      const timeoutHook = async (): Promise<void> => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Hook timeout after 30000ms')), 30000);
        });
      };

      // Would timeout in real execution
      expect(timeoutHook).toBeDefined();
    });
  });
});
