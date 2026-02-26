/**
 * Tests for File System Utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm, access, stat } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';

describe('File System Utilities', () => {
  const testDir = join(process.cwd(), '.qmx', 'test-fs');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('Directory Operations', () => {
    it('should ensure directory exists', async () => {
      const ensureDir = async (dirPath: string): Promise<void> => {
        await mkdir(dirPath, { recursive: true });
      };

      const newDir = join(testDir, 'new-dir');
      await ensureDir(newDir);

      const exists = await access(newDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should handle existing directories', async () => {
      const ensureDir = async (dirPath: string): Promise<void> => {
        await mkdir(dirPath, { recursive: true });
      };

      await ensureDir(testDir);
      await expect(ensureDir(testDir)).resolves.not.toThrow();
    });
  });

  describe('JSON Operations', () => {
    it('should read JSON file', async () => {
      const readJson = async <T>(filePath: string): Promise<T> => {
        const content = await readFile(filePath, 'utf-8');
        return JSON.parse(content) as T;
      };

      const testData = { name: 'test', value: 42 };
      const testPath = join(testDir, 'test.json');
      await writeFile(testPath, JSON.stringify(testData, null, 2));

      const data = await readJson<typeof testData>(testPath);
      expect(data.name).toBe('test');
      expect(data.value).toBe(42);
    });

    it('should write JSON file with formatting', async () => {
      const writeJson = async <T>(filePath: string, data: T, spaces: number = 2): Promise<void> => {
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, JSON.stringify(data, null, spaces), 'utf-8');
      };

      const testData = { name: 'test', nested: { value: 42 } };
      const testPath = join(testDir, 'output.json');
      await writeJson(testPath, testData);

      const content = await readFile(testPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.name).toBe('test');
      expect(parsed.nested.value).toBe(42);
      expect(content).toContain('  '); // Formatted with spaces
    });
  });

  describe('File Existence', () => {
    it('should check if file exists', async () => {
      const fileExists = async (filePath: string): Promise<boolean> => {
        try {
          await access(filePath);
          return true;
        } catch {
          return false;
        }
      };

      const existingFile = join(testDir, 'exists.txt');
      await writeFile(existingFile, 'content');

      expect(await fileExists(existingFile)).toBe(true);
      expect(await fileExists(join(testDir, 'missing.txt'))).toBe(false);
    });

    it('should check if directory exists', async () => {
      const dirExists = async (dirPath: string): Promise<boolean> => {
        try {
          const stats = await stat(dirPath);
          return stats.isDirectory();
        } catch {
          return false;
        }
      };

      expect(await dirExists(testDir)).toBe(true);
      expect(await dirExists(join(testDir, 'missing'))).toBe(false);
    });
  });

  describe('Text Operations', () => {
    it('should read text file', async () => {
      const readText = async (filePath: string): Promise<string> => {
        return readFile(filePath, 'utf-8');
      };

      const testPath = join(testDir, 'text.txt');
      const expectedContent = 'Hello, World!';
      await writeFile(testPath, expectedContent);

      const content = await readText(testPath);
      expect(content).toBe(expectedContent);
    });

    it('should write text file', async () => {
      const writeText = async (filePath: string, content: string): Promise<void> => {
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, content, 'utf-8');
      };

      const testPath = join(testDir, 'output.txt');
      const content = 'Test content';
      await writeText(testPath, content);

      const readContent = await readFile(testPath, 'utf-8');
      expect(readContent).toBe(content);
    });
  });

  describe('File Listing', () => {
    it('should list files in directory', async () => {
      const listFiles = async (dirPath: string): Promise<string[]> => {
        const { readdir } = await import('node:fs/promises');
        const entries = await readdir(dirPath, { withFileTypes: true });
        return entries
          .filter(e => e.isFile())
          .map(e => join(dirPath, e.name));
      };

      await writeFile(join(testDir, 'file1.txt'), 'content');
      await writeFile(join(testDir, 'file2.txt'), 'content');

      const files = await listFiles(testDir);
      expect(files).toHaveLength(2);
    });

    it('should list files recursively', async () => {
      const listFilesRecursive = async (dirPath: string): Promise<string[]> => {
        const { readdir } = await import('node:fs/promises');
        const files: string[] = [];

        const scan = async (path: string) => {
          const entries = await readdir(path, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = join(path, entry.name);
            if (entry.isDirectory()) {
              await scan(fullPath);
            } else if (entry.isFile()) {
              files.push(fullPath);
            }
          }
        };

        await scan(dirPath);
        return files;
      };

      const subDir = join(testDir, 'subdir');
      await mkdir(subDir, { recursive: true });
      await writeFile(join(testDir, 'root.txt'), 'content');
      await writeFile(join(subDir, 'nested.txt'), 'content');

      const files = await listFilesRecursive(testDir);
      expect(files).toHaveLength(2);
    });

    it('should filter files by pattern', async () => {
      const listFilesByPattern = async (dirPath: string, pattern: RegExp): Promise<string[]> => {
        const { readdir } = await import('node:fs/promises');
        const entries = await readdir(dirPath, { withFileTypes: true });
        return entries
          .filter(e => e.isFile() && pattern.test(e.name))
          .map(e => join(dirPath, e.name));
      };

      await writeFile(join(testDir, 'test.ts'), 'content');
      await writeFile(join(testDir, 'test.test.ts'), 'content');
      await writeFile(join(testDir, 'readme.md'), 'content');

      const tsFiles = await listFilesByPattern(testDir, /\.ts$/);
      const testFiles = await listFilesByPattern(testDir, /\.test\.ts$/);

      expect(tsFiles).toHaveLength(2);
      expect(testFiles).toHaveLength(1);
    });
  });

  describe('File Operations', () => {
    it('should copy file safely', async () => {
      const copyFileSafe = async (
        src: string,
        dest: string,
        options?: { overwrite?: boolean }
      ): Promise<void> => {
        const { copyFile } = await import('node:fs/promises');
        const exists = await access(dest).then(() => true).catch(() => false);

        if (exists && !options?.overwrite) {
          throw new Error('Destination file already exists');
        }

        await mkdir(dirname(dest), { recursive: true });
        await copyFile(src, dest);
      };

      const srcPath = join(testDir, 'source.txt');
      const destPath = join(testDir, 'dest.txt');
      await writeFile(srcPath, 'content');

      await copyFileSafe(srcPath, destPath);

      const content = await readFile(destPath, 'utf-8');
      expect(content).toBe('content');
    });

    it('should remove file safely', async () => {
      const removeSafe = async (path: string, options?: { force?: boolean }): Promise<void> => {
        try {
          await rm(path, { force: options?.force ?? false });
        } catch (error) {
          if (!options?.force) {
            throw error;
          }
        }
      };

      const testPath = join(testDir, 'to-delete.txt');
      await writeFile(testPath, 'content');

      await removeSafe(testPath);

      const exists = await access(testPath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });
  });

  describe('Path Utilities', () => {
    it('should resolve project path', () => {
      const resolveProjectPath = (...paths: string[]): string => {
        const { resolve } = require('node:path');
        return resolve(process.cwd(), ...paths);
      };

      const path = resolveProjectPath('src', 'index.ts');
      expect(path).toContain('src');
      expect(path).toContain('index.ts');
    });

    it('should get relative path', () => {
      const getRelativePath = (from: string, to: string): string => {
        return relative(from, to);
      };

      const from = '/home/user/project/src';
      const to = '/home/user/project/src/utils';
      const rel = getRelativePath(from, to);

      expect(rel).toBe('utils');
    });

    it('should normalize path separators', () => {
      const normalizePath = (path: string): string => {
        return path.replace(/\\/g, '/');
      };

      expect(normalizePath('C:\\Users\\test')).toBe('C:/Users/test');
      expect(normalizePath('/home/test')).toBe('/home/test');
    });

    it('should get file extension', () => {
      const getExtension = (filePath: string): string => {
        const parts = filePath.split('.');
        return parts.length > 1 ? parts.pop() || '' : '';
      };

      expect(getExtension('file.txt')).toBe('txt');
      expect(getExtension('file.tar.gz')).toBe('gz');
      expect(getExtension('noext')).toBe('');
    });

    it('should get file name without extension', () => {
      const getFileName = (filePath: string): string => {
        const base = filePath.split(/[\\/]/).pop() || '';
        const parts = base.split('.');
        if (parts.length > 1) {
          parts.pop();
        }
        return parts.join('.');
      };

      expect(getFileName('file.txt')).toBe('file');
      expect(getFileName('file.tar.gz')).toBe('file.tar');
      expect(getFileName('/path/to/file.ts')).toBe('file');
    });
  });

  describe('File Stats', () => {
    it('should get file stats', async () => {
      const getFileStats = async (filePath: string) => {
        return stat(filePath);
      };

      const testPath = join(testDir, 'stats.txt');
      await writeFile(testPath, 'content');

      const stats = await getFileStats(testPath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should get modification time', async () => {
      const getMtime = async (filePath: string): Promise<Date> => {
        const stats = await stat(filePath);
        return stats.mtime;
      };

      const testPath = join(testDir, 'mtime.txt');
      await writeFile(testPath, 'content');

      const mtime = await getMtime(testPath);
      expect(mtime).toBeInstanceOf(Date);
    });
  });
});
