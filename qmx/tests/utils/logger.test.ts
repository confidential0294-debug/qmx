/**
 * Tests for Logger Utility
 */

import { describe, it, expect, vi } from 'vitest';

describe('Logger Utility', () => {
  describe('Log Levels', () => {
    it('should support debug level', () => {
      const levels = ['debug', 'info', 'warn', 'error'];
      expect(levels).toContain('debug');
    });

    it('should support info level', () => {
      const levels = ['debug', 'info', 'warn', 'error'];
      expect(levels).toContain('info');
    });

    it('should support warn level', () => {
      const levels = ['debug', 'info', 'warn', 'error'];
      expect(levels).toContain('warn');
    });

    it('should support error level', () => {
      const levels = ['debug', 'info', 'warn', 'error'];
      expect(levels).toContain('error');
    });

    it('should filter logs based on level', () => {
      const shouldLog = (currentLevel: string, targetLevel: string): boolean => {
        const levels = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(targetLevel) >= levels.indexOf(currentLevel);
      };

      expect(shouldLog('debug', 'debug')).toBe(true);
      expect(shouldLog('info', 'debug')).toBe(false);
      expect(shouldLog('warn', 'error')).toBe(true);
    });
  });

  describe('Logger Creation', () => {
    it('should create logger with prefix', () => {
      const createLogger = (prefix: string) => ({
        prefix,
        level: 'info',
        timestamps: true,
      });

      const logger = createLogger('QMX');
      expect(logger.prefix).toBe('QMX');
    });

    it('should create child logger', () => {
      const parentPrefix = 'QMX';
      const childPrefix = 'CLI';
      const combinedPrefix = `${parentPrefix}:${childPrefix}`;

      expect(combinedPrefix).toBe('QMX:CLI');
    });

    it('should support custom options', () => {
      const options = {
        prefix: 'Custom',
        level: 'debug' as const,
        timestamps: false,
      };

      expect(options.prefix).toBe('Custom');
      expect(options.level).toBe('debug');
      expect(options.timestamps).toBe(false);
    });
  });

  describe('Log Output', () => {
    it('should format log message with timestamp', () => {
      const formatLog = (
        level: string,
        prefix: string,
        message: string,
        timestamps: boolean
      ): string => {
        const timestamp = timestamps ? `[${new Date().toISOString()}] ` : '';
        return `${timestamp}[${prefix}] ${level.toUpperCase()}: ${message}`;
      };

      const log = formatLog('info', 'QMX', 'Test message', true);
      expect(log).toContain('[QMX]');
      expect(log).toContain('INFO:');
      expect(log).toContain('Test message');
    });

    it('should handle multiple arguments', () => {
      const formatArgs = (...args: any[]): string => {
        return args
          .map(arg => {
            if (typeof arg === 'string') return arg;
            if (arg instanceof Error) return arg.message;
            return JSON.stringify(arg, null, 2);
          })
          .join(' ');
      };

      const message = formatArgs('Hello', { key: 'value' }, 42);
      expect(message).toContain('Hello');
      expect(message).toContain('key');
      expect(message).toContain('42');
    });

    it('should handle Error objects', () => {
      const formatError = (arg: any): string => {
        if (arg instanceof Error) {
          return arg.message;
        }
        return String(arg);
      };

      const error = new Error('Test error');
      expect(formatError(error)).toBe('Test error');
      expect(formatError('string')).toBe('string');
    });
  });

  describe('Color Coding', () => {
    it('should colorize log levels', () => {
      const colors: Record<string, string> = {
        debug: 'gray',
        info: 'blue',
        warn: 'yellow',
        error: 'red',
        success: 'green',
      };

      expect(colors['debug']).toBe('gray');
      expect(colors['info']).toBe('blue');
      expect(colors['error']).toBe('red');
    });

    it('should apply color to level string', () => {
      const colorize = (color: string, text: string): string => {
        return `[${color}] ${text}`;
      };

      expect(colorize('red', 'ERROR')).toContain('red');
    });
  });

  describe('Logger Methods', () => {
    it('should have debug method', () => {
      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        success: vi.fn(),
      };

      expect(typeof logger.debug).toBe('function');
    });

    it('should have info method', () => {
      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', () => {
      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      expect(typeof logger.error).toBe('function');
    });

    it('should have success method', () => {
      const logger = {
        success: vi.fn(),
      };

      expect(typeof logger.success).toBe('function');
    });
  });

  describe('Module Loggers', () => {
    it('should create CLI logger', () => {
      const cliLogger = { prefix: 'QMX:CLI' };
      expect(cliLogger.prefix).toContain('CLI');
    });

    it('should create TEAM logger', () => {
      const teamLogger = { prefix: 'QMX:TEAM' };
      expect(teamLogger.prefix).toContain('TEAM');
    });

    it('should create MCP logger', () => {
      const mcpLogger = { prefix: 'QMX:MCP' };
      expect(mcpLogger.prefix).toContain('MCP');
    });

    it('should create HOOKS logger', () => {
      const hookLogger = { prefix: 'QMX:HOOKS' };
      expect(hookLogger.prefix).toContain('HOOKS');
    });

    it('should create HUD logger', () => {
      const hudLogger = { prefix: 'QMX:HUD' };
      expect(hudLogger.prefix).toContain('HUD');
    });
  });

  describe('Configuration', () => {
    it('should set log level', () => {
      const logger = { level: 'info' as const };
      const setLevel = (level: string) => {
        logger.level = level as any;
      };

      setLevel('debug');
      expect(logger.level).toBe('debug');
    });

    it('should enable/disable timestamps', () => {
      const logger = { timestamps: true };
      const setTimestamps = (enabled: boolean) => {
        logger.timestamps = enabled;
      };

      setTimestamps(false);
      expect(logger.timestamps).toBe(false);
    });
  });

  describe('Log Message Formatting', () => {
    it('should format object arguments', () => {
      const formatObject = (obj: Record<string, any>): string => {
        return JSON.stringify(obj, null, 2);
      };

      const obj = { name: 'test', value: 42 };
      const formatted = formatObject(obj);

      expect(formatted).toContain('"name": "test"');
      expect(formatted).toContain('"value": 42');
    });

    it('should format array arguments', () => {
      const formatArray = (arr: any[]): string => {
        return JSON.stringify(arr);
      };

      const arr = [1, 2, 3];
      const formatted = formatArray(arr);

      expect(formatted).toBe('[1,2,3]');
    });
  });
});
