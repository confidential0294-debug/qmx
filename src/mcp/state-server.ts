/**
 * QMX State MCP Server
 * 
 * Provides state management for QMX sessions, teams, and tasks.
 * Implements the Model Context Protocol for standardized communication.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import lockfile from 'proper-lockfile';

// Schema definitions
const SessionStateSchema = z.object({
  sessionId: z.string(),
  status: z.enum(['initializing', 'running', 'idle', 'ending', 'ended']),
  startTime: z.string(),
  lastActivity: z.string(),
  activeTeams: z.array(z.string()),
  activeModes: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
});

const TeamStateSchema = z.object({
  name: z.string(),
  role: z.string(),
  workerCount: z.number(),
  status: z.enum(['created', 'starting', 'running', 'completed', 'failed', 'cancelled']),
  phase: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tasks: z.array(z.object({
    id: z.string(),
    description: z.string(),
    assignedTo: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
    version: z.number(),
  })),
  metadata: z.record(z.unknown()).optional(),
});

type SessionState = z.infer<typeof SessionStateSchema>;
type TeamState = z.infer<typeof TeamStateSchema>;

// State paths
const QMX_DIR = join(process.cwd(), '.qmx');
const STATE_DIR = join(QMX_DIR, 'state');
const SESSIONS_DIR = join(STATE_DIR, 'sessions');
const TEAMS_DIR = join(STATE_DIR, 'teams');

// Server instance
export const server = new Server(
  {
    name: 'qmx-state-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'session_create',
        description: 'Create a new QMX session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            metadata: { type: 'object' },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'session_update',
        description: 'Update session state',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            status: { type: 'string', enum: ['initializing', 'running', 'idle', 'ending', 'ended'] },
            lastActivity: { type: 'string' },
            activeTeams: { type: 'array', items: { type: 'string' } },
            metadata: { type: 'object' },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'session_get',
        description: 'Get session state',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'team_create',
        description: 'Create a new team',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            workerCount: { type: 'number' },
            sessionId: { type: 'string' },
          },
          required: ['name', 'role', 'workerCount'],
        },
      },
      {
        name: 'team_update',
        description: 'Update team state',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            status: { type: 'string' },
            phase: { type: 'string' },
            tasks: { type: 'array' },
          },
          required: ['name'],
        },
      },
      {
        name: 'team_get',
        description: 'Get team state',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      },
      {
        name: 'team_list',
        description: 'List all teams',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            status: { type: 'string' },
          },
        },
      },
      {
        name: 'task_claim',
        description: 'Claim a task for a worker (with optimistic locking)',
        inputSchema: {
          type: 'object',
          properties: {
            teamName: { type: 'string' },
            taskId: { type: 'string' },
            workerId: { type: 'string' },
            expectedVersion: { type: 'number' },
          },
          required: ['teamName', 'taskId', 'workerId', 'expectedVersion'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'session_create':
        return await handleSessionCreate(args as any);
      case 'session_update':
        return await handleSessionUpdate(args as any);
      case 'session_get':
        return await handleSessionGet(args as any);
      case 'team_create':
        return await handleTeamCreate(args as any);
      case 'team_update':
        return await handleTeamUpdate(args as any);
      case 'team_get':
        return await handleTeamGet(args as any);
      case 'team_list':
        return await handleTeamList(args as any);
      case 'task_claim':
        return await handleTaskClaim(args as any);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool handlers implementation

async function handleSessionCreate(args: { sessionId: string; metadata?: Record<string, unknown> }) {
  await ensureDirs();
  
  const state: SessionState = {
    sessionId: args.sessionId,
    status: 'initializing',
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    activeTeams: [],
    activeModes: [],
    metadata: args.metadata,
  };

  const sessionPath = join(SESSIONS_DIR, `${args.sessionId}.json`);
  await writeFile(sessionPath, JSON.stringify(state, null, 2));

  return {
    content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
  };
}

async function handleSessionUpdate(args: {
  sessionId: string;
  status?: string;
  lastActivity?: string;
  activeTeams?: string[];
  metadata?: Record<string, unknown>;
}) {
  const sessionPath = join(SESSIONS_DIR, `${args.sessionId}.json`);

  const release = await lockfile.lock(sessionPath, { retries: 3 });
  try {
    const current = JSON.parse(await readFile(sessionPath, 'utf-8')) as SessionState;
    const updated: SessionState = {
      ...current,
      ...(args.status && { status: args.status as SessionState['status'] }),
      ...(args.lastActivity && { lastActivity: args.lastActivity }),
      ...(args.activeTeams && { activeTeams: args.activeTeams }),
      ...(args.metadata && { metadata: args.metadata }),
    };
    
    await writeFile(sessionPath, JSON.stringify(updated, null, 2));
    
    return {
      content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleSessionGet(args: { sessionId: string }) {
  const sessionPath = join(SESSIONS_DIR, `${args.sessionId}.json`);
  
  try {
    const state = JSON.parse(await readFile(sessionPath, 'utf-8')) as SessionState;
    return {
      content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: 'Session not found' }],
      isError: true,
    };
  }
}

async function handleTeamCreate(args: {
  name: string;
  role: string;
  workerCount: number;
  sessionId?: string;
}) {
  await ensureDirs();
  
  const now = new Date().toISOString();
  const state: TeamState = {
    name: args.name,
    role: args.role,
    workerCount: args.workerCount,
    status: 'created',
    createdAt: now,
    updatedAt: now,
    tasks: [],
  };

  const teamPath = join(TEAMS_DIR, `${args.name}.json`);
  await writeFile(teamPath, JSON.stringify(state, null, 2));

  return {
    content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
  };
}

async function handleTeamUpdate(args: {
  name: string;
  status?: string;
  phase?: string;
  tasks?: Array<any>;
}) {
  const teamPath = join(TEAMS_DIR, `${args.name}.json`);
  
  const release = await lockfile.lock(teamPath, { retries: 3 });
  try {
    const current = JSON.parse(await readFile(teamPath, 'utf-8')) as TeamState;
    const updated: TeamState = {
      ...current,
      updatedAt: new Date().toISOString(),
      ...(args.status && { status: args.status as TeamState['status'] }),
      ...(args.phase && { phase: args.phase }),
      ...(args.tasks && { tasks: args.tasks }),
    };
    
    await writeFile(teamPath, JSON.stringify(updated, null, 2));
    
    return {
      content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleTeamGet(args: { name: string }) {
  const teamPath = join(TEAMS_DIR, `${args.name}.json`);
  
  try {
    const state = JSON.parse(await readFile(teamPath, 'utf-8')) as TeamState;
    return {
      content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: 'Team not found' }],
      isError: true,
    };
  }
}

async function handleTeamList(args: { sessionId?: string; status?: string }) {
  await ensureDirs();
  
  try {
    const files = await readdir(TEAMS_DIR);
    const teams = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async f => {
          const content = await readFile(join(TEAMS_DIR, f), 'utf-8');
          return JSON.parse(content) as TeamState;
        })
    );
    
    let filtered = teams;
    if (args.status) {
      filtered = filtered.filter(t => t.status === args.status);
    }
    
    return {
      content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: '[]' }],
    };
  }
}

async function handleTaskClaim(args: {
  teamName: string;
  taskId: string;
  workerId: string;
  expectedVersion: number;
}) {
  const teamPath = join(TEAMS_DIR, `${args.teamName}.json`);
  
  const release = await lockfile.lock(teamPath, { retries: 3 });
  try {
    const current = JSON.parse(await readFile(teamPath, 'utf-8')) as TeamState;
    const task = current.tasks.find(t => t.id === args.taskId);
    
    if (!task) {
      return {
        content: [{ type: 'text', text: 'Task not found' }],
        isError: true,
      };
    }
    
    if (task.version !== args.expectedVersion) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ ok: false, error: 'version_mismatch' }) }],
        isError: true,
      };
    }
    
    task.assignedTo = args.workerId;
    task.status = 'in_progress';
    task.version += 1;
    
    await writeFile(teamPath, JSON.stringify(current, null, 2));
    
    return {
      content: [{ type: 'text', text: JSON.stringify({ ok: true, task }) }],
    };
  } finally {
    await release();
  }
}

// Utility functions

async function ensureDirs() {
  await mkdir(STATE_DIR, { recursive: true });
  await mkdir(SESSIONS_DIR, { recursive: true });
  await mkdir(TEAMS_DIR, { recursive: true });
}

// Start server
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('QMX State MCP Server running');
}

main().catch(console.error);

// Export types for index.ts
export type { SessionState, TeamState };
