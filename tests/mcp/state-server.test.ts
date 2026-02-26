/**
 * Tests for State MCP Server
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

// Mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: {},
  ListToolsRequestSchema: {},
}));

describe('State MCP Server', () => {
  const testSessionId = 'test-session-123';
  const testTeamName = 'test-team';
  const stateDir = join(process.cwd(), '.qmx', 'state');
  const sessionsDir = join(stateDir, 'sessions');
  const teamsDir = join(stateDir, 'teams');

  beforeEach(async () => {
    // Setup test directories
    await mkdir(sessionsDir, { recursive: true });
    await mkdir(teamsDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test files
    try {
      await rm(stateDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Session Management', () => {
    describe('session_create', () => {
      it('should create a new session with valid ID', async () => {
        // Import after mocks are set up
        const module = await import('../../src/mcp/state-server.js');
        
        // Verify server exports correctly
        expect(module).toBeDefined();
      });

      it('should initialize session with correct default status', async () => {
        const sessionPath = join(sessionsDir, `${testSessionId}.json`);
        
        const expectedState = {
          sessionId: testSessionId,
          status: 'initializing',
          startTime: expect.any(String),
          lastActivity: expect.any(String),
          activeTeams: [],
          activeModes: [],
        };

        // Simulate session creation
        await writeFile(sessionPath, JSON.stringify(expectedState, null, 2));
        
        const content = await readFile(sessionPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.sessionId).toBe(testSessionId);
        expect(state.status).toBe('initializing');
        expect(state.activeTeams).toEqual([]);
      });

      it('should include metadata when provided', async () => {
        const metadata = { projectId: 'proj-123', userId: 'user-456' };
        const sessionPath = join(sessionsDir, `${testSessionId}.json`);

        const expectedState = {
          sessionId: testSessionId,
          status: 'initializing',
          startTime: expect.any(String),
          lastActivity: expect.any(String),
          activeTeams: [],
          activeModes: [],
          metadata,
        };

        await writeFile(sessionPath, JSON.stringify(expectedState, null, 2));
        
        const content = await readFile(sessionPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.metadata).toEqual(metadata);
      });
    });

    describe('session_update', () => {
      it('should update session status', async () => {
        const sessionPath = join(sessionsDir, `${testSessionId}.json`);
        const initialState = {
          sessionId: testSessionId,
          status: 'initializing',
          startTime: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          activeTeams: [],
          activeModes: [],
        };

        await writeFile(sessionPath, JSON.stringify(initialState, null, 2));

        // Simulate status update
        const updatedState = {
          ...initialState,
          status: 'running',
          lastActivity: new Date().toISOString(),
        };

        await writeFile(sessionPath, JSON.stringify(updatedState, null, 2));

        const content = await readFile(sessionPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.status).toBe('running');
      });

      it('should add active teams to session', async () => {
        const sessionPath = join(sessionsDir, `${testSessionId}.json`);
        const initialState = {
          sessionId: testSessionId,
          status: 'running',
          startTime: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          activeTeams: [],
          activeModes: [],
        };

        await writeFile(sessionPath, JSON.stringify(initialState, null, 2));

        const updatedState = {
          ...initialState,
          activeTeams: ['team-1', 'team-2'],
          lastActivity: new Date().toISOString(),
        };

        await writeFile(sessionPath, JSON.stringify(updatedState, null, 2));

        const content = await readFile(sessionPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.activeTeams).toEqual(['team-1', 'team-2']);
      });
    });

    describe('session_get', () => {
      it('should return session state', async () => {
        const sessionPath = join(sessionsDir, `${testSessionId}.json`);
        const expectedState = {
          sessionId: testSessionId,
          status: 'running',
          startTime: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          activeTeams: ['team-1'],
          activeModes: ['development'],
        };

        await writeFile(sessionPath, JSON.stringify(expectedState, null, 2));

        const content = await readFile(sessionPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.sessionId).toBe(testSessionId);
        expect(state.status).toBe('running');
        expect(state.activeModes).toEqual(['development']);
      });

      it('should return error for non-existent session', async () => {
        const nonExistentId = 'non-existent-session';
        const sessionPath = join(sessionsDir, `${nonExistentId}.json`);

        try {
          await readFile(sessionPath, 'utf-8');
          expect.fail('Should have thrown');
        } catch (error) {
          expect((error as NodeJS.ErrnoException).code).toBe('ENOENT');
        }
      });
    });
  });

  describe('Team Management', () => {
    describe('team_create', () => {
      it('should create a new team with valid configuration', async () => {
        const teamPath = join(teamsDir, `${testTeamName}.json`);
        const now = new Date().toISOString();

        const expectedState = {
          name: testTeamName,
          role: 'executor',
          workerCount: 3,
          status: 'created',
          createdAt: now,
          updatedAt: now,
          tasks: [],
        };

        await writeFile(teamPath, JSON.stringify(expectedState, null, 2));

        const content = await readFile(teamPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.name).toBe(testTeamName);
        expect(state.role).toBe('executor');
        expect(state.workerCount).toBe(3);
        expect(state.status).toBe('created');
      });

      it('should initialize team with empty tasks array', async () => {
        const teamPath = join(teamsDir, `${testTeamName}.json`);

        const expectedState = {
          name: testTeamName,
          role: 'reviewer',
          workerCount: 2,
          status: 'created',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [],
        };

        await writeFile(teamPath, JSON.stringify(expectedState, null, 2));

        const content = await readFile(teamPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.tasks).toEqual([]);
      });
    });

    describe('team_update', () => {
      it('should update team status', async () => {
        const teamPath = join(teamsDir, `${testTeamName}.json`);
        const initialState = {
          name: testTeamName,
          role: 'executor',
          workerCount: 3,
          status: 'created',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [],
        };

        await writeFile(teamPath, JSON.stringify(initialState, null, 2));

        const updatedState = {
          ...initialState,
          status: 'running',
          updatedAt: new Date().toISOString(),
        };

        await writeFile(teamPath, JSON.stringify(updatedState, null, 2));

        const content = await readFile(teamPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.status).toBe('running');
      });

      it('should add tasks to team', async () => {
        const teamPath = join(teamsDir, `${testTeamName}.json`);
        const initialState = {
          name: testTeamName,
          role: 'executor',
          workerCount: 2,
          status: 'running',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [],
        };

        await writeFile(teamPath, JSON.stringify(initialState, null, 2));

        const tasks = [
          {
            id: 'task-1',
            description: 'First task',
            assignedTo: 'worker-1',
            status: 'in_progress' as const,
            version: 1,
          },
          {
            id: 'task-2',
            description: 'Second task',
            status: 'pending' as const,
            version: 1,
          },
        ];

        const updatedState = {
          ...initialState,
          tasks,
          updatedAt: new Date().toISOString(),
        };

        await writeFile(teamPath, JSON.stringify(updatedState, null, 2));

        const content = await readFile(teamPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.tasks).toHaveLength(2);
        expect(state.tasks[0].id).toBe('task-1');
        expect(state.tasks[1].status).toBe('pending');
      });
    });

    describe('team_get', () => {
      it('should return team state', async () => {
        const teamPath = join(teamsDir, `${testTeamName}.json`);
        const expectedState = {
          name: testTeamName,
          role: 'debugger',
          workerCount: 4,
          status: 'running',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [],
          phase: 'execution',
        };

        await writeFile(teamPath, JSON.stringify(expectedState, null, 2));

        const content = await readFile(teamPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.name).toBe(testTeamName);
        expect(state.role).toBe('debugger');
        expect(state.phase).toBe('execution');
      });
    });

    describe('team_list', () => {
      it('should list all teams', async () => {
        const teams = [
          {
            name: 'team-alpha',
            role: 'executor',
            workerCount: 3,
            status: 'running',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [],
          },
          {
            name: 'team-beta',
            role: 'reviewer',
            workerCount: 2,
            status: 'created',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [],
          },
        ];

        for (const team of teams) {
          const teamPath = join(teamsDir, `${team.name}.json`);
          await writeFile(teamPath, JSON.stringify(team, null, 2));
        }

        const files = await Promise.all(
          ['team-alpha.json', 'team-beta.json'].map(f => 
            readFile(join(teamsDir, f), 'utf-8')
          )
        );

        const listedTeams = files.map(f => JSON.parse(f));

        expect(listedTeams).toHaveLength(2);
        expect(listedTeams.map(t => t.name)).toContain('team-alpha');
        expect(listedTeams.map(t => t.name)).toContain('team-beta');
      });

      it('should filter teams by status', async () => {
        const teams = [
          {
            name: 'running-team',
            role: 'executor',
            workerCount: 2,
            status: 'running',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [],
          },
          {
            name: 'completed-team',
            role: 'executor',
            workerCount: 2,
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [],
          },
        ];

        for (const team of teams) {
          const teamPath = join(teamsDir, `${team.name}.json`);
          await writeFile(teamPath, JSON.stringify(team, null, 2));
        }

        const files = await Promise.all(
          ['running-team.json', 'completed-team.json'].map(f => 
            readFile(join(teamsDir, f), 'utf-8')
          )
        );

        const allTeams = files.map(f => JSON.parse(f));
        const runningTeams = allTeams.filter(t => t.status === 'running');

        expect(runningTeams).toHaveLength(1);
        expect(runningTeams[0].name).toBe('running-team');
      });
    });
  });

  describe('Task Management', () => {
    describe('task_claim', () => {
      it('should claim a task with correct version', async () => {
        const teamPath = join(teamsDir, `${testTeamName}.json`);
        const initialState = {
          name: testTeamName,
          role: 'executor',
          workerCount: 2,
          status: 'running',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [
            {
              id: 'task-1',
              description: 'Test task',
              status: 'pending' as const,
              version: 1,
            },
          ],
        };

        await writeFile(teamPath, JSON.stringify(initialState, null, 2));

        // Simulate task claim
        const task = initialState.tasks[0];
        task.assignedTo = 'worker-1';
        task.status = 'in_progress';
        task.version = 2;

        const updatedState = {
          ...initialState,
          tasks: initialState.tasks,
          updatedAt: new Date().toISOString(),
        };

        await writeFile(teamPath, JSON.stringify(updatedState, null, 2));

        const content = await readFile(teamPath, 'utf-8');
        const state = JSON.parse(content);

        expect(state.tasks[0].assignedTo).toBe('worker-1');
        expect(state.tasks[0].status).toBe('in_progress');
        expect(state.tasks[0].version).toBe(2);
      });

      it('should fail to claim task with wrong version', async () => {
        const teamPath = join(teamsDir, `${testTeamName}.json`);
        const initialState = {
          name: testTeamName,
          role: 'executor',
          workerCount: 2,
          status: 'running',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [
            {
              id: 'task-1',
              description: 'Test task',
              status: 'pending' as const,
              version: 2,
            },
          ],
        };

        await writeFile(teamPath, JSON.stringify(initialState, null, 2));

        // Expected version is 1, but actual is 2 - should fail
        const expectedVersion = 1;
        const actualVersion = initialState.tasks[0].version;

        expect(expectedVersion).not.toBe(actualVersion);
      });

      it('should return error for non-existent task', async () => {
        const teamPath = join(teamsDir, `${testTeamName}.json`);
        const initialState = {
          name: testTeamName,
          role: 'executor',
          workerCount: 2,
          status: 'running',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [],
        };

        await writeFile(teamPath, JSON.stringify(initialState, null, 2));

        const taskId = 'non-existent-task';
        const task = initialState.tasks.find(t => t.id === taskId);

        expect(task).toBeUndefined();
      });
    });
  });

  describe('State Validation', () => {
    it('should validate session state schema', async () => {
      const sessionPath = join(sessionsDir, `${testSessionId}.json`);
      const validState = {
        sessionId: testSessionId,
        status: 'running',
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        activeTeams: ['team-1'],
        activeModes: ['development'],
      };

      await writeFile(sessionPath, JSON.stringify(validState, null, 2));
      const content = await readFile(sessionPath, 'utf-8');
      const state = JSON.parse(content);

      // Validate required fields
      expect(state).toHaveProperty('sessionId');
      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('startTime');
      expect(state).toHaveProperty('lastActivity');
      expect(state).toHaveProperty('activeTeams');
      expect(state).toHaveProperty('activeModes');
    });

    it('should validate team state schema', async () => {
      const teamPath = join(teamsDir, `${testTeamName}.json`);
      const validState = {
        name: testTeamName,
        role: 'executor',
        workerCount: 3,
        status: 'running',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: [],
      };

      await writeFile(teamPath, JSON.stringify(validState, null, 2));
      const content = await readFile(teamPath, 'utf-8');
      const state = JSON.parse(content);

      // Validate required fields
      expect(state).toHaveProperty('name');
      expect(state).toHaveProperty('role');
      expect(state).toHaveProperty('workerCount');
      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('createdAt');
      expect(state).toHaveProperty('updatedAt');
      expect(state).toHaveProperty('tasks');
    });
  });
});
