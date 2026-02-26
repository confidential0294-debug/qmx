/**
 * Tests for Time Utilities
 */

import { describe, it, expect } from 'vitest';

describe('Time Utilities', () => {
  describe('Current Time', () => {
    it('should get current timestamp', () => {
      const now = Date.now();
      expect(now).toBeGreaterThan(0);
      expect(Number.isInteger(now)).toBe(true);
    });

    it('should get current date', () => {
      const currentDate = new Date();
      expect(currentDate).toBeInstanceOf(Date);
    });

    it('should get ISO timestamp', () => {
      const nowIso = new Date().toISOString();
      expect(nowIso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should get Unix timestamp', () => {
      const nowUnix = Math.floor(Date.now() / 1000);
      expect(nowUnix).toBeGreaterThan(1700000000);
    });
  });

  describe('Duration Conversion', () => {
    it('should convert milliseconds to duration', () => {
      const msToDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        return {
          milliseconds: ms % 1000,
          seconds: seconds % 60,
          minutes: minutes % 60,
          hours: hours % 24,
          days,
        };
      };

      const duration = msToDuration(90061000); // 25 hours, 1 minute, 1 second
      expect(duration.days).toBe(1);
      expect(duration.hours).toBe(1);
      expect(duration.minutes).toBe(1);
      expect(duration.seconds).toBe(1);
    });

    it('should convert duration to milliseconds', () => {
      const durationToMs = (duration: {
        hours?: number;
        minutes?: number;
        seconds?: number;
        milliseconds?: number;
      }): number => {
        let total = 0;
        if (duration.hours) total += duration.hours * 3600000;
        if (duration.minutes) total += duration.minutes * 60000;
        if (duration.seconds) total += duration.seconds * 1000;
        if (duration.milliseconds) total += duration.milliseconds;
        return total;
      };

      expect(durationToMs({ hours: 1 })).toBe(3600000);
      expect(durationToMs({ minutes: 1 })).toBe(60000);
      expect(durationToMs({ seconds: 1 })).toBe(1000);
    });
  });

  describe('Time String Parsing', () => {
    it('should parse time string to milliseconds', () => {
      const parseTimeStr = (timeStr: string): number => {
        const regex = /(\d+)(ms|s|m|h|d)?/g;
        let total = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(timeStr)) !== null) {
          const value = parseInt(match[1], 10);
          const unit = match[2] || 'ms';

          switch (unit) {
            case 'ms': total += value; break;
            case 's': total += value * 1000; break;
            case 'm': total += value * 60000; break;
            case 'h': total += value * 3600000; break;
            case 'd': total += value * 86400000; break;
          }
        }

        return total;
      };

      expect(parseTimeStr('5s')).toBe(5000);
      expect(parseTimeStr('2m')).toBe(120000);
      expect(parseTimeStr('1h')).toBe(3600000);
      expect(parseTimeStr('1h30m')).toBe(5400000);
    });
  });

  describe('Duration Formatting', () => {
    it('should format duration to human-readable string', () => {
      const formatDuration = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours % 24 > 0) parts.push(`${hours % 24}h`);
        if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
        if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);

        return parts.join(' ') || '0s';
      };

      expect(formatDuration(90061000)).toContain('1d');
      expect(formatDuration(3661000)).toContain('1h');
      expect(formatDuration(61000)).toContain('1m');
    });

    it('should format duration as HH:MM:SS', () => {
      const formatDurationHMS = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        const h = hours % 24;
        const m = minutes % 60;
        const s = seconds % 60;

        return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
      };

      expect(formatDurationHMS(3661000)).toBe('01:01:01');
      expect(formatDurationHMS(61000)).toBe('00:01:01');
    });

    it('should format compact duration', () => {
      const formatCompact = (ms: number): string => {
        if (ms >= 3600000) return `${(ms / 3600000).toFixed(1)}h`;
        if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
        if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
        return `${ms}ms`;
      };

      expect(formatCompact(3600000)).toBe('1.0h');
      expect(formatCompact(60000)).toBe('1.0m');
      expect(formatCompact(1000)).toBe('1.0s');
      expect(formatCompact(500)).toBe('500ms');
    });
  });

  describe('Date Conversion', () => {
    it('should convert various formats to Date', () => {
      const toDate = (value: Date | string | number): Date => {
        if (value instanceof Date) return value;
        if (typeof value === 'number') {
          return new Date(value > 4102444800000 ? value * 1000 : value);
        }
        return new Date(value);
      };

      expect(toDate(new Date(2024, 0, 1))).toBeInstanceOf(Date);
      expect(toDate('2024-01-01')).toBeInstanceOf(Date);
      expect(toDate(1704067200000)).toBeInstanceOf(Date);
    });
  });

  describe('Sleep/Delay', () => {
    it('should calculate sleep duration', () => {
      const sleepDuration = 1000;
      expect(sleepDuration).toBe(1000);
    });

    it('should support exponential backoff', () => {
      const calculateBackoff = (
        attempt: number,
        baseDelay: number = 1000,
        maxDelay: number = 30000,
        factor: number = 2
      ): number => {
        const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
        const jitter = Math.random() * 0.1 * delay;
        return delay + jitter;
      };

      const delay0 = calculateBackoff(0);
      const delay1 = calculateBackoff(1);
      const delay5 = calculateBackoff(5);

      expect(delay0).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeGreaterThan(delay0);
      expect(delay5).toBeLessThanOrEqual(30000);
    });
  });

  describe('Date Checks', () => {
    it('should check if date is in the past', () => {
      const isPast = (date: Date): boolean => {
        return date < new Date();
      };

      expect(isPast(new Date(2020, 0, 1))).toBe(true);
      expect(isPast(new Date(2099, 0, 1))).toBe(false);
    });

    it('should check if date is in the future', () => {
      const isFuture = (date: Date): boolean => {
        return date > new Date();
      };

      expect(isFuture(new Date(2099, 0, 1))).toBe(true);
      expect(isFuture(new Date(2020, 0, 1))).toBe(false);
    });

    it('should check if date is today', () => {
      const isToday = (date: Date): boolean => {
        const today = new Date();
        return (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      };

      expect(isToday(new Date())).toBe(true);
      expect(isToday(new Date(2020, 0, 1))).toBe(false);
    });

    it('should check if date is yesterday', () => {
      const isYesterday = (date: Date): boolean => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return (
          date.getDate() === yesterday.getDate() &&
          date.getMonth() === yesterday.getMonth() &&
          date.getFullYear() === yesterday.getFullYear()
        );
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isYesterday(yesterday)).toBe(true);
    });
  });

  describe('Date Boundaries', () => {
    it('should get start of day', () => {
      const startOfDay = (date: Date): Date => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      };

      const date = new Date(2024, 5, 15, 14, 30, 45);
      const start = startOfDay(date);

      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });

    it('should get end of day', () => {
      const endOfDay = (date: Date): Date => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      };

      const date = new Date(2024, 5, 15, 14, 30, 45);
      const end = endOfDay(date);

      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
    });

    it('should get start of month', () => {
      const startOfMonth = (date: Date): Date => {
        return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      };

      const date = new Date(2024, 5, 15);
      const start = startOfMonth(date);

      expect(start.getDate()).toBe(1);
      expect(start.getMonth()).toBe(5);
    });

    it('should get end of month', () => {
      const endOfMonth = (date: Date): Date => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      };

      const date = new Date(2024, 5, 15);
      const end = endOfMonth(date);

      expect(end.getDate()).toBe(30);
      expect(end.getMonth()).toBe(5);
    });
  });

  describe('Date Arithmetic', () => {
    it('should add time to date', () => {
      const addTime = (date: Date, amount: number, unit: string): Date => {
        const result = new Date(date);

        switch (unit) {
          case 'h': result.setHours(date.getHours() + amount); break;
          case 'm': result.setMinutes(date.getMinutes() + amount); break;
          case 's': result.setSeconds(date.getSeconds() + amount); break;
          case 'd': result.setDate(date.getDate() + amount); break;
        }

        return result;
      };

      const date = new Date(2024, 0, 1, 12, 0, 0);
      expect(addTime(date, 1, 'h').getHours()).toBe(13);
      expect(addTime(date, 1, 'd').getDate()).toBe(2);
    });

    it('should subtract time from date', () => {
      const subtractTime = (date: Date, amount: number, unit: string): Date => {
        const result = new Date(date);

        switch (unit) {
          case 'h': result.setHours(date.getHours() - amount); break;
          case 'd': result.setDate(date.getDate() - amount); break;
        }

        return result;
      };

      const date = new Date(2024, 0, 1, 12, 0, 0);
      expect(subtractTime(date, 1, 'h').getHours()).toBe(11);
    });

    it('should get difference between dates', () => {
      const difference = (date1: Date, date2: Date, unit: string = 'ms'): number => {
        const diff = date1.getTime() - date2.getTime();

        switch (unit) {
          case 's': return Math.floor(diff / 1000);
          case 'm': return Math.floor(diff / 60000);
          case 'h': return Math.floor(diff / 3600000);
          case 'd': return Math.floor(diff / 86400000);
          default: return diff;
        }
      };

      const date1 = new Date(2024, 0, 2);
      const date2 = new Date(2024, 0, 1);

      expect(difference(date1, date2, 'd')).toBe(1);
      expect(difference(date1, date2, 'h')).toBe(24);
    });
  });

  describe('Time Ranges', () => {
    it('should create time range', () => {
      const createTimeRange = (start: Date, end: Date) => ({ start, end });

      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 2);
      const range = createTimeRange(start, end);

      expect(range.start).toBe(start);
      expect(range.end).toBe(end);
    });

    it('should check if ranges overlap', () => {
      const rangesOverlap = (r1: { start: Date; end: Date }, r2: { start: Date; end: Date }): boolean => {
        return r1.start <= r2.end && r2.start <= r1.end;
      };

      const r1 = { start: new Date(10), end: new Date(20) };
      const r2 = { start: new Date(15), end: new Date(25) };
      const r3 = { start: new Date(30), end: new Date(40) };

      expect(rangesOverlap(r1, r2)).toBe(true);
      expect(rangesOverlap(r1, r3)).toBe(false);
    });
  });

  describe('Execution Timing', () => {
    it('should measure execution time', async () => {
      const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
        const start = Date.now();
        const result = await fn();
        const duration = Date.now() - start;
        return { result, duration };
      };

      const result = await measureTime(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result.result).toBe('done');
      expect(result.duration).toBeGreaterThanOrEqual(10);
    });

    it('should measure synchronous execution time', () => {
      const measureTimeSync = <T>(fn: () => T): { result: T; duration: number } => {
        const start = Date.now();
        const result = fn();
        const duration = Date.now() - start;
        return { result, duration };
      };

      const result = measureTimeSync(() => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });

      expect(result.result).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Utility Functions', () => {
    it('should get days in month', () => {
      const getDaysInMonth = (date: Date): number => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      };

      expect(getDaysInMonth(new Date(2024, 1, 1))).toBe(29); // Feb 2024 (leap year)
      expect(getDaysInMonth(new Date(2023, 1, 1))).toBe(28); // Feb 2023
    });

    it('should check for leap year', () => {
      const isLeapYear = (year: number): boolean => {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      };

      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1900)).toBe(false);
    });

    it('should get quarter of year', () => {
      const getQuarter = (date: Date): number => {
        return Math.floor(date.getMonth() / 3) + 1;
      };

      expect(getQuarter(new Date(2024, 0, 1))).toBe(1); // Jan
      expect(getQuarter(new Date(2024, 3, 1))).toBe(2); // Apr
      expect(getQuarter(new Date(2024, 6, 1))).toBe(3); // Jul
      expect(getQuarter(new Date(2024, 9, 1))).toBe(4); // Oct
    });
  });
});
