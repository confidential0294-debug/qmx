/**
 * QMX Path Utilities
 *
 * Comprehensive path manipulation and resolution utilities
 * for cross-platform file system operations.
 */

import {
  join,
  resolve,
  normalize,
  relative,
  dirname,
  basename,
  extname,
  parse,
  format,
  isAbsolute,
  sep,
  delimiter,
} from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

/**
 * Path resolution options
 */
export interface PathOptions {
  /** Resolve relative to project root */
  fromProjectRoot?: boolean;
  /** Resolve relative to home directory */
  fromHome?: boolean;
  /** Normalize path separators */
  normalizeSeparators?: boolean;
  /** Ensure absolute path */
  ensureAbsolute?: boolean;
}

/**
 * Parsed path result
 */
export interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

/**
 * Path segment for building paths
 */
export interface PathSegment {
  type: 'dir' | 'file' | 'glob';
  value: string;
}

/**
 * Join path segments with proper handling
 */
export function joinPath(...segments: string[]): string {
  const filtered = segments.filter(s => s && s.length > 0);
  if (filtered.length === 0) return '';
  return join(...filtered);
}

/**
 * Resolve path with options
 */
export function resolvePath(path: string, options?: PathOptions): string {
  let result = path;

  // Resolve from project root
  if (options?.fromProjectRoot) {
    result = join(process.cwd(), path);
  }

  // Resolve from home directory
  if (options?.fromHome) {
    if (path.startsWith('~')) {
      result = join(homedir(), path.slice(1));
    } else {
      result = join(homedir(), path);
    }
  }

  // Normalize
  result = normalize(result);

  // Normalize separators for Windows
  if (options?.normalizeSeparators) {
    result = result.replace(/\\/g, '/');
  }

  // Ensure absolute
  if (options?.ensureAbsolute && !isAbsolute(result)) {
    result = resolve(process.cwd(), result);
  }

  return result;
}

/**
 * Get relative path from one path to another
 */
export function getRelativePath(from: string, to: string): string {
  const rel = relative(from, to);
  // Handle Windows drive letters
  if (rel.startsWith('..') && process.platform === 'win32') {
    // On different drives, return the absolute path
    return to;
  }
  return rel;
}

/**
 * Get the directory name of a path
 */
export function getDirectory(filePath: string): string {
  return dirname(filePath);
}

/**
 * Get the base name of a file (with extension)
 */
export function getBaseName(filePath: string, ext?: string): string {
  return basename(filePath, ext);
}

/**
 * Get the file name without extension
 */
export function getFileName(filePath: string): string {
  const base = basename(filePath);
  const ext = extname(base);
  return ext ? base.slice(0, -ext.length) : base;
}

/**
 * Get the file extension (including the dot)
 */
export function getExtension(filePath: string): string {
  return extname(filePath);
}

/**
 * Get file extension without the dot
 */
export function getExtensionName(filePath: string): string {
  const ext = extname(filePath);
  return ext ? ext.slice(1) : '';
}

/**
 * Parse a path into components
 */
export function parsePath(filePath: string): ParsedPath {
  return parse(filePath);
}

/**
 * Format a path object into a string
 */
export function formatPath(pathObject: Partial<ParsedPath>): string {
  return format(pathObject);
}

/**
 * Check if a path is absolute
 */
export function isAbsolutePath(path: string): boolean {
  return isAbsolute(path);
}

/**
 * Check if a path is relative
 */
export function isRelativePath(path: string): boolean {
  return !isAbsolute(path);
}

/**
 * Normalize path separators to forward slashes
 */
