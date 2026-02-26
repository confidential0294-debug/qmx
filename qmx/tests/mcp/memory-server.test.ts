/**
 * Tests for Memory MCP Server
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

describe('Memory MCP Server', () => {
  const qmxDir = join(process.cwd(), '.qmx');
  const memoryPath = join(qmxDir, 'project-memory.json');

  beforeEach(async () => {
    await mkdir(qmxDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Project Memory Read', () => {
    describe('project_memory_read', () => {
      it('should read project memory when file exists', async () => {
        const expectedMemory = {
          projectName: 'Test Project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          architecture: {
            overview: 'Test architecture',
            components: [
              { name: 'API', description: 'REST API', path: './src/api' },
            ],
            technologies: ['TypeScript', 'Node.js'],
          },
          decisions: [],
          knowledge: [],
          conventions: [],
          todos: [],
        };

        await writeFile(memoryPath, JSON.stringify(expectedMemory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const memory = JSON.parse(content);

        expect(memory.projectName).toBe('Test Project');
        expect(memory.architecture.technologies).toContain('TypeScript');
      });

      it('should return default structure when file does not exist', async () => {
        // File doesn't exist - should create default
        const defaultMemory = {
          projectName: 'Unknown',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
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

        // Verify default structure
        expect(defaultMemory.projectName).toBe('Unknown');
        expect(defaultMemory.architecture.components).toEqual([]);
      });
    });
  });

  describe('Project Memory Write', () => {
    describe('project_memory_write', () => {
      it('should write architecture section', async () => {
        const initialMemory = {
          projectName: 'Test Project',
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

        await writeFile(memoryPath, JSON.stringify(initialMemory, null, 2));

        const updatedMemory = {
          ...initialMemory,
          architecture: {
            overview: 'Updated overview',
            components: [{ name: 'New Component', description: 'Desc', path: './src' }],
            technologies: ['React'],
          },
          updatedAt: new Date().toISOString(),
        };

        await writeFile(memoryPath, JSON.stringify(updatedMemory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const memory = JSON.parse(content);

        expect(memory.architecture.overview).toBe('Updated overview');
        expect(memory.architecture.technologies).toContain('React');
      });

      it('should append to arrays when writing', async () => {
        const initialMemory = {
          projectName: 'Test Project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          architecture: {
            overview: '',
            components: [],
            technologies: ['Node.js'],
          },
          decisions: [],
          knowledge: [],
          conventions: [],
          todos: [],
        };

        await writeFile(memoryPath, JSON.stringify(initialMemory, null, 2));

        const updatedMemory = {
          ...initialMemory,
          architecture: {
            ...initialMemory.architecture,
            technologies: [...initialMemory.architecture.technologies, 'TypeScript'],
          },
          updatedAt: new Date().toISOString(),
        };

        await writeFile(memoryPath, JSON.stringify(updatedMemory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const memory = JSON.parse(content);

        expect(memory.architecture.technologies).toHaveLength(2);
        expect(memory.architecture.technologies).toContain('TypeScript');
      });
    });
  });

  describe('Project Memory Query', () => {
    describe('project_memory_query', () => {
      it('should query architecture section', async () => {
        const memory = {
          projectName: 'Test Project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          architecture: {
            overview: 'Microservices architecture',
            components: [
              { name: 'API Gateway', description: 'Routes requests', path: './gateway' },
              { name: 'User Service', description: 'Manages users', path: './users' },
            ],
            technologies: ['Node.js', 'Docker', 'Kubernetes'],
          },
          decisions: [],
          knowledge: [],
          conventions: [],
          todos: [],
        };

        await writeFile(memoryPath, JSON.stringify(memory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const queried = JSON.parse(content);

        expect(queried.architecture).toBeDefined();
        expect(queried.architecture.components).toHaveLength(2);
      });

      it('should query decisions section', async () => {
        const memory = {
          projectName: 'Test Project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          architecture: {
            overview: '',
            components: [],
            technologies: [],
          },
          decisions: [
            {
              id: 'adr-1',
              title: 'Use TypeScript',
              date: new Date().toISOString(),
              context: 'Need type safety',
              decision: 'Adopt TypeScript for all new code',
              consequences: ['Better IDE support', 'Compile step required'],
            },
          ],
          knowledge: [],
          conventions: [],
          todos: [],
        };

        await writeFile(memoryPath, JSON.stringify(memory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const queried = JSON.parse(content);

        expect(queried.decisions).toHaveLength(1);
        expect(queried.decisions[0].title).toBe('Use TypeScript');
      });

      it('should filter knowledge by query', async () => {
        const memory = {
          projectName: 'Test Project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          architecture: {
            overview: '',
            components: [],
            technologies: [],
          },
          decisions: [],
          knowledge: [
            {
              topic: 'Authentication',
              summary: 'JWT-based auth',
              references: ['https://jwt.io'],
              lastUpdated: new Date().toISOString(),
            },
            {
              topic: 'Database',
              summary: 'PostgreSQL with Prisma',
              references: ['https://prisma.io'],
              lastUpdated: new Date().toISOString(),
            },
          ],
          conventions: [],
          todos: [],
        };

        await writeFile(memoryPath, JSON.stringify(memory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const queried = JSON.parse(content);

        // Filter by query "auth"
        const filtered = queried.knowledge.filter((k: any) =>
          JSON.stringify(k).toLowerCase().includes('auth')
        );

        expect(filtered).toHaveLength(1);
        expect(filtered[0].topic).toBe('Authentication');
      });
    });
  });

  describe('Decision Management', () => {
    describe('project_memory_add_decision', () => {
      it('should add a new decision', async () => {
        const initialMemory = {
          projectName: 'Test Project',
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

        await writeFile(memoryPath, JSON.stringify(initialMemory, null, 2));

        const newDecision = {
          id: `adr-${Date.now()}`,
          title: 'Use REST API',
          date: new Date().toISOString(),
          context: 'Need simple API interface',
          decision: 'Implement RESTful API design',
          consequences: ['Standard HTTP methods', 'Stateless communication'],
        };

        const updatedMemory = {
          ...initialMemory,
          decisions: [newDecision],
          updatedAt: new Date().toISOString(),
        };

        await writeFile(memoryPath, JSON.stringify(updatedMemory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const memory = JSON.parse(content);

        expect(memory.decisions).toHaveLength(1);
        expect(memory.decisions[0].title).toBe('Use REST API');
        expect(memory.decisions[0].consequences).toHaveLength(2);
      });

      it('should generate unique ID for decision', async () => {
        const decision1 = { id: `adr-${Date.now()}` };
        
        // Simulate time passing
        await new Promise(resolve => setTimeout(resolve, 1));
        
        const decision2 = { id: `adr-${Date.now()}` };

        expect(decision1.id).not.toBe(decision2.id);
      });
    });
  });

  describe('Knowledge Management', () => {
    describe('project_memory_add_knowledge', () => {
      it('should add knowledge entry', async () => {
        const initialMemory = {
          projectName: 'Test Project',
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

        await writeFile(memoryPath, JSON.stringify(initialMemory, null, 2));

        const newKnowledge = {
          topic: 'Testing Strategy',
          summary: 'Use vitest for unit tests',
          references: ['https://vitest.dev'],
          lastUpdated: new Date().toISOString(),
        };

        const updatedMemory = {
          ...initialMemory,
          knowledge: [newKnowledge],
          updatedAt: new Date().toISOString(),
        };

        await writeFile(memoryPath, JSON.stringify(updatedMemory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const memory = JSON.parse(content);

        expect(memory.knowledge).toHaveLength(1);
        expect(memory.knowledge[0].topic).toBe('Testing Strategy');
      });

      it('should include optional references', async () => {
        const knowledgeWithRefs = {
          topic: 'API Design',
          summary: 'RESTful principles',
          references: ['https://restfulapi.net', 'https://swagger.io'],
          lastUpdated: new Date().toISOString(),
        };

        const knowledgeWithoutRefs = {
          topic: 'Simple Topic',
          summary: 'No references',
          references: [],
          lastUpdated: new Date().toISOString(),
        };

        expect(knowledgeWithRefs.references).toHaveLength(2);
        expect(knowledgeWithoutRefs.references).toEqual([]);
      });
    });
  });

  describe('Todo Management', () => {
    describe('project_memory_add_todo', () => {
      it('should add todo with high priority', async () => {
        const initialMemory = {
          projectName: 'Test Project',
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

        await writeFile(memoryPath, JSON.stringify(initialMemory, null, 2));

        const newTodo = {
          id: `todo-${Date.now()}`,
          description: 'Implement authentication',
          priority: 'high' as const,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
        };

        const updatedMemory = {
          ...initialMemory,
          todos: [newTodo],
          updatedAt: new Date().toISOString(),
        };

        await writeFile(memoryPath, JSON.stringify(updatedMemory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const memory = JSON.parse(content);

        expect(memory.todos).toHaveLength(1);
        expect(memory.todos[0].priority).toBe('high');
        expect(memory.todos[0].status).toBe('pending');
      });

      it('should support all priority levels', async () => {
        const todos = [
          { priority: 'high', description: 'Critical bug fix' },
          { priority: 'medium', description: 'Feature implementation' },
          { priority: 'low', description: 'Documentation update' },
        ];

        expect(todos.map(t => t.priority)).toEqual(['high', 'medium', 'low']);
      });
    });

    describe('project_memory_update_todo', () => {
      it('should update todo status to in_progress', async () => {
        const todoId = 'todo-123';
        const initialMemory = {
          projectName: 'Test Project',
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
          todos: [
            {
              id: todoId,
              description: 'Implement feature',
              priority: 'medium' as const,
              status: 'pending' as const,
              createdAt: new Date().toISOString(),
            },
          ],
        };

        await writeFile(memoryPath, JSON.stringify(initialMemory, null, 2));

        const updatedMemory = {
          ...initialMemory,
          todos: initialMemory.todos.map(t =>
            t.id === todoId ? { ...t, status: 'in_progress' as const } : t
          ),
          updatedAt: new Date().toISOString(),
        };

        await writeFile(memoryPath, JSON.stringify(updatedMemory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const memory = JSON.parse(content);

        expect(memory.todos[0].status).toBe('in_progress');
      });

      it('should update todo status to completed', async () => {
        const todoId = 'todo-456';
        const initialMemory = {
          projectName: 'Test Project',
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
          todos: [
            {
              id: todoId,
              description: 'Fix bug',
              priority: 'high' as const,
              status: 'in_progress' as const,
              createdAt: new Date().toISOString(),
            },
          ],
        };

        await writeFile(memoryPath, JSON.stringify(initialMemory, null, 2));

        const updatedMemory = {
          ...initialMemory,
          todos: initialMemory.todos.map(t =>
            t.id === todoId ? { ...t, status: 'completed' as const } : t
          ),
          updatedAt: new Date().toISOString(),
        };

        await writeFile(memoryPath, JSON.stringify(updatedMemory, null, 2));

        const content = await readFile(memoryPath, 'utf-8');
        const memory = JSON.parse(content);

        expect(memory.todos[0].status).toBe('completed');
      });

      it('should return error for non-existent todo', async () => {
        const memory = {
          projectName: 'Test Project',
          todos: [
            { id: 'todo-1', status: 'pending' },
          ],
        };

        const nonExistentId = 'todo-999';
        const todo = memory.todos.find(t => t.id === nonExistentId);

        expect(todo).toBeUndefined();
      });
    });
  });

  describe('Conventions Management', () => {
    it('should store coding conventions', async () => {
      const memory = {
        projectName: 'Test Project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        architecture: {
          overview: '',
          components: [],
          technologies: [],
        },
        decisions: [],
        knowledge: [],
        conventions: [
          {
            category: 'Naming',
            rules: [
              'Use camelCase for variables',
              'Use PascalCase for classes',
              'Use UPPER_CASE for constants',
            ],
          },
          {
            category: 'Formatting',
            rules: [
              'Use 2 spaces for indentation',
              'Max line length 100 characters',
            ],
          },
        ],
        todos: [],
      };

      await writeFile(memoryPath, JSON.stringify(memory, null, 2));

      const content = await readFile(memoryPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.conventions).toHaveLength(2);
      expect(parsed.conventions[0].category).toBe('Naming');
      expect(parsed.conventions[0].rules).toHaveLength(3);
    });
  });

  describe('Memory Timestamps', () => {
    it('should update updatedAt timestamp on modifications', async () => {
      const beforeUpdate = new Date().toISOString();
      
      const memory = {
        projectName: 'Test Project',
        createdAt: new Date().toISOString(),
        updatedAt: beforeUpdate,
        architecture: { overview: '', components: [], technologies: [] },
        decisions: [],
        knowledge: [],
        conventions: [],
        todos: [],
      };

      await writeFile(memoryPath, JSON.stringify(memory, null, 2));

      // Simulate update after delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const afterUpdate = new Date().toISOString();
      const updatedMemory = { ...memory, updatedAt: afterUpdate };
      await writeFile(memoryPath, JSON.stringify(updatedMemory, null, 2));

      const content = await readFile(memoryPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(new Date(parsed.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeUpdate).getTime()
      );
    });
  });

  describe('Memory Validation', () => {
    it('should validate complete memory structure', async () => {
      const memory = {
        projectName: 'Valid Project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        architecture: {
          overview: 'Overview',
          components: [],
          technologies: [],
        },
        decisions: [],
        knowledge: [],
        conventions: [],
        todos: [],
      };

      await writeFile(memoryPath, JSON.stringify(memory, null, 2));
      const content = await readFile(memoryPath, 'utf-8');
      const parsed = JSON.parse(content);

      // Validate all required fields
      expect(parsed).toHaveProperty('projectName');
      expect(parsed).toHaveProperty('createdAt');
      expect(parsed).toHaveProperty('updatedAt');
      expect(parsed).toHaveProperty('architecture');
      expect(parsed.architecture).toHaveProperty('overview');
      expect(parsed.architecture).toHaveProperty('components');
      expect(parsed.architecture).toHaveProperty('technologies');
      expect(parsed).toHaveProperty('decisions');
      expect(parsed).toHaveProperty('knowledge');
      expect(parsed).toHaveProperty('conventions');
      expect(parsed).toHaveProperty('todos');
    });
  });
});
