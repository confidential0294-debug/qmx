/**
 * Tests for Path Utilities
 */

import { describe, it, expect } from 'vitest';
import { join, resolve, normalize, relative, dirname, basename, extname, isAbsolute } from 'node:path';

describe('Path Utilities', () => {
  describe('Path Joining', () => {
    it('should join path segments', () => {
      const result = join('src', 'utils', 'index.ts');
      expect(result).toContain('src');
      expect(result).toContain('utils');
      expect(result).toContain('index.ts');
    });

    it('should handle empty segments', () => {
      const result = join('src', '', 'index.ts');
      expect(result).toContain('src');
      expect(result).toContain('index.ts');
    });

    it('should handle absolute paths', () => {
      const result = join('/absolute', 'path', 'file.txt');
      expect(result.startsWith('/')).toBe(true);
    });
  });

  describe('Path Resolution', () => {
    it('should resolve relative paths', () => {
      const result = resolve('./src', './utils');
      expect(isAbsolute(result)).toBe(true);
    });

    it('should resolve from project root', () => {
      const fromProjectRoot = (...paths: string[]): string => {
        return join(process.cwd(), ...paths);
      };

      const result = fromProjectRoot('src', 'index.ts');
      expect(result).toContain(process.cwd());
    });

    it('should resolve from home directory', () => {
      const fromHome = (...paths: string[]): string => {
        const { homedir } = require('node:os');
        return join(homedir(), ...paths);
      };

      const result = fromHome('.config', 'qmx');
      expect(result).toContain('.config');
    });
  });

  describe('Path Normalization', () => {
    it('should normalize path separators', () => {
      const normalizeSeparators = (path: string): string => {
        return path.replace(/\\/g, '/');
      };

      expect(normalizeSeparators('C:\\Users\\test')).toBe('C:/Users/test');
      expect(normalizeSeparators('/home/test')).toBe('/home/test');
    });

    it('should normalize to Windows format', () => {
      const normalizeToWindows = (path: string): string => {
        return path.replace(/\//g, '\\');
      };

      expect(normalizeToWindows('/home/test')).toBe('\\home\\test');
    });

    it('should normalize redundant separators', () => {
      const result = normalize('src//utils///index.ts');
      expect(result).not.toContain('//');
    });
  });

  describe('Relative Paths', () => {
    it('should get relative path', () => {
      const from = '/home/user/project/src';
      const to = '/home/user/project/src/utils';
      const result = relative(from, to);

      expect(result).toBe('utils');
    });

    it('should handle cross-drive paths on Windows', () => {
      const getRelativePath = (from: string, to: string): string => {
        const rel = relative(from, to);
        if (rel.startsWith('..') && process.platform === 'win32') {
          return to; // Return absolute for different drives
        }
        return rel;
      };

      const result = getRelativePath('C:/src', 'C:/dest');
      expect(result).toBeDefined();
    });

    it('should make path relative if within base', () => {
      const makeRelativeIfWithin = (filePath: string, basePath: string): string => {
        const rel = relative(basePath, filePath);
        if (!rel.startsWith('..') && !isAbsolute(rel)) {
          return rel;
        }
        return filePath;
      };

      expect(makeRelativeIfWithin('/base/sub/file', '/base')).toBe('sub/file');
      expect(makeRelativeIfWithin('/other/file', '/base')).toBe('/other/file');
    });
  });

  describe('Path Components', () => {
    it('should get directory name', () => {
      expect(dirname('/path/to/file.txt')).toBe('/path/to');
      expect(dirname('file.txt')).toBe('.');
    });

    it('should get base name', () => {
      expect(basename('/path/to/file.txt')).toBe('file.txt');
      expect(basename('/path/to/file.txt', '.txt')).toBe('file');
    });

    it('should get file name without extension', () => {
      const getFileName = (filePath: string): string => {
        const base = basename(filePath);
        const ext = extname(base);
        return ext ? base.slice(0, -ext.length) : base;
      };

      expect(getFileName('/path/file.txt')).toBe('file');
      expect(getFileName('/path/file.tar.gz')).toBe('file.tar');
    });

    it('should get extension', () => {
      expect(extname('file.txt')).toBe('.txt');
      expect(extname('file')).toBe('');
      expect(extname('file.tar.gz')).toBe('.gz');
    });

    it('should get extension without dot', () => {
      const getExtensionName = (filePath: string): string => {
        const ext = extname(filePath);
        return ext ? ext.slice(1) : '';
      };

      expect(getExtensionName('file.txt')).toBe('txt');
      expect(getExtensionName('file')).toBe('');
    });
  });

  describe('Path Analysis', () => {
    it('should check if path is absolute', () => {
      expect(isAbsolute('/absolute/path')).toBe(true);
      expect(isAbsolute('./relative/path')).toBe(false);
      expect(isAbsolute('relative/path')).toBe(false);
    });

    it('should check if path is relative', () => {
      const isRelativePath = (path: string): boolean => {
        return !isAbsolute(path);
      };

      expect(isRelativePath('./relative')).toBe(true);
      expect(isRelativePath('/absolute')).toBe(false);
    });

    it('should get path depth', () => {
      const getPathDepth = (filePath: string): number => {
        const normalized = filePath.replace(/\\/g, '/');
        const segments = normalized.split('/').filter(s => s.length > 0);
        return segments.length;
      };

      expect(getPathDepth('/a/b/c')).toBe(3);
      expect(getPathDepth('a/b')).toBe(2);
      expect(getPathDepth('file.txt')).toBe(1);
    });

    it('should get all parent directories', () => {
      const getAllParentDirectories = (filePath: string): string[] => {
        const parents: string[] = [];
        let current = dirname(filePath);

        while (current !== dirname(current)) {
          parents.push(current);
          current = dirname(current);
        }

        return parents;
      };

      const parents = getAllParentDirectories('/a/b/c/file.txt');
      expect(parents.length).toBeGreaterThan(0);
      expect(parents[0]).toBe('/a/b/c');
    });
  });

  describe('Path Comparison', () => {
    it('should check if paths are equal', () => {
      const pathsEqual = (path1: string, path2: string): boolean => {
        const normalized1 = normalize(path1);
        const normalized2 = normalize(path2);

        if (process.platform === 'win32' || process.platform === 'darwin') {
          return normalized1.toLowerCase() === normalized2.toLowerCase();
        }

        return normalized1 === normalized2;
      };

      expect(pathsEqual('/path/to', '/path/to')).toBe(true);
      expect(pathsEqual('/path/to', '/path/other')).toBe(false);
    });

    it('should check if path is within directory', () => {
      const isWithinDirectory = (filePath: string, directory: string): boolean => {
        const resolvedFile = resolve(filePath);
        const resolvedDir = resolve(directory);
        const relativePath = relative(resolvedDir, resolvedFile);
        return !relativePath.startsWith('..') && !isAbsolute(relativePath);
      };

      expect(isWithinDirectory('/base/sub/file', '/base')).toBe(true);
      expect(isWithinDirectory('/other/file', '/base')).toBe(false);
    });

    it('should get common ancestor directory', () => {
      const getCommonAncestor = (paths: string[]): string => {
        if (paths.length === 0) return '';
        if (paths.length === 1) return dirname(paths[0]);

        const normalized = paths.map(p => p.replace(/\\/g, '/'));
        const splitPaths = normalized.map(p => p.split('/'));

        let commonLength = 0;
        const minLength = Math.min(...splitPaths.map(p => p.length));

        for (let i = 0; i < minLength; i++) {
          const segment = splitPaths[0][i];
          if (splitPaths.every(p => p[i] === segment)) {
            commonLength = i + 1;
          } else {
            break;
          }
        }

        if (commonLength === 0) return '';

        const common = splitPaths[0].slice(0, commonLength).join('/');
        return normalized[0].startsWith('/') ? '/' + common : common;
      };

      const paths = ['/a/b/c/d', '/a/b/c/e', '/a/b/c/f'];
      const ancestor = getCommonAncestor(paths);
      expect(ancestor).toBe('/a/b/c');
    });
  });

  describe('Path Manipulation', () => {
    it('should ensure trailing separator', () => {
      const ensureTrailingSeparator = (path: string): string => {
        const { sep } = require('node:path');
        if (path.endsWith(sep) || path.endsWith('/')) {
          return path;
        }
        return path + '/';
      };

      expect(ensureTrailingSeparator('/path/to')).toBe('/path/to/');
      expect(ensureTrailingSeparator('/path/to/')).toBe('/path/to/');
    });

    it('should remove trailing separator', () => {
      const removeTrailingSeparator = (path: string): string => {
        return path.replace(/[\\/]$/, '');
      };

      expect(removeTrailingSeparator('/path/to/')).toBe('/path/to');
      expect(removeTrailingSeparator('/path/to')).toBe('/path/to');
    });

    it('should replace extension', () => {
      const replaceExtension = (filePath: string, newExt: string): string => {
        const { parse, format } = require('node:path');
        const parsed = parse(filePath);
        const ext = newExt.startsWith('.') ? newExt : `.${newExt}`;
        return format({ dir: parsed.dir, name: parsed.name, ext });
      };

      expect(replaceExtension('file.txt', 'js')).toBe('file.js');
      expect(replaceExtension('file.txt', '.js')).toBe('file.js');
    });

    it('should remove extension', () => {
      const removeExtension = (filePath: string): string => {
        const { parse, format } = require('node:path');
        const parsed = parse(filePath);
        return format({ dir: parsed.dir, name: parsed.name, ext: '' });
      };

      expect(removeExtension('/path/file.txt')).toBe('/path/file');
    });

    it('should add extension if missing', () => {
      const addExtensionIfMissing = (filePath: string, ext: string): string => {
        if (extname(filePath)) return filePath;
        const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
        return filePath + normalizedExt;
      };

      expect(addExtensionIfMissing('file', 'txt')).toBe('file.txt');
      expect(addExtensionIfMissing('file.txt', 'txt')).toBe('file.txt');
    });
  });

  describe('Path Conversion', () => {
    it('should convert to POSIX format', () => {
      const toPosixPath = (path: string): string => {
        return path.replace(/\\/g, '/');
      };

      expect(toPosixPath('C:\\Users\\test')).toBe('C:/Users/test');
    });

    it('should convert to Windows format', () => {
      const toWindowsPath = (path: string): string => {
        return path.replace(/\//g, '\\');
      };

      expect(toWindowsPath('/home/test')).toBe('\\home\\test');
    });

    it('should convert path to URL', () => {
      const pathToUrl = (filePath: string): string => {
        return `file://${filePath.replace(/\\/g, '/')}`;
      };

      expect(pathToUrl('/path/file.txt')).toBe('file:///path/file.txt');
    });
  });

  describe('Path Validation', () => {
    it('should check for hidden paths', () => {
      const isHiddenPath = (filePath: string): boolean => {
        const base = basename(filePath);
        return base.startsWith('.');
      };

      expect(isHiddenPath('/path/.hidden')).toBe(true);
      expect(isHiddenPath('/path/visible')).toBe(false);
    });

    it('should sanitize path', () => {
      const sanitizePath = (path: string): string => {
        return path.replace(/[<>:"|?*]/g, '_');
      };

      expect(sanitizePath('file<name>.txt')).toBe('file_name_.txt');
      expect(sanitizePath('normal.txt')).toBe('normal.txt');
    });
  });

  describe('Path Generation', () => {
    it('should generate unique path', () => {
      const generateUniquePath = (basePath: string, counter: number): string => {
        const { parse, format } = require('node:path');
        if (counter === 0) return basePath;

        const parsed = parse(basePath);
        return format({
          dir: parsed.dir,
          name: `${parsed.name} (${counter})`,
          ext: parsed.ext,
        });
      };

      expect(generateUniquePath('/path/file.txt', 0)).toBe('/path/file.txt');
      expect(generateUniquePath('/path/file.txt', 1)).toBe('/path/file (1).txt');
    });

    it('should truncate path to max length', () => {
      const truncatePath = (filePath: string, maxLength: number, ellipsis: string = '...'): string => {
        if (filePath.length <= maxLength) return filePath;

        const { parse, format } = require('node:path');
        const parsed = parse(filePath);
        const availableForName = maxLength - parsed.dir.length - parsed.ext.length - ellipsis.length - 1;

        if (availableForName <= 0) {
          return ellipsis + parsed.ext;
        }

        const truncatedName = parsed.name.length > availableForName
          ? ellipsis + parsed.name.slice(-availableForName + ellipsis.length)
          : parsed.name;

        return join(parsed.dir, truncatedName + parsed.ext);
      };

      expect(truncatePath('/path/verylongfilename.txt', 20)).toContain('...');
    });
  });
});
