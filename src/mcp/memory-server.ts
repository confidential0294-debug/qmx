/**
 * QMX Memory MCP Server
 * 
 * Provides persistent memory for QMX sessions.
 * Stores project knowledge, decisions, and context across sessions.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import lockfile from 'proper-lockfile';

// Schema definitions
interface ProjectMemory {
  projectName: string;
  createdAt: string;
  updatedAt: string;
  architecture: {
    overview: string;
    components: Array<{ name: string; description: string; path: string }>;
    technologies: string[];
  };
  decisions: Array<{
    id: string;
    title: string;
    date: string;
    context: string;
    decision: string;
    consequences: string[];
  }>;
  knowledge: Array<{
    topic: string;
    summary: string;
    references: string[];
    lastUpdated: string;
  }>;
  conventions: Array<{
    category: string;
    rules: string[];
  }>;
  todos: Array<{
    id: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'completed';
    createdAt: string;
  }>;
}

// Memory path
const QMX_DIR = join(process.cwd(), '.qmx');
const MEMORY_PATH = join(QMX_DIR, 'project-memory.json');

// Server instance
export const server = new Server(
  {
    name: 'qmx-memory-server',
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
        name: 'project_memory_read',
        description: 'Read the entire project memory',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'project_memory_write',
        description: 'Write updates to project memory',
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              enum: ['architecture', 'decisions', 'knowledge', 'conventions', 'todos'],
            },
            data: { type: 'object' },
          },
          required: ['section', 'data'],
        },
      },
      {
        name: 'project_memory_query',
        description: 'Query specific sections of project memory',
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              enum: ['architecture', 'decisions', 'knowledge', 'conventions', 'todos'],
            },
            query: { type: 'string' },
          },
          required: ['section'],
        },
      },
      {
        name: 'project_memory_add_decision',
        description: 'Add an architectural decision record',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            context: { type: 'string' },
            decision: { type: 'string' },
            consequences: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'context', 'decision', 'consequences'],
        },
      },
      {
        name: 'project_memory_add_knowledge',
        description: 'Add knowledge entry to project memory',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            summary: { type: 'string' },
            references: { type: 'array', items: { type: 'string' } },
          },
          required: ['topic', 'summary'],
        },
      },
      {
        name: 'project_memory_add_todo',
        description: 'Add a todo item to project memory',
        inputSchema: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['description', 'priority'],
        },
      },
      {
        name: 'project_memory_update_todo',
        description: 'Update a todo item status',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
            },
          },
          required: ['id', 'status'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'project_memory_read':
        return await handleMemoryRead();
      case 'project_memory_write':
        return await handleMemoryWrite(args as any);
      case 'project_memory_query':
        return await handleMemoryQuery(args as any);
      case 'project_memory_add_decision':
        return await handleAddDecision(args as any);
      case 'project_memory_add_knowledge':
        return await handleAddKnowledge(args as any);
      case 'project_memory_add_todo':
        return await handleAddTodo(args as any);
      case 'project_memory_update_todo':
        return await handleUpdateTodo(args as any);
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

async function handleMemoryRead() {
  try {
    const memory = await readMemory();
    return {
      content: [{ type: 'text', text: JSON.stringify(memory, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: 'Project memory not found. Initialize with setup first.' }],
      isError: true,
    };
  }
}

async function handleMemoryWrite(args: {
  section: keyof ProjectMemory;
  data: any;
}) {
  const release = await lockfile.lock(MEMORY_PATH, { retries: 3 });
  try {
    const memory = await readMemory();

    if (args.section === 'architecture') {
      memory.architecture = { ...memory.architecture, ...(args.data as object) };
    } else if (Array.isArray(memory[args.section])) {
      (memory[args.section] as any[]).push(args.data);
    }

    memory.updatedAt = new Date().toISOString();
    await writeMemory(memory);

    return {
      content: [{ type: 'text', text: JSON.stringify(memory, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleMemoryQuery(args: {
  section: keyof ProjectMemory;
  query?: string;
}) {
  const memory = await readMemory();
  const section = memory[args.section];

  if (!section) {
    return {
      content: [{ type: 'text', text: `Section ${args.section} not found` }],
      isError: true,
    };
  }

  let result: any = section;

  if (args.query && Array.isArray(section)) {
    const queryLower = args.query.toLowerCase();
    result = section.filter((item: any) =>
      JSON.stringify(item).toLowerCase().includes(queryLower)
    );
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}

async function handleAddDecision(args: {
  title: string;
  context: string;
  decision: string;
  consequences: string[];
}) {
  const release = await lockfile.lock(MEMORY_PATH, { retries: 3 });
  try {
    const memory = await readMemory();
    
    const decision = {
      id: `adr-${Date.now()}`,
      title: args.title,
      date: new Date().toISOString(),
      context: args.context,
      decision: args.decision,
      consequences: args.consequences,
    };
    
    memory.decisions.push(decision);
    memory.updatedAt = new Date().toISOString();
    
    await writeMemory(memory);
    
    return {
      content: [{ type: 'text', text: JSON.stringify(decision, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleAddKnowledge(args: {
  topic: string;
  summary: string;
  references?: string[];
}) {
  const release = await lockfile.lock(MEMORY_PATH, { retries: 3 });
  try {
    const memory = await readMemory();
    
    const knowledge = {
      topic: args.topic,
      summary: args.summary,
      references: args.references || [],
      lastUpdated: new Date().toISOString(),
    };
    
    memory.knowledge.push(knowledge);
    memory.updatedAt = new Date().toISOString();
    
    await writeMemory(memory);
    
    return {
      content: [{ type: 'text', text: JSON.stringify(knowledge, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleAddTodo(args: {
  description: string;
  priority: 'high' | 'medium' | 'low';
}) {
  const release = await lockfile.lock(MEMORY_PATH, { retries: 3 });
  try {
    const memory = await readMemory();
    
    const todo = {
      id: `todo-${Date.now()}`,
      description: args.description,
      priority: args.priority,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    
    memory.todos.push(todo);
    memory.updatedAt = new Date().toISOString();
    
    await writeMemory(memory);
    
    return {
      content: [{ type: 'text', text: JSON.stringify(todo, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleUpdateTodo(args: {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
}) {
  const release = await lockfile.lock(MEMORY_PATH, { retries: 3 });
  try {
    const memory = await readMemory();
    
    const todo = memory.todos.find(t => t.id === args.id);
    if (!todo) {
      return {
        content: [{ type: 'text', text: 'Todo not found' }],
        isError: true,
      };
    }
    
    todo.status = args.status;
    memory.updatedAt = new Date().toISOString();
    
    await writeMemory(memory);
    
    return {
      content: [{ type: 'text', text: JSON.stringify(todo, null, 2) }],
    };
  } finally {
    await release();
  }
}

// Utility functions

async function readMemory(): Promise<ProjectMemory> {
  try {
    const content = await readFile(MEMORY_PATH, 'utf-8');
    return JSON.parse(content) as ProjectMemory;
  } catch (error) {
    // Return default structure if file doesn't exist
    const defaultMemory: ProjectMemory = {
      projectName: 'Unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      architecture: {
        overview: '',
        components: [],
        technologies: [],
      },
      decisions: [],
      knowledge: [],
      conventions: [],
      todos: [],
    };
    await writeMemory(defaultMemory);
    return defaultMemory;
  }
}

async function writeMemory(memory: ProjectMemory) {
  await mkdir(QMX_DIR, { recursive: true });
  await writeFile(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

// Start server
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('QMX Memory MCP Server running');
}

main().catch(console.error);

// Export types for index.ts
export type { ProjectMemory };
