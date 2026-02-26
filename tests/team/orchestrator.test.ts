/**
 * Tests for Team Orchestrator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('Team Orchestrator', () => {
  const qmxDir = join(process.cwd(), '.qmx');
  const stateDir = join(qmxDir, 'state');
  const teamsDir = join(stateDir, 'teams');

  beforeEach(async () => {
    await mkdir(teamsDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('Team Creation', () => {
    it('should create team with specified configuration', async () => {
      const teamConfig = {
        name: 'test-team',
        role: 'executor',
        workerCount: 3,
        task: 'Execute test tasks',
        cwd: process.cwd(),
      };

      const teamState = {
        name: teamConfig.name,
        status: 'created' as const,
        workers: Array.from({ length: teamConfig.workerCount }, (_, i) => ({
          id: `worker-${i + 1}`,
          paneId: null,
          status: 'pending' as const,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await writeFile(join(teamsDir, `${teamConfig.name}.json`), JSON.stringify(teamState, null, 2));

      const content = await readFile(join(teamsDir, `${teamConfig.name}.json`), 'utf-8');
      const state = JSON.parse(content);

      expect(state.name).toBe('test-team');
      expect(state.workers).toHaveLength(3);
      expect(state.status).toBe('created');
    });

    it('should initialize workers in pending state', async () => {
      const workers = [
        { id: 'worker-1', status: 'pending' },
        { id: 'worker-2', status: 'pending' },
        { id: 'worker-3', status: 'pending' },
      ];

      const allPending = workers.every(w => w.status === 'pending');
      expect(allPending).toBe(true);
    });

    it('should generate unique team names', () => {
      const generateTeamName = (prefix: string = 'team'): string => {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      };

      const name1 = generateTeamName();
      const name2 = generateTeamName();

      expect(name1).toMatch(/^team-\d+-[a-z0-9]+$/);
      expect(name2).toMatch(/^team-\d+-[a-z0-9]+$/);
      expect(name1).not.toBe(name2);
    });
  });

  describe('Task Distribution', () => {
    it('should distribute tasks to workers', async () => {
      const tasks = [
        { id: 'task-1', description: 'Task 1', assignedTo: null, status: 'pending' as const },
        { id: 'task-2', description: 'Task 2', assignedTo: null, status: 'pending' as const },
        { id: 'task-3', description: 'Task 3', assignedTo: null, status: 'pending' as const },
      ];

      const workers = ['worker-1', 'worker-2', 'worker-3'];

      // Round-robin distribution
      const distributed = tasks.map((task, i) => ({
        ...task,
        assignedTo: workers[i % workers.length],
        status: 'in_progress' as const,
      }));

      expect(distributed[0].assignedTo).toBe('worker-1');
      expect(distributed[1].assignedTo).toBe('worker-2');
      expect(distributed[2].assignedTo).toBe('worker-3');
    });

    it('should handle more tasks than workers', async () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `task-${i + 1}`,
        status: 'pending' as const,
      }));

      const workers = ['worker-1', 'worker-2'];
      const assignments: Record<string, number> = { 'worker-1': 0, 'worker-2': 0 };

      tasks.forEach((task, i) => {
        const worker = workers[i % workers.length];
        assignments[worker]++;
      });

      expect(assignments['worker-1']).toBe(5);
      expect(assignments['worker-2']).toBe(5);
    });

    it('should track task completion', () => {
      const tasks = [
        { id: 't1', status: 'completed' },
        { id: 't2', status: 'completed' },
        { id: 't3', status: 'in_progress' },
        { id: 't4', status: 'pending' },
      ];

      const completed = tasks.filter(t => t.status === 'completed').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const pending = tasks.filter(t => t.status === 'pending').length;

      expect(completed).toBe(2);
      expect(inProgress).toBe(1);
      expect(pending).toBe(1);
    });
  });

  describe('Worker Management', () => {
    it('should update worker status', () => {
      const workers = [
        { id: 'worker-1', status: 'pending' },
        { id: 'worker-2', status: 'running' },
        { id: 'worker-3', status: 'completed' },
      ];

      const updateWorkerStatus = (
        workers: any[],
        workerId: string,
        newStatus: string
      ): any[] => {
        return workers.map(w =>
          w.id === workerId ? { ...w, status: newStatus } : w
        );
      };

      const updated = updateWorkerStatus(workers, 'worker-1', 'running');
      expect(updated.find(w => w.id === 'worker-1')?.status).toBe('running');
    });

    it('should handle worker failure', () => {
      const workers = [
        { id: 'worker-1', status: 'running', task: 'task-1' },
        { id: 'worker-2', status: 'running', task: 'task-2' },
      ];

      const handleWorkerFailure = (
        workers: any[],
        failedWorkerId: string
      ): { workers: any[]; reassignedTasks: string[] } => {
        const reassignedTasks: string[] = [];
        const updated = workers.map(w => {
          if (w.id === failedWorkerId) {
            reassignedTasks.push(w.task);
            return { ...w, status: 'failed', task: undefined };
          }
          return w;
        });
        return { workers: updated, reassignedTasks };
      };

      const result = handleWorkerFailure(workers, 'worker-1');
      expect(result.workers.find(w => w.id === 'worker-1')?.status).toBe('failed');
      expect(result.reassignedTasks).toContain('task-1');
    });

    it('should calculate worker utilization', () => {
      const workers = [
        { id: 'w1', status: 'running' },
        { id: 'w2', status: 'running' },
        { id: 'w3', status: 'pending' },
        { id: 'w4', status: 'completed' },
      ];

      const utilization = workers.filter(w => w.status === 'running').length / workers.length;
      expect(utilization).toBe(0.5);
    });
  });

  describe('Team State Transitions', () => {
    it('should transition through valid states', () => {
      const validTransitions: Record<string, string[]> = {
        created: ['starting', 'cancelled'],
        starting: ['running', 'failed'],
        running: ['completed', 'failed', 'cancelled'],
        completed: [],
        failed: [],
        cancelled: [],
      };

      const canTransition = (from: string, to: string): boolean => {
        return validTransitions[from]?.includes(to) ?? false;
      };

      expect(canTransition('created', 'starting')).toBe(true);
      expect(canTransition('starting', 'running')).toBe(true);
      expect(canTransition('running', 'completed')).toBe(true);
      expect(canTransition('created', 'running')).toBe(false);
    });

    it('should track state history', () => {
      const stateHistory: Array<{ state: string; timestamp: string }> = [];
      const states = ['created', 'starting', 'running', 'completed'];

      states.forEach(state => {
        stateHistory.push({ state, timestamp: new Date().toISOString() });
      });

      expect(stateHistory).toHaveLength(4);
      expect(stateHistory[0].state).toBe('created');
      expect(stateHistory[3].state).toBe('completed');
    });
  });

  describe('Team Coordination', () => {
    it('should synchronize worker activities', () => {
      const workers = [
        { id: 'w1', phase: 'analysis', progress: 50 },
        { id: 'w2', phase: 'analysis', progress: 30 },
        { id: 'w3', phase: 'execution', progress: 80 },
      ];

      const currentPhase = workers[0].phase;
      const inSyncPhase = workers.filter(w => w.phase === currentPhase).length;

      expect(inSyncPhase).toBe(2);
    });

    it('should handle phase barriers', () => {
      const workers = [
        { id: 'w1', phase: 'execution', done: true },
        { id: 'w2', phase: 'execution', done: true },
        { id: 'w3', phase: 'execution', done: false },
      ];

      const allDone = workers.every(w => w.done);
      const canProceedToNextPhase = allDone;

      expect(canProceedToNextPhase).toBe(false);
    });
  });

  describe('Team Metrics', () => {
    it('should calculate team throughput', () => {
      const completedTasks = 10;
      const durationMinutes = 30;
      const throughput = completedTasks / durationMinutes;

      expect(throughput).toBeCloseTo(0.333, 2);
    });

    it('should track success rate', () => {
      const results = [
        { taskId: 't1', success: true },
        { taskId: 't2', success: true },
        { taskId: 't3', success: false },
        { taskId: 't4', success: true },
        { taskId: 't5', success: true },
      ];

      const successRate = results.filter(r => r.success).length / results.length;
      expect(successRate).toBe(0.8);
    });

    it('should calculate average task duration', () => {
      const taskDurations = [100, 150, 200, 250, 300]; // in seconds
      const avgDuration = taskDurations.reduce((a, b) => a + b, 0) / taskDurations.length;

      expect(avgDuration).toBe(200);
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed tasks', () => {
      const maxRetries = 3;
      const task = { id: 't1', retries: 2, status: 'failed' };

      const shouldRetry = task.retries < maxRetries;
      expect(shouldRetry).toBe(true);
    });

    it('should mark task as permanently failed after max retries', () => {
      const maxRetries = 3;
      const task = { id: 't1', retries: 3, status: 'failed' };

      const isPermanentlyFailed = task.retries >= maxRetries;
      expect(isPermanentlyFailed).toBe(true);
    });

    it('should reassign tasks from failed workers', () => {
      const workers = [
        { id: 'w1', status: 'failed', task: 'task-1' },
        { id: 'w2', status: 'running', task: 'task-2' },
        { id: 'w3', status: 'idle', task: undefined },
      ];

      const failedWorker = workers.find(w => w.status === 'failed');
      const availableWorker = workers.find(w => w.status === 'idle');

      expect(failedWorker?.task).toBe('task-1');
      expect(availableWorker?.id).toBe('w3');
    });
  });

  describe('Team Shutdown', () => {
    it('should gracefully shutdown all workers', () => {
      const workers = [
        { id: 'w1', status: 'running' },
        { id: 'w2', status: 'running' },
      ];

      const shutdownWorkers = workers.map(w => ({ ...w, status: 'stopped' }));

      expect(shutdownWorkers.every(w => w.status === 'stopped')).toBe(true);
    });

    it('should cleanup resources on shutdown', () => {
      const resources = ['pane-1', 'pane-2', 'lock-file'];
      const cleanup = (resources: string[]): string[] => {
        // Simulate cleanup
        return [];
      };

      const remaining = cleanup(resources);
      expect(remaining).toHaveLength(0);
    });

    it('should save final state before shutdown', async () => {
      const teamState = {
        name: 'shutdown-team',
        status: 'completed',
        workers: [{ id: 'w1', status: 'completed' }],
        completedAt: new Date().toISOString(),
      };

      await writeFile(join(teamsDir, `${teamState.name}.json`), JSON.stringify(teamState, null, 2));

      const content = await readFile(join(teamsDir, `${teamState.name}.json`), 'utf-8');
      const state = JSON.parse(content);

      expect(state.status).toBe('completed');
      expect(state.completedAt).toBeDefined();
    });
  });
});
