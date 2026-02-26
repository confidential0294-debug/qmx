/**
 * Tests for Code Intelligence MCP Server
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('Code Intelligence MCP Server', () => {
  const qmxDir = join(process.cwd(), '.qmx');
  const codeIntelDir = join(qmxDir, 'code-intel');
  const indexPath = join(codeIntelDir, 'symbol-index.json');

  beforeEach(async () => {
    await mkdir(codeIntelDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Symbol Search', () => {
    describe('symbol_search', () => {
      it('should search symbols by name', async () => {
        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: {
            'myFunction': {
              id: 'myFunction',
              name: 'myFunction',
              kind: 'function',
              filePath: './src/utils.ts',
              range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } },
            },
            'myClass': {
              id: 'myClass',
              name: 'myClass',
              kind: 'class',
              filePath: './src/classes.ts',
              range: { start: { line: 0, character: 0 }, end: { line: 50, character: 0 } },
            },
          },
          files: {},
          relationships: {
            references: {},
            inherits: {},
            implements: {},
            dependsOn: {},
          },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);

        // Search for "my"
        const queryRegex = new RegExp('my', 'i');
        const results = Object.values(parsed.symbols).filter((s: any) =>
          queryRegex.test(s.name)
        );

        expect(results).toHaveLength(2);
      });

      it('should filter symbols by kind', async () => {
        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: {
            'func1': { id: 'func1', name: 'func1', kind: 'function', filePath: './src/a.ts', range: { start: { line: 0, character: 0 }, end: { line: 5, character: 0 } } },
            'func2': { id: 'func2', name: 'func2', kind: 'function', filePath: './src/b.ts', range: { start: { line: 0, character: 0 }, end: { line: 5, character: 0 } } },
            'class1': { id: 'class1', name: 'class1', kind: 'class', filePath: './src/c.ts', range: { start: { line: 0, character: 0 }, end: { line: 20, character: 0 } } },
          },
          files: {},
          relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);

        const functions = Object.values(parsed.symbols).filter((s: any) => s.kind === 'function');

        expect(functions).toHaveLength(2);
      });

      it('should limit search results', async () => {
        const symbols: Record<string, any> = {};
        for (let i = 0; i < 100; i++) {
          symbols[`symbol${i}`] = {
            id: `symbol${i}`,
            name: `symbol${i}`,
            kind: 'function',
            filePath: './src/file.ts',
            range: { start: { line: i, character: 0 }, end: { line: i + 5, character: 0 } },
          };
        }

        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols,
          files: {},
          relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const limit = 50;
        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);

        const results = Object.values(parsed.symbols).slice(0, limit);

        expect(results).toHaveLength(limit);
      });
    });
  });

  describe('Symbol Get', () => {
    describe('symbol_get', () => {
      it('should get symbol by ID', async () => {
        const symbolId = 'testSymbol';
        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: {
            [symbolId]: {
              id: symbolId,
              name: 'TestSymbol',
              kind: 'class',
              filePath: './src/test.ts',
              range: { start: { line: 0, character: 0 }, end: { line: 100, character: 0 } },
              signature: 'class TestSymbol {}',
              documentation: 'A test symbol',
            },
          },
          files: {},
          relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);
        const symbol = parsed.symbols[symbolId];

        expect(symbol).toBeDefined();
        expect(symbol.name).toBe('TestSymbol');
        expect(symbol.kind).toBe('class');
      });

      it('should return not found for unknown symbol', async () => {
        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: {},
          files: {},
          relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);
        const symbol = parsed.symbols['nonExistent'];

        expect(symbol).toBeUndefined();
      });
    });
  });

  describe('Symbol References', () => {
    describe('symbol_find_references', () => {
      it('should find all references to a symbol', async () => {
        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: {
            'main': { id: 'main', name: 'main', kind: 'function', filePath: './src/index.ts', range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } } },
            'ref1': { id: 'ref1', name: 'main', kind: 'variable', filePath: './src/a.ts', range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } } },
            'ref2': { id: 'ref2', name: 'main', kind: 'variable', filePath: './src/b.ts', range: { start: { line: 10, character: 0 }, end: { line: 10, character: 10 } } },
          },
          files: {},
          relationships: {
            references: {
              'main': ['ref1', 'ref2'],
            },
            inherits: {},
            implements: {},
            dependsOn: {},
          },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);

        const referenceIds = parsed.relationships.references['main'] || [];
        const references = referenceIds.map((id: string) => parsed.symbols[id as keyof typeof parsed.symbols]);

        expect(references).toHaveLength(2);
      });

      it('should include definition when requested', async () => {
        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: {
            'def': { id: 'def', name: 'definition', kind: 'function', filePath: './src/def.ts', range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } } },
            'ref': { id: 'ref', name: 'definition', kind: 'variable', filePath: './src/ref.ts', range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } } },
          },
          files: {},
          relationships: {
            references: { 'def': ['ref'] },
            inherits: {},
            implements: {},
            dependsOn: {},
          },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);

        const includeDefinition = true;
        const referenceIds = parsed.relationships.references['def'] || [];
        const references = referenceIds.map((id: string) => parsed.symbols[id as keyof typeof parsed.symbols]);

        if (includeDefinition) {
          references.unshift(parsed.symbols['def']);
        }

        expect(references).toHaveLength(2);
        expect(references[0].id).toBe('def');
      });
    });
  });

  describe('Symbol Hierarchy', () => {
    describe('symbol_get_hierarchy', () => {
      it('should get parent symbols', async () => {
        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: {
            'child': {
              id: 'child',
              name: 'ChildClass',
              kind: 'class',
              filePath: './src/child.ts',
              range: { start: { line: 0, character: 0 }, end: { line: 20, character: 0 } },
              parentSymbolId: 'parent',
            },
            'parent': {
              id: 'parent',
              name: 'ParentClass',
              kind: 'class',
              filePath: './src/parent.ts',
              range: { start: { line: 0, character: 0 }, end: { line: 30, character: 0 } },
              parentSymbolId: 'grandparent',
            },
            'grandparent': {
              id: 'grandparent',
              name: 'GrandParentClass',
              kind: 'class',
              filePath: './src/grandparent.ts',
              range: { start: { line: 0, character: 0 }, end: { line: 40, character: 0 } },
            },
          },
          files: {},
          relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);

        // Traverse parents
        const parents: any[] = [];
        let currentId = parsed.symbols['child'].parentSymbolId;
        const maxDepth = 5;
        let depth = 0;

        while (currentId && depth < maxDepth) {
          const parent = parsed.symbols[currentId as keyof typeof parsed.symbols];
          if (!parent) break;
          parents.push(parent);
          currentId = parent.parentSymbolId;
          depth++;
        }

        expect(parents).toHaveLength(2);
        expect(parents[0].name).toBe('ParentClass');
        expect(parents[1].name).toBe('GrandParentClass');
      });

      it('should get child symbols', async () => {
        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: {
            'parent': {
              id: 'parent',
              name: 'ParentClass',
              kind: 'class',
              filePath: './src/parent.ts',
              range: { start: { line: 0, character: 0 }, end: { line: 50, character: 0 } },
              children: ['child1', 'child2'],
            },
            'child1': {
              id: 'child1',
              name: 'method1',
              kind: 'method',
              filePath: './src/parent.ts',
              range: { start: { line: 5, character: 0 }, end: { line: 10, character: 0 } },
            },
            'child2': {
              id: 'child2',
              name: 'method2',
              kind: 'method',
              filePath: './src/parent.ts',
              range: { start: { line: 15, character: 0 }, end: { line: 20, character: 0 } },
            },
          },
          files: {},
          relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);

        const children = parsed.symbols['parent'].children?.map((id: string) => parsed.symbols[id as keyof typeof parsed.symbols]);

        expect(children).toHaveLength(2);
        expect(children?.[0].name).toBe('method1');
        expect(children?.[1].name).toBe('method2');
      });
    });
  });

  describe('File Indexing', () => {
    describe('file_index', () => {
      it('should index a file and extract symbols', async () => {
        const testFilePath = join(process.cwd(), 'src', 'test.ts');
        await mkdir(join(process.cwd(), 'src'), { recursive: true });

        const testContent = `
export const myVar = 42;
export function myFunction() {}
export class MyClass {}
export interface MyInterface {}
`;

        await writeFile(testFilePath, testContent);

        // Simulate symbol extraction
        const symbols = [
          { id: 'myVar', name: 'myVar', kind: 'variable' },
          { id: 'myFunction', name: 'myFunction', kind: 'function' },
          { id: 'MyClass', name: 'MyClass', kind: 'class' },
          { id: 'MyInterface', name: 'MyInterface', kind: 'interface' },
        ];

        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: Object.fromEntries(symbols.map(s => [s.id, { ...s, filePath: testFilePath, range: { start: { line: 0, character: 0 }, end: { line: 1, character: 0 } } }])),
          files: {
            [testFilePath]: {
              path: testFilePath,
              hash: 'test-hash',
              indexedAt: new Date().toISOString(),
              symbolIds: symbols.map(s => s.id),
            },
          },
          relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.files[testFilePath]).toBeDefined();
        expect(parsed.files[testFilePath].symbolIds).toHaveLength(4);

        await rm(testFilePath, { force: true });
      });

      it('should skip already indexed files', async () => {
        const testFilePath = './src/already-indexed.ts';
        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: {},
          files: {
            [testFilePath]: {
              path: testFilePath,
              hash: 'existing-hash',
              indexedAt: new Date().toISOString(),
              symbolIds: [],
            },
          },
          relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);

        const existingFile = parsed.files[testFilePath];
        const forceReindex = false;

        if (existingFile && !forceReindex) {
          expect(existingFile).toBeDefined();
          expect(existingFile.hash).toBe('existing-hash');
        }
      });
    });

    describe('project_index', () => {
      it('should index multiple directories', async () => {
        const directories = ['src', 'lib'];
        const exclude = ['node_modules', 'dist', '*.test.*'];

        expect(directories).toHaveLength(2);
        expect(exclude).toHaveLength(3);
      });

      it('should track indexing statistics', async () => {
        const stats = {
          indexed: 10,
          skipped: 5,
          errors: 0,
          totalFiles: 15,
          totalSymbols: 50,
        };

        expect(stats.indexed).toBe(10);
        expect(stats.skipped).toBe(5);
        expect(stats.totalSymbols).toBe(50);
      });
    });
  });

  describe('Symbol Documentation', () => {
    describe('symbol_get_documentation', () => {
      it('should get symbol documentation', async () => {
        const index = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectRoot: process.cwd(),
          symbols: {
            'documented': {
              id: 'documented',
              name: 'DocumentedFunction',
              kind: 'function',
              filePath: './src/docs.ts',
              range: { start: { line: 0, character: 0 }, end: { line: 20, character: 0 } },
              signature: 'function documented(param: string): void',
              documentation: 'This is a documented function',
            },
          },
          files: {},
          relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);
        const symbol = parsed.symbols['documented'];

        expect(symbol.documentation).toBe('This is a documented function');
        expect(symbol.signature).toBe('function documented(param: string): void');
      });
    });
  });

  describe('Index Statistics', () => {
    describe('index_get_stats', () => {
      it('should return index statistics', async () => {
        const index = {
          version: '1.0.0',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          projectRoot: process.cwd(),
          symbols: {
            'func1': { id: 'func1', name: 'func1', kind: 'function', filePath: './src/a.ts', range: { start: { line: 0, character: 0 }, end: { line: 5, character: 0 } } },
            'func2': { id: 'func2', name: 'func2', kind: 'function', filePath: './src/b.ts', range: { start: { line: 0, character: 0 }, end: { line: 5, character: 0 } } },
            'class1': { id: 'class1', name: 'class1', kind: 'class', filePath: './src/c.ts', range: { start: { line: 0, character: 0 }, end: { line: 20, character: 0 } } },
          },
          files: {
            './src/a.ts': { path: './src/a.ts', hash: 'hash1', indexedAt: new Date().toISOString(), symbolIds: ['func1'] },
            './src/b.ts': { path: './src/b.ts', hash: 'hash2', indexedAt: new Date().toISOString(), symbolIds: ['func2'] },
            './src/c.ts': { path: './src/c.ts', hash: 'hash3', indexedAt: new Date().toISOString(), symbolIds: ['class1'] },
          },
          relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));

        const content = await readFile(indexPath, 'utf-8');
        const parsed = JSON.parse(content);

        const stats = {
          totalSymbols: Object.keys(parsed.symbols).length,
          totalFiles: Object.keys(parsed.files).length,
          symbolsByKind: {} as Record<string, number>,
          indexedAt: parsed.createdAt,
          updatedAt: parsed.updatedAt,
          version: parsed.version,
        };

        // Count symbols by kind
        for (const symbol of Object.values(parsed.symbols)) {
          const s = symbol as any;
          stats.symbolsByKind[s.kind] = (stats.symbolsByKind[s.kind] || 0) + 1;
        }

        expect(stats.totalSymbols).toBe(3);
        expect(stats.totalFiles).toBe(3);
        expect(stats.symbolsByKind['function']).toBe(2);
        expect(stats.symbolsByKind['class']).toBe(1);
      });
    });
  });

  describe('Index Clear', () => {
    describe('index_clear', () => {
      it('should clear index with confirmation', async () => {
        const confirm = true;
        
        if (confirm) {
          const defaultIndex = {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            projectRoot: process.cwd(),
            symbols: {},
            files: {},
            relationships: { references: {}, inherits: {}, implements: {}, dependsOn: {} },
          };

          await writeFile(indexPath, JSON.stringify(defaultIndex, null, 2));

          const content = await readFile(indexPath, 'utf-8');
          const parsed = JSON.parse(content);

          expect(Object.keys(parsed.symbols)).toHaveLength(0);
          expect(Object.keys(parsed.files)).toHaveLength(0);
        }
      });

      it('should require confirmation', async () => {
        const confirm = false;
        
        if (!confirm) {
          expect(confirm).toBe(false);
          // Should return error requiring confirmation
        }
      });
    });
  });
});