export function normalizeSeparators(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Normalize path separators to backslashes (Windows)
 */
export function normalizeToWindows(path: string): string {
  return path.replace(/\//g, '\\');
}

/**
 * Get the common ancestor directory of multiple paths
 */
export function getCommonAncestor(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) return dirname(paths[0]);

  const normalized = paths.map(p => normalizeSeparators(p));
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
}

/**
 * Ensure path ends with a separator
 */
export function ensureTrailingSeparator(path: string): string {
  if (path.endsWith(sep) || path.endsWith('/')) {
    return path;
  }
  return path + sep;
}

/**
 * Remove trailing separator from path
 */
export function removeTrailingSeparator(path: string): string {
  return path.replace(/[\\/]$/, '');
}

/**
 * Check if path is within a directory
 */
export function isWithinDirectory(filePath: string, directory: string): boolean {
  const resolvedFile = resolve(filePath);
  const resolvedDir = resolve(directory);
  const relativePath = relative(resolvedDir, resolvedFile);
  return !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

/**
 * Convert file path to file URL
 */
export function pathToUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}

/**
 * Convert file URL to path
 */
export function urlToPath(fileUrl: string): string {
  return fileURLToPath(fileUrl);
}

/**
 * Get the project root directory
 */
export function getProjectRoot(): string {
  return process.cwd();
}

/**
 * Resolve path relative to project root
 */
export function fromProjectRoot(...paths: string[]): string {
  return join(process.cwd(), ...paths);
}

/**
 * Resolve path relative to home directory
 */
export function fromHome(...paths: string[]): string {
  return join(homedir(), ...paths);
}

/**
 * Get the user's home directory
 */
export function getHomeDirectory(): string {
  return homedir();
}

/**
 * Expand tilde in path to home directory
 */
export function expandTilde(path: string): string {
  if (path.startsWith('~')) {
    return join(homedir(), path.slice(1));
  }
  return path;
}

/**
 * Create a glob pattern from a path
 */
export function toGlobPattern(path: string, options?: { recursive?: boolean }): string {
  const normalized = normalizeSeparators(path);
  if (options?.recursive) {
    return `${normalized}/**/*`;
  }
  return `${normalized}/*`;
}

/**
 * Escape special characters in path for glob matching
 */
export function escapeGlobCharacters(path: string): string {
  return path.replace(/([()[\]{}*?+|^$\\.])/g, '\\$1');
}

/**
 * Check if path matches a glob pattern
 */
export function matchesGlob(path: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\[/g, '[')
    .replace(/\]/g, ']');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(normalizeSeparators(path));
}

/**
 * Build a path from segments
 */
export function buildPath(segments: PathSegment[]): string {
  return segments.map(s => s.value).join(sep);
}

/**
 * Get parent directory at specified depth
 */
export function getParentDirectory(filePath: string, depth: number = 1): string {
  let result = filePath;
  for (let i = 0; i < depth; i++) {
    result = dirname(result);
  }
  return result;
}

/**
 * Get all parent directories
 */
export function getAllParentDirectories(filePath: string): string[] {
  const parents: string[] = [];
  let current = dirname(filePath);

  while (current !== dirname(current)) {
    parents.push(current);
    current = dirname(current);
  }

  return parents;
}

/**
 * Check if two paths are equal (case-insensitive on Windows)
 */
export function pathsEqual(path1: string, path2: string): boolean {
  const normalized1 = normalize(path1);
  const normalized2 = normalize(path2);

  if (process.platform === 'win32' || process.platform === 'darwin') {
    return normalized1.toLowerCase() === normalized2.toLowerCase();
  }

  return normalized1 === normalized2;
}

/**
 * Get the drive letter from a Windows path
 */
