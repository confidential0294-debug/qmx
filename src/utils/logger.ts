/**
 * QMX Logger Utility
 * 
 * Provides consistent logging across the application
 */

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  prefix?: string;
  level?: LogLevel;
  timestamps?: boolean;
}

class Logger {
  private prefix: string;
  private level: LogLevel;
  private timestamps: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || 'QMX';
    this.level = options.level || 'info';
    this.timestamps = options.timestamps ?? true;
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      this.log('debug', chalk.gray, args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      this.log('info', chalk.blue, args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      this.log('warn', chalk.yellow, args);
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      this.log('error', chalk.red, args);
    }
  }

  success(...args: any[]): void {
    if (this.shouldLog('info')) {
      this.log('success', chalk.green, args);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const targetLevelIndex = levels.indexOf(level);
    return targetLevelIndex >= currentLevelIndex;
  }

  private log(level: string, color: (str: string) => string, args: any[]): void {
    const timestamp = this.timestamps ? `[${new Date().toISOString()}] ` : '';
    const prefix = `[${this.prefix}]`;
    const levelStr = color(level.toUpperCase());
    
    const message = args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return arg.message;
        return JSON.stringify(arg, null, 2);
      })
      .join(' ');
    
    console.log(`${timestamp}${prefix} ${levelStr}: ${message}`);
  }

  /**
   * Create a child logger with additional prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      prefix: `${this.prefix}:${prefix}`,
      level: this.level,
      timestamps: this.timestamps,
    });
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Enable/disable timestamps
   */
  setTimestamps(enabled: boolean): void {
    this.timestamps = enabled;
  }
}

// Default logger instance
export const logger = new Logger();

// Create loggers for different modules
export const cliLogger = logger.child('CLI');
export const teamLogger = logger.child('TEAM');
export const mcpLogger = logger.child('MCP');
export const hookLogger = logger.child('HOOKS');
export const hudLogger = logger.child('HUD');
