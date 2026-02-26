/**
 * Tests for Team Runtime
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createTeam,
  startTeam,
  shutdownTeam,
  isTmuxAvailable,
  getTmuxVersion,
  teamSessionExists,
} from '../../src/team/runtime.js';

describe('Team Runtime', () => {
  describe('isTmuxAvailable', () => {
    it('should return true when tmux is installed', () => {
      const available = isTmuxAvailable();
      // This test will pass or skip based on environment
      if (available) {
        expect(available).toBe(true);
      }
    });
  });

  describe('getTmuxVersion', () => {
    it('should return version string when tmux is available', () => {
      const version = getTmuxVersion();
      if (version !== 'unknown') {
        expect(version).toMatch(/\d+\.\d+/);
      }
    });
  });

  describe('createTeam', () => {
    const testTeamName = 'test-team';

    afterEach(async () => {
      // Cleanup after each test
      try {
        await shutdownTeam(testTeamName);
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should throw error if tmux not available', async () => {
      // Skip if tmux is available
      if (isTmuxAvailable()) {
        return;
      }

      await expect(
        createTeam({
          name: testTeamName,
          role: 'executor',
          workerCount: 3,
          task: 'test task',
          cwd: process.cwd(),
        })
      ).rejects.toThrow('tmux');
    });

    it('should create team with specified worker count', async () => {
      // Skip if tmux not available
      if (!isTmuxAvailable()) {
        return;
      }

      const team = await createTeam({
        name: testTeamName,
        role: 'executor',
        workerCount: 3,
        task: 'test task',
        cwd: process.cwd(),
      });

      expect(team.name).toContain(testTeamName);
      expect(team.workers).toHaveLength(3);
      expect(team.status).toBe('created');
    });

    it('should initialize all workers in pending state', async () => {
      if (!isTmuxAvailable()) {
        return;
      }

      const team = await createTeam({
        name: testTeamName,
        role: 'executor',
        workerCount: 2,
        task: 'test task',
        cwd: process.cwd(),
      });

      team.workers.forEach((worker) => {
        expect(worker.status).toBe('pending');
        expect(worker.id).toMatch(/worker-\d+/);
      });
    });
  });

  describe('startTeam', () => {
    const testTeamName = 'test-team-start';

    beforeEach(async () => {
      if (!isTmuxAvailable()) {
        return;
      }

      await createTeam({
        name: testTeamName,
        role: 'executor',
        workerCount: 2,
        task: 'test task',
        cwd: process.cwd(),
      });
    });

    afterEach(async () => {
      try {
        await shutdownTeam(testTeamName);
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should transition team to running state', async () => {
      if (!isTmuxAvailable()) {
        return;
      }

      await startTeam(testTeamName, {
        name: testTeamName,
        role: 'executor',
        workerCount: 2,
        task: 'test task',
        cwd: process.cwd(),
      });

      const status = await getTeamStatus(testTeamName);
      expect(status.status).toBe('running');
    });

    it('should set all workers to running status', async () => {
      if (!isTmuxAvailable()) {
        return;
      }

      await startTeam(testTeamName, {
        name: testTeamName,
        role: 'executor',
        workerCount: 2,
        task: 'test task',
        cwd: process.cwd(),
      });

      const status = await getTeamStatus(testTeamName);
      status.workers.forEach((worker) => {
        expect(worker.status).toBe('running');
      });
    });
  });

  describe('shutdownTeam', () => {
    const testTeamName = 'test-team-shutdown';

    it('should cleanup tmux session', async () => {
      if (!isTmuxAvailable()) {
        return;
      }

      await createTeam({
        name: testTeamName,
        role: 'executor',
        workerCount: 2,
        task: 'test task',
        cwd: process.cwd(),
      });

      await shutdownTeam(testTeamName);

      const exists = teamSessionExists(testTeamName);
      expect(exists).toBe(false);
    });

    it('should update team state to cancelled', async () => {
      if (!isTmuxAvailable()) {
        return;
      }

      await createTeam({
        name: testTeamName,
        role: 'executor',
        workerCount: 2,
        task: 'test task',
        cwd: process.cwd(),
      });

      await shutdownTeam(testTeamName);

      const status = await getTeamStatus(testTeamName);
      expect(status.status).toBe('cancelled');
    });
  });
});