export function getDriveLetter(filePath: string): string | null {
  const match = filePath.match(/^([a-zA-Z]):/);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Check if path is on a specific drive (Windows)
 */
export function isOnDrive(filePath: string, drive: string): boolean {
  const pathDrive = getDriveLetter(filePath);
  return pathDrive?.toUpperCase() === drive.toUpperCase();
}

/**
 * Convert absolute path to relative if within base
 */
export function makeRelativeIfWithin(filePath: string, basePath: string): string {
  if (isWithinDirectory(filePath, basePath)) {
    return getRelativePath(basePath, filePath);
  }
  return filePath;
}

/**
 * Get the deepest common directory from a list of files
 */
export function getDeepestCommonDirectory(filePaths: string[]): string {
  if (filePaths.length === 0) return '';
  if (filePaths.length === 1) return dirname(filePaths[0]);

  const directories = filePaths.map(f => dirname(f));
  return getCommonAncestor(directories);
}

/**
 * Sanitize path for safe usage (remove invalid characters)
 */
export function sanitizePath(path: string): string {
  // Remove or replace invalid characters for Windows
  const invalidChars = /[<>:"|?*]/g;
  return path.replace(invalidChars, '_');
}

/**
 * Generate a unique path by appending a counter if file exists
 * Note: This doesn't check existence, just generates the pattern
 */
export function generateUniquePath(basePath: string, counter: number): string {
  if (counter === 0) return basePath;

  const parsed = parsePath(basePath);
  return formatPath({
    dir: parsed.dir,
    name: `${parsed.name} (${counter})`,
    ext: parsed.ext,
  });
}

/**
 * Get path depth (number of segments)
 */
export function getPathDepth(filePath: string): number {
  const normalized = normalizeSeparators(filePath);
  const segments = normalized.split('/').filter(s => s.length > 0);
  return segments.length;
}

/**
 * Truncate path to maximum length
 */
export function truncatePath(filePath: string, maxLength: number, ellipsis: string = '...'): string {
  if (filePath.length <= maxLength) return filePath;

  const parsed = parsePath(filePath);
  const availableForName = maxLength - parsed.dir.length - parsed.ext.length - ellipsis.length - sep.length;

  if (availableForName <= 0) {
    return ellipsis + parsed.ext;
  }

  const truncatedName = parsed.name.length > availableForName
    ? ellipsis + parsed.name.slice(-availableForName + ellipsis.length)
    : parsed.name;

  return join(parsed.dir, truncatedName + parsed.ext);
}

/**
 * Convert path to POSIX format
 */
export function toPosixPath(filePath: string): string {
  return normalizeSeparators(filePath);
}

/**
 * Convert path to Windows format
 */
export function toWindowsPath(filePath: string): string {
  return normalizeToWindows(filePath);
}

/**
 * Get path delimiter for current platform
 */
export function getPathDelimiter(): string {
  return delimiter;
}

/**
 * Get path separator for current platform
 */
export function getPathSeparator(): string {
  return sep;
}

/**
 * Check if path is a hidden file/directory (starts with .)
 */
export function isHiddenPath(filePath: string): boolean {
  const base = basename(filePath);
  return base.startsWith('.');
}

/**
 * Join URL path segments
 */
export function joinUrlPath(...segments: string[]): string {
  return segments
    .filter(s => s && s.length > 0)
    .map(s => s.replace(/^\/+|\/+$/g, ''))
    .join('/');
}

/**
 * Normalize a URL path
 */
export function normalizeUrlPath(urlPath: string): string {
  return urlPath.replace(/\/+/g, '/').replace(/\/$/, '');
}

/**
 * Get the last segment of a path
 */
export function getLastSegment(filePath: string): string {
  const normalized = normalizeSeparators(filePath);
  const segments = normalized.split('/').filter(s => s.length > 0);
  return segments[segments.length - 1] || '';
}

/**
 * Get all segments of a path
 */
export function getPathSegments(filePath: string): string[] {
  const normalized = normalizeSeparators(filePath);
  return normalized.split('/').filter(s => s.length > 0);
}

/**
 * Replace the extension of a file path
 */
export function replaceExtension(filePath: string, newExt: string): string {
  const parsed = parsePath(filePath);
  const ext = newExt.startsWith('.') ? newExt : `.${newExt}`;
  return formatPath({
    dir: parsed.dir,
    name: parsed.name,
    ext,
  });
}

/**
 * Add extension to a path if not present
 */
export function addExtensionIfMissing(filePath: string, ext: string): string {
  if (extname(filePath)) return filePath;
  const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
  return filePath + normalizedExt;
}

/**
 * Remove extension from a path
 */
export function removeExtension(filePath: string): string {
  const parsed = parsePath(filePath);
  return formatPath({
    dir: parsed.dir,
    name: parsed.name,
    ext: '',
  });
}

/**
 * Change the file name while keeping directory and extension
 */
export function changeFileName(filePath: string, newName: string): string {
  const parsed = parsePath(filePath);
  return formatPath({
    dir: parsed.dir,
    name: newName,
    ext: parsed.ext,
  });
}

/**
 * Change the directory while keeping the file name
 */
export function changeDirectory(filePath: string, newDir: string): string {
  const parsed = parsePath(filePath);
  return join(newDir, parsed.base);
}

/**
 * Create a path from root to leaf
 */
export function createPath(root: string, ...segments: string[]): string {
  return join(root, ...segments);
}

/**
 * Check if path has a specific extension
 */
export function hasExtension(filePath: string, ext: string): boolean {
  const fileExt = getExtensionName(filePath);
  const checkExt = ext.startsWith('.') ? ext.slice(1) : ext;
  return fileExt.toLowerCase() === checkExt.toLowerCase();
}

/**
 * Get all extensions from a path (for files with multiple extensions like .tar.gz)
 */
export function getAllExtensions(filePath: string): string[] {
  const base = basename(filePath);
  const parts = base.split('.');
  if (parts.length <= 1) return [];
  return parts.slice(1).map(ext => `.${ext}`);
}

/**
 * Check if path ends with any of the given extensions
 */
export function hasAnyExtension(filePath: string, extensions: string[]): boolean {
  return extensions.some(ext => hasExtension(filePath, ext));
}
