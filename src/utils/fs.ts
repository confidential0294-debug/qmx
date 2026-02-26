/**
 * QMX File System Utilities
 * 
 * Common file system operations with proper error handling
 */

import {
  mkdir,
  readFile,
  writeFile,
  access,
  stat,
  readdir,
  rm,
  copyFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Read JSON file
 */
export async function readJson<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Write JSON file with formatting
 */
export async function writeJson<T>(
  filePath: string,
  data: T,
  spaces: number = 2
): Promise<void> {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, spaces), 'utf-8');
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if directory exists
 */
export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Read file as string
 */
export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8');
}

/**
 * Write text to file
 */
export async function writeText(
  filePath: string,
  content: string
): Promise<void> {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, content, 'utf-8');
}

/**
 * List files in directory
 */
export async function listFiles(
  dirPath: string,
  options?: { recursive?: boolean; pattern?: RegExp }
): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory() && options?.recursive) {
        const subFiles = await listFiles(fullPath, options);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        if (!options?.pattern || options.pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }
  } catch {
    // Directory might not exist
  }
  
  return files;
}

/**
 * Copy file
 */
export async function copyFileSafe(
  src: string,
  dest: string,
  options?: { overwrite?: boolean }
): Promise<void> {
  const exists = await fileExists(dest);
  
  if (exists && !options?.overwrite) {
    throw new Error(`Destination file already exists: ${dest}`);
  }
  
  await ensureDir(dirname(dest));
  await copyFile(src, dest);
}

/**
 * Remove file or directory
 */
export async function removeSafe(
  path: string,
  options?: { recursive?: boolean; force?: boolean }
): Promise<void> {
  try {
    await rm(path, {
      recursive: options?.recursive ?? false,
      force: options?.force ?? false,
    });
  } catch (error) {
    if (!options?.force) {
      throw error;
    }
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string) {
  return stat(filePath);
}

/**
 * Get file modification time
 */
export async function getMtime(filePath: string): Promise<Date> {
  const stats = await stat(filePath);
  return stats.mtime;
}

/**
 * Resolve path relative to project root
 */
export function resolveProjectPath(...paths: string[]): string {
  return resolve(process.cwd(), ...paths);
}

/**
 * Get relative path
 */
export function getRelativePath(from: string, to: string): string {
  const rel = to.replace(from, '').replace(/^[/\\]+/, '');
  return rel || to;
}

/**
 * Normalize path separators
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Get file extension
 */
export function getExtension(filePath: string): string {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

/**
 * Get file name without extension
 */
export function getFileName(filePath: string): string {
  const base = filePath.split(/[\\/]/).pop() || '';
  const parts = base.split('.');
  if (parts.length > 1) {
    parts.pop();
  }
  return parts.join('.');
}
