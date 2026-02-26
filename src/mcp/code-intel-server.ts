/**
 * QMX Code Intelligence MCP Server
 *
 * Provides symbol tracking, code navigation, and LSP-like functionality.
 * Implements the Model Context Protocol for standardized communication.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import lockfile from 'proper-lockfile';
import { z } from 'zod';

// Schema definitions
const SymbolKind = z.enum([
  'file',
  'module',
  'namespace',
  'package',
  'class',
  'method',
  'property',
  'field',
  'constructor',
  'enum',
  'interface',
  'function',
  'variable',
  'constant',
  'string',
  'number',
  'boolean',
  'array',
  'object',
  'key',
  'null',
  'enumMember',
  'struct',
  'event',
  'operator',
  'typeParameter',
]);

const SymbolSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: SymbolKind,
  filePath: z.string(),
  range: z.object({
    start: z.object({ line: z.number(), character: z.number() }),
    end: z.object({ line: z.number(), character: z.number() }),
  }),
  signature: z.string().optional(),
  documentation: z.string().optional(),
  modifiers: z.array(z.string()).optional(),
  parentSymbolId: z.string().optional(),
  children: z.array(z.string()).optional(),
  references: z.array(z.string()).optional(),
  definitions: z.array(z.string()).optional(),
  implementations: z.array(z.string()).optional(),
  typeDefinitions: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const SymbolIndexSchema = z.object({
  version: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  projectRoot: z.string(),
  symbols: z.record(z.string(), SymbolSchema),
  files: z.record(z.string(), z.object({
    path: z.string(),
    hash: z.string(),
    indexedAt: z.string(),
    symbolIds: z.array(z.string()),
  })),
  relationships: z.object({
    references: z.record(z.string(), z.array(z.string())),
    inherits: z.record(z.string(), z.array(z.string())),
    implements: z.record(z.string(), z.array(z.string())),
    dependsOn: z.record(z.string(), z.array(z.string())),
  }),
});

type Symbol = z.infer<typeof SymbolSchema>;
type SymbolIndex = z.infer<typeof SymbolIndexSchema>;

// Index path
const QMX_DIR = join(process.cwd(), '.qmx');
const CODE_INTEL_DIR = join(QMX_DIR, 'code-intel');
const INDEX_PATH = join(CODE_INTEL_DIR, 'symbol-index.json');

// Server instance
export const server = new Server(
  {
    name: 'qmx-code-intel-server',
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
        name: 'symbol_search',
        description: 'Search for symbols by name or pattern',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query (supports regex)' },
            kind: { type: 'string', description: 'Filter by symbol kind' },
            filePath: { type: 'string', description: 'Filter by file path' },
            limit: { type: 'number', description: 'Maximum results to return', default: 50 },
          },
          required: ['query'],
        },
      },
      {
        name: 'symbol_get',
        description: 'Get detailed information about a symbol',
        inputSchema: {
          type: 'object',
          properties: {
            symbolId: { type: 'string', description: 'Unique symbol identifier' },
          },
          required: ['symbolId'],
        },
      },
      {
        name: 'symbol_find_references',
        description: 'Find all references to a symbol',
        inputSchema: {
          type: 'object',
          properties: {
            symbolId: { type: 'string', description: 'Symbol to find references for' },
            includeDefinition: { type: 'boolean', description: 'Include the definition', default: false },
          },
          required: ['symbolId'],
        },
      },
      {
        name: 'symbol_find_definitions',
        description: 'Find all definitions of a symbol',
        inputSchema: {
          type: 'object',
          properties: {
            symbolId: { type: 'string', description: 'Symbol to find definitions for' },
          },
          required: ['symbolId'],
        },
      },
      {
        name: 'symbol_get_hierarchy',
        description: 'Get symbol hierarchy (parents and children)',
        inputSchema: {
          type: 'object',
          properties: {
            symbolId: { type: 'string', description: 'Symbol to get hierarchy for' },
            direction: {
              type: 'string',
              enum: ['parents', 'children', 'both'],
              description: 'Direction of hierarchy',
            },
            depth: { type: 'number', description: 'Maximum depth to traverse', default: 5 },
          },
          required: ['symbolId'],
        },
      },
      {
        name: 'symbol_get_implementations',
        description: 'Find all implementations of an interface or abstract class',
        inputSchema: {
          type: 'object',
          properties: {
            symbolId: { type: 'string', description: 'Interface or abstract class symbol' },
          },
          required: ['symbolId'],
        },
      },
      {
        name: 'file_get_symbols',
        description: 'Get all symbols in a file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path to the file' },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'file_index',
        description: 'Index a file for symbol tracking',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path to the file to index' },
            force: { type: 'boolean', description: 'Force reindexing', default: false },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'project_index',
        description: 'Index entire project or specific directories',
        inputSchema: {
          type: 'object',
          properties: {
            directories: {
              type: 'array',
              items: { type: 'string' },
              description: 'Directories to index (defaults to src/)',
            },
            exclude: {
              type: 'array',
              items: { type: 'string' },
              description: 'Patterns to exclude',
            },
            force: { type: 'boolean', description: 'Force reindexing', default: false },
          },
        },
      },
      {
        name: 'symbol_get_type_definition',
        description: 'Get type definition for a symbol',
        inputSchema: {
          type: 'object',
          properties: {
            symbolId: { type: 'string', description: 'Symbol to get type for' },
          },
          required: ['symbolId'],
        },
      },
      {
        name: 'symbol_get_documentation',
        description: 'Get documentation for a symbol',
        inputSchema: {
          type: 'object',
          properties: {
            symbolId: { type: 'string', description: 'Symbol to get documentation for' },
            includeExamples: { type: 'boolean', description: 'Include code examples', default: true },
          },
          required: ['symbolId'],
        },
      },
      {
        name: 'symbol_analyze_dependencies',
        description: 'Analyze dependencies of a symbol',
        inputSchema: {
          type: 'object',
          properties: {
            symbolId: { type: 'string', description: 'Symbol to analyze' },
            includeTransitive: { type: 'boolean', description: 'Include transitive dependencies', default: false },
          },
          required: ['symbolId'],
        },
      },
      {
        name: 'index_get_stats',
        description: 'Get index statistics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'index_clear',
        description: 'Clear the symbol index',
        inputSchema: {
          type: 'object',
          properties: {
            confirm: { type: 'boolean', description: 'Confirmation flag' },
          },
          required: ['confirm'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'symbol_search':
        return await handleSymbolSearch(args as any);
      case 'symbol_get':
        return await handleSymbolGet(args as any);
      case 'symbol_find_references':
        return await handleSymbolFindReferences(args as any);
      case 'symbol_find_definitions':
        return await handleSymbolFindDefinitions(args as any);
      case 'symbol_get_hierarchy':
        return await handleSymbolGetHierarchy(args as any);
      case 'symbol_get_implementations':
        return await handleSymbolGetImplementations(args as any);
      case 'file_get_symbols':
        return await handleFileGetSymbols(args as any);
      case 'file_index':
        return await handleFileIndex(args as any);
      case 'project_index':
        return await handleProjectIndex(args as any);
      case 'symbol_get_type_definition':
        return await handleSymbolGetTypeDefinition(args as any);
      case 'symbol_get_documentation':
        return await handleSymbolGetDocumentation(args as any);
      case 'symbol_analyze_dependencies':
        return await handleSymbolAnalyzeDependencies(args as any);
      case 'index_get_stats':
        return await handleIndexGetStats();
      case 'index_clear':
        return await handleIndexClear(args as any);
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

async function handleSymbolSearch(args: {
  query: string;
  kind?: string;
  filePath?: string;
  limit?: number;
}) {
  const index = await readIndex();
  const queryRegex = new RegExp(args.query, 'i');
  const limit = args.limit || 50;

  const results: Symbol[] = [];

  for (const symbol of Object.values(index.symbols)) {
    // Filter by query
    if (!queryRegex.test(symbol.name)) {
      continue;
    }

    // Filter by kind
    if (args.kind && symbol.kind !== args.kind) {
      continue;
    }

    // Filter by file path
    if (args.filePath && !symbol.filePath.includes(args.filePath)) {
      continue;
    }

    results.push(symbol);

    if (results.length >= limit) {
      break;
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ results, total: results.length }, null, 2) }],
  };
}

async function handleSymbolGet(args: { symbolId: string }) {
  const index = await readIndex();
  const symbol = index.symbols[args.symbolId];

  if (!symbol) {
    return {
      content: [{ type: 'text', text: 'Symbol not found' }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(symbol, null, 2) }],
  };
}

async function handleSymbolFindReferences(args: {
  symbolId: string;
  includeDefinition?: boolean;
}) {
  const index = await readIndex();
  const symbol = index.symbols[args.symbolId];

  if (!symbol) {
    return {
      content: [{ type: 'text', text: 'Symbol not found' }],
      isError: true,
    };
  }

  const referenceIds = index.relationships.references[args.symbolId] || [];
  const references = referenceIds
    .map(id => index.symbols[id])
    .filter(Boolean);

  if (args.includeDefinition) {
    references.unshift(symbol);
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ symbolId: args.symbolId, references }, null, 2) }],
  };
}

async function handleSymbolFindDefinitions(args: { symbolId: string }) {
  const index = await readIndex();
  const symbol = index.symbols[args.symbolId];

  if (!symbol) {
    return {
      content: [{ type: 'text', text: 'Symbol not found' }],
      isError: true,
    };
  }

  const definitionIds = symbol.definitions || [args.symbolId];
  const definitions = definitionIds
    .map(id => index.symbols[id])
    .filter(Boolean);

  return {
    content: [{ type: 'text', text: JSON.stringify({ symbolId: args.symbolId, definitions }, null, 2) }],
  };
}

async function handleSymbolGetHierarchy(args: {
  symbolId: string;
  direction?: 'parents' | 'children' | 'both';
  depth?: number;
}) {
  const index = await readIndex();
  const symbol = index.symbols[args.symbolId];

  if (!symbol) {
    return {
      content: [{ type: 'text', text: 'Symbol not found' }],
      isError: true,
    };
  }

  const direction = args.direction || 'both';
  const maxDepth = args.depth || 5;

  const result: { parents: Symbol[]; children: Symbol[] } = {
    parents: [],
    children: [],
  };

  // Get parents
  if (direction === 'parents' || direction === 'both') {
    let currentId: string | undefined = symbol.parentSymbolId;
    let depth = 0;

    while (currentId && depth < maxDepth) {
      const parent = index.symbols[currentId];
      if (!parent) break;

      result.parents.push(parent);
      currentId = parent.parentSymbolId;
      depth++;
    }
  }

  // Get children
  if (direction === 'children' || direction === 'both') {
    const collectChildren = (symbolId: string, depth: number) => {
      if (depth >= maxDepth) return;

      const sym = index.symbols[symbolId];
      if (!sym || !sym.children) return;

      for (const childId of sym.children) {
        const child = index.symbols[childId];
        if (child) {
          result.children.push(child);
          collectChildren(childId, depth + 1);
        }
      }
    };

    collectChildren(args.symbolId, 0);
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}

async function handleSymbolGetImplementations(args: { symbolId: string }) {
  const index = await readIndex();
  const symbol = index.symbols[args.symbolId];

  if (!symbol) {
    return {
      content: [{ type: 'text', text: 'Symbol not found' }],
      isError: true,
    };
  }

  const implementationIds = symbol.implementations || [];
  const implementations = implementationIds
    .map(id => index.symbols[id])
    .filter(Boolean);

  return {
    content: [{ type: 'text', text: JSON.stringify({ symbolId: args.symbolId, implementations }, null, 2) }],
  };
}

async function handleFileGetSymbols(args: { filePath: string }) {
  const index = await readIndex();
  const fileInfo = index.files[args.filePath];

  if (!fileInfo) {
    return {
      content: [{ type: 'text', text: 'File not indexed. Run file_index first.' }],
      isError: true,
    };
  }

  const symbols = fileInfo.symbolIds
    .map(id => index.symbols[id])
    .filter(Boolean);

  return {
    content: [{ type: 'text', text: JSON.stringify({ filePath: args.filePath, symbols }, null, 2) }],
  };
}

async function handleFileIndex(args: { filePath: string; force?: boolean }) {
  const release = await lockfile.lock(INDEX_PATH, { retries: 3 });
  try {
    const index = await readIndex();

    // Check if already indexed
    const existingFile = index.files[args.filePath];
    if (existingFile && !args.force) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ status: 'already_indexed', file: existingFile }, null, 2) }],
      };
    }

    // Read and parse file for symbols
    const content = await readFile(args.filePath, 'utf-8');
    const symbols = await extractSymbols(args.filePath, content);

    // Update index
    const now = new Date().toISOString();
    const fileHash = await hashContent(content);

    index.files[args.filePath] = {
      path: args.filePath,
      hash: fileHash,
      indexedAt: now,
      symbolIds: symbols.map(s => s.id),
    };

    for (const symbol of symbols) {
      index.symbols[symbol.id] = symbol;
    }

    index.updatedAt = now;
    await writeIndex(index);

    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'indexed', symbols: symbols.length }, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleProjectIndex(args: {
  directories?: string[];
  exclude?: string[];
  force?: boolean;
}) {
  const release = await lockfile.lock(INDEX_PATH, { retries: 3 });
  try {
    const index = await readIndex();
    const directories = args.directories || ['src'];
    const exclude = args.exclude || ['node_modules', 'dist', '.git', '*.test.*', '*.spec.*'];
    const force = args.force || false;

    const filesToIndex: string[] = [];

    for (const dir of directories) {
      const dirFiles = await collectFiles(dir, exclude);
      filesToIndex.push(...dirFiles);
    }

    let indexed = 0;
    let skipped = 0;
    let errors = 0;

    for (const filePath of filesToIndex) {
      try {
        const existingFile = index.files[filePath];
        if (existingFile && !force) {
          skipped++;
          continue;
        }

        const content = await readFile(filePath, 'utf-8');
        const symbols = await extractSymbols(filePath, content);

        const now = new Date().toISOString();
        const fileHash = await hashContent(content);

        index.files[filePath] = {
          path: filePath,
          hash: fileHash,
          indexedAt: now,
          symbolIds: symbols.map(s => s.id),
        };

        for (const symbol of symbols) {
          index.symbols[symbol.id] = symbol;
        }

        indexed++;
      } catch (error) {
        errors++;
        console.error(`Failed to index ${filePath}:`, error);
      }
    }

    index.updatedAt = new Date().toISOString();
    await writeIndex(index);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'completed',
              indexed,
              skipped,
              errors,
              totalFiles: Object.keys(index.files).length,
              totalSymbols: Object.keys(index.symbols).length,
            },
            null,
            2
          ),
        },
      ],
    };
  } finally {
    await release();
  }
}

async function handleSymbolGetTypeDefinition(args: { symbolId: string }) {
  const index = await readIndex();
  const symbol = index.symbols[args.symbolId];

  if (!symbol) {
    return {
      content: [{ type: 'text', text: 'Symbol not found' }],
      isError: true,
    };
  }

  const typeDefIds = symbol.typeDefinitions || [];
  const typeDefinitions = typeDefIds
    .map(id => index.symbols[id])
    .filter(Boolean);

  return {
    content: [{ type: 'text', text: JSON.stringify({ symbolId: args.symbolId, typeDefinitions }, null, 2) }],
  };
}

async function handleSymbolGetDocumentation(args: {
  symbolId: string;
  includeExamples?: boolean;
}) {
  const index = await readIndex();
  const symbol = index.symbols[args.symbolId];

  if (!symbol) {
    return {
      content: [{ type: 'text', text: 'Symbol not found' }],
      isError: true,
    };
  }

  const documentation = {
    symbolId: args.symbolId,
    name: symbol.name,
    kind: symbol.kind,
    signature: symbol.signature || '',
    documentation: symbol.documentation || '',
    modifiers: symbol.modifiers || [],
  };

  if (args.includeExamples) {
    try {
      const content = await readFile(symbol.filePath, 'utf-8');
      const lines = content.split('\n');
      const startLine = Math.max(0, symbol.range.start.line - 2);
      const endLine = Math.min(lines.length, symbol.range.end.line + 5);
      const example = lines.slice(startLine, endLine).join('\n');
      (documentation as any).example = example;
    } catch {
      // Ignore if can't read file
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(documentation, null, 2) }],
  };
}

async function handleSymbolAnalyzeDependencies(args: {
  symbolId: string;
  includeTransitive?: boolean;
}) {
  const index = await readIndex();
  const symbol = index.symbols[args.symbolId];

  if (!symbol) {
    return {
      content: [{ type: 'text', text: 'Symbol not found' }],
      isError: true,
    };
  }

  const directDeps = index.relationships.dependsOn[args.symbolId] || [];
  const dependencies: { direct: Symbol[]; transitive: Symbol[] } = {
    direct: [],
    transitive: [],
  };

  // Get direct dependencies
  for (const depId of directDeps) {
    const dep = index.symbols[depId];
    if (dep) {
      dependencies.direct.push(dep);
    }
  }

  // Get transitive dependencies
  if (args.includeTransitive) {
    const visited = new Set<string>([args.symbolId, ...directDeps]);
    const queue = [...directDeps];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const transitiveDeps = index.relationships.dependsOn[currentId] || [];

      for (const depId of transitiveDeps) {
        if (!visited.has(depId)) {
          visited.add(depId);
          queue.push(depId);
          const dep = index.symbols[depId];
          if (dep) {
            dependencies.transitive.push(dep);
          }
        }
      }
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(dependencies, null, 2) }],
  };
}

async function handleIndexGetStats() {
  const index = await readIndex();

  const stats = {
    totalSymbols: Object.keys(index.symbols).length,
    totalFiles: Object.keys(index.files).length,
    symbolsByKind: {} as Record<string, number>,
    indexedAt: index.createdAt,
    updatedAt: index.updatedAt,
    version: index.version,
  };

  // Count symbols by kind
  for (const symbol of Object.values(index.symbols)) {
    stats.symbolsByKind[symbol.kind] = (stats.symbolsByKind[symbol.kind] || 0) + 1;
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
  };
}

async function handleIndexClear(args: { confirm: boolean }) {
  if (!args.confirm) {
    return {
      content: [{ type: 'text', text: 'Confirmation required. Set confirm: true to clear index.' }],
      isError: true,
    };
  }

  const defaultIndex = await createDefaultIndex();
  await writeIndex(defaultIndex);

  return {
    content: [{ type: 'text', text: 'Index cleared successfully' }],
  };
}

// Utility functions

async function readIndex(): Promise<SymbolIndex> {
  try {
    const content = await readFile(INDEX_PATH, 'utf-8');
    return JSON.parse(content) as SymbolIndex;
  } catch {
    const defaultIndex = await createDefaultIndex();
    await writeIndex(defaultIndex);
    return defaultIndex;
  }
}

async function writeIndex(index: SymbolIndex) {
  await mkdir(CODE_INTEL_DIR, { recursive: true });
  await writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
}

async function createDefaultIndex(): Promise<SymbolIndex> {
  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    projectRoot: process.cwd(),
    symbols: {},
    files: {},
    relationships: {
      references: {},
      inherits: {},
      implements: {},
      dependsOn: {},
    },
  };
}

// Symbol pattern type for extraction
type SymbolKindType = z.infer<typeof SymbolKind>;

interface SymbolPattern {
  regex: RegExp;
  kind: SymbolKindType;
}

async function extractSymbols(filePath: string, content: string): Promise<Symbol[]> {
  const symbols: Symbol[] = [];
  const ext = extname(filePath).toLowerCase();
  const fileName = filePath.split(/[\\/]/).pop() || '';
  const baseId = `${fileName}-${Date.now()}`;

  // Simple regex-based symbol extraction
  // In production, this would use a proper parser for each language

  const patterns: Record<string, SymbolPattern[]> = {
    '.ts': [
      { regex: /export\s+(?:const|let|var)\s+(\w+)/g, kind: 'variable' },
      { regex: /export\s+function\s+(\w+)/g, kind: 'function' },
      { regex: /export\s+class\s+(\w+)/g, kind: 'class' },
      { regex: /export\s+interface\s+(\w+)/g, kind: 'interface' },
      { regex: /export\s+enum\s+(\w+)/g, kind: 'enum' },
      { regex: /export\s+type\s+(\w+)/g, kind: 'typeParameter' },
    ],
    '.js': [
      { regex: /(?:const|let|var)\s+(\w+)\s*=/g, kind: 'variable' },
      { regex: /function\s+(\w+)/g, kind: 'function' },
      { regex: /class\s+(\w+)/g, kind: 'class' },
      { regex: /module\.exports\s*=\s*(\w+)/g, kind: 'variable' },
    ],
    '.py': [
      { regex: /def\s+(\w+)/g, kind: 'function' },
      { regex: /class\s+(\w+)/g, kind: 'class' },
    ],
  };

  const filePatterns = patterns[ext] || patterns['.js'];
  const lines = content.split('\n');

  for (const { regex, kind } of filePatterns) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const name = match[1];
      const matchIndex = match.index;

      // Calculate line and character position
      let line = 0;
      let character = 0;
      let pos = 0;

      for (let i = 0; i < lines.length; i++) {
        if (pos + lines[i].length >= matchIndex) {
          line = i;
          character = matchIndex - pos;
          break;
        }
        pos += lines[i].length + 1; // +1 for newline
      }

      const symbolId = `${baseId}-${kind}-${name}-${line}`;
      symbols.push({
        id: symbolId,
        name: name,
        kind: kind,
        filePath: filePath,
        range: {
          start: { line: line, character: character },
          end: { line: line, character: character + name.length },
        },
        signature: match[0],
      });
    }
  }

  return symbols;
}

async function collectFiles(dir: string, exclude: string[]): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(process.cwd(), fullPath);

      // Check exclusions
      const shouldExclude = exclude.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(relativePath);
        }
        return relativePath.includes(pattern);
      });

      if (shouldExclude) continue;

      if (entry.isDirectory()) {
        const subFiles = await collectFiles(fullPath, exclude);
        files.push(...subFiles);
      } else if (entry.isFile() && /\.(ts|js|tsx|jsx|py)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist
  }

  return files;
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Start server
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('QMX Code Intelligence MCP Server running');
}

main().catch(console.error);

// Export types for index.ts
export type { Symbol, SymbolIndex };
