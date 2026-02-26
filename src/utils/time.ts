/**
 * QMX Time Utilities
 *
 * Comprehensive time and date manipulation utilities
 * for consistent time handling across the application.
 */

/**
 * Time unit types
 */
export type TimeUnit = 'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y';

/**
 * Duration object
 */
export interface Duration {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  weeks: number;
  months: number;
  years: number;
}

/**
 * Time range
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Formatted time components
 */
export interface TimeComponents {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

/**
 * Relative time options
 */
export interface RelativeTimeOptions {
  /** Include seconds in output */
  includeSeconds?: boolean;
  /** Use short format (e.g., "5m" instead of "5 minutes") */
  short?: boolean;
  /** Include future/past prefix */
  includePrefix?: boolean;
  /** Round to nearest unit */
  round?: boolean;
}

/**
 * Sleep/delay options
 */
export interface SleepOptions {
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Callback on each interval */
  onTick?: (elapsed: number) => void;
}

// Time constants
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
export const MS_PER_WEEK = 7 * MS_PER_DAY;
export const MS_PER_MONTH = 30 * MS_PER_DAY; // Approximate
export const MS_PER_YEAR = 365 * MS_PER_DAY; // Approximate

/**
 * Get current timestamp in milliseconds
 */
export function now(): number {
  return Date.now();
}

/**
 * Get current date
 */
export function currentDate(): Date {
  return new Date();
}

/**
 * Get current ISO 8601 timestamp
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Get current Unix timestamp in seconds
 */
export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get current Unix timestamp in milliseconds
 */
export function nowUnixMs(): number {
  return Date.now();
}

/**
 * Convert milliseconds to duration object
 */
export function msToDuration(ms: number): Duration {
  const milliseconds = ms % 1000;
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const totalDays = Math.floor(totalHours / 24);
  const days = totalDays % 30;
  const totalMonths = Math.floor(totalDays / 30);
  const months = totalMonths % 12;
  const years = Math.floor(totalMonths / 12);

  return {
    milliseconds,
    seconds,
    minutes,
    hours,
    days,
    weeks: Math.floor(days / 7),
    months,
    years,
  };
}

/**
 * Convert duration to milliseconds
 */
export function durationToMs(duration: Partial<Duration>): number {
  let total = 0;
  if (duration.years) total += duration.years * MS_PER_YEAR;
  if (duration.months) total += duration.months * MS_PER_MONTH;
  if (duration.weeks) total += duration.weeks * MS_PER_WEEK;
  if (duration.days) total += duration.days * MS_PER_DAY;
  if (duration.hours) total += duration.hours * MS_PER_HOUR;
  if (duration.minutes) total += duration.minutes * MS_PER_MINUTE;
  if (duration.seconds) total += duration.seconds * MS_PER_SECOND;
  if (duration.milliseconds) total += duration.milliseconds;
  return total;
}

/**
 * Parse time string to milliseconds (e.g., "5m", "1h30m", "2d")
 */
export function parseTimeStr(timeStr: string): number {
  const regex = /(\d+)(ms|s|m|h|d|w|M|y)?/g;
  let total = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(timeStr)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2] || 'ms';

    switch (unit) {
      case 'ms':
        total += value;
        break;
      case 's':
        total += value * MS_PER_SECOND;
        break;
      case 'm':
        total += value * MS_PER_MINUTE;
        break;
      case 'h':
        total += value * MS_PER_HOUR;
        break;
      case 'd':
        total += value * MS_PER_DAY;
        break;
      case 'w':
        total += value * MS_PER_WEEK;
        break;
      case 'M':
        total += value * MS_PER_MONTH;
        break;
      case 'y':
        total += value * MS_PER_YEAR;
        break;
    }
  }

  return total;
}

/**
 * Format milliseconds to human-readable string
 */
export function formatDuration(ms: number, options?: RelativeTimeOptions): string {
  const opts: Required<RelativeTimeOptions> = {
    includeSeconds: true,
    short: false,
    includePrefix: false,
    round: true,
    ...options,
  };

  const duration = msToDuration(Math.abs(ms));
  const parts: string[] = [];

  if (duration.years > 0) {
    parts.push(opts.short ? `${duration.years}y` : `${duration.years} ${duration.years === 1 ? 'year' : 'years'}`);
  }
  if (duration.months > 0) {
    parts.push(opts.short ? `${duration.months}M` : `${duration.months} ${duration.months === 1 ? 'month' : 'months'}`);
  }
  if (duration.days > 0) {
    parts.push(opts.short ? `${duration.days}d` : `${duration.days} ${duration.days === 1 ? 'day' : 'days'}`);
  }
  if (duration.hours > 0) {
    parts.push(opts.short ? `${duration.hours}h` : `${duration.hours} ${duration.hours === 1 ? 'hour' : 'hours'}`);
  }
  if (duration.minutes > 0) {
    parts.push(opts.short ? `${duration.minutes}m` : `${duration.minutes} ${duration.minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (opts.includeSeconds && duration.seconds > 0) {
    parts.push(opts.short ? `${duration.seconds}s` : `${duration.seconds} ${duration.seconds === 1 ? 'second' : 'seconds'}`);
  }

  if (parts.length === 0) {
    return opts.short ? '0s' : '0 seconds';
  }

  let result = parts.slice(0, 2).join(opts.short ? '' : ' and ');

  if (opts.includePrefix) {
    const isFuture = ms < 0;
    result = isFuture ? `in ${result}` : `${result} ago`;
  }

  return result;
}

/**
 * Format duration as HH:MM:SS
 */
export function formatDurationHMS(ms: number): string {
  const duration = msToDuration(ms);
  const parts: string[] = [];

  if (duration.hours > 0 || duration.days > 0) {
    const totalHours = duration.hours + duration.days * 24;
    parts.push(String(totalHours).padStart(2, '0'));
  }

  parts.push(String(duration.minutes).padStart(2, '0'));
  parts.push(String(duration.seconds).padStart(2, '0'));

  return parts.join(':');
}

/**
 * Format milliseconds as compact string (e.g., "1.5s", "200ms")
 */
export function formatCompact(ms: number, precision: number = 1): string {
  const absMs = Math.abs(ms);

  if (absMs >= MS_PER_YEAR) {
    return `${(absMs / MS_PER_YEAR).toFixed(precision)}y`;
  }
  if (absMs >= MS_PER_MONTH) {
    return `${(absMs / MS_PER_MONTH).toFixed(precision)}M`;
  }
  if (absMs >= MS_PER_WEEK) {
    return `${(absMs / MS_PER_WEEK).toFixed(precision)}w`;
  }
  if (absMs >= MS_PER_DAY) {
    return `${(absMs / MS_PER_DAY).toFixed(precision)}d`;
  }
  if (absMs >= MS_PER_HOUR) {
    return `${(absMs / MS_PER_HOUR).toFixed(precision)}h`;
  }
  if (absMs >= MS_PER_MINUTE) {
    return `${(absMs / MS_PER_MINUTE).toFixed(precision)}m`;
  }
  if (absMs >= MS_PER_SECOND) {
    return `${(absMs / MS_PER_SECOND).toFixed(precision)}s`;
  }
  return `${absMs}ms`;
}

/**
 * Get relative time string (e.g., "5 minutes ago", "in 2 hours")
 */
export function formatRelative(date: Date | string | number, options?: RelativeTimeOptions): string {
  const targetDate = toDate(date);
  const diff = targetDate.getTime() - Date.now();
  return formatDuration(diff, { ...options, includePrefix: true });
}

/**
 * Convert various date formats to Date object
 */
export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Assume milliseconds if < year 2100, otherwise seconds
    return new Date(value > 4102444800000 ? value * 1000 : value);
  }
  return new Date(value);
}

/**
 * Sleep for specified duration
 */
export async function sleep(ms: number, options?: SleepOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    if (options?.signal) {
      if (options.signal.aborted) {
        reject(new Error('Sleep aborted'));
        return;
      }

      options.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Sleep aborted'));
      });
    }

    const tickInterval = 100; // Check every 100ms
    const timeoutId = setTimeout(() => {
      resolve();
    }, ms);

    if (options?.onTick) {
      const tickIntervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        options.onTick?.(elapsed);
      }, tickInterval);

      const clearTicks = () => {
        clearInterval(tickIntervalId);
      };

      timeoutId.ref?.();
      setTimeout(clearTicks, ms);
    }
  });
}

/**
 * Sleep with exponential backoff
 */
export async function sleepWithBackoff(
  attempt: number,
  options?: {
    baseDelay?: number;
    maxDelay?: number;
    factor?: number;
  }
): Promise<void> {
  const baseDelay = options?.baseDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 30000;
  const factor = options?.factor ?? 2;

  const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter

  return sleep(delay + jitter);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastCall);

    if (remaining <= 0) {
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
        timeoutId = null;
      }, remaining);
    }
  };
}

/**
 * Rate limiter
 */
export class RateLimiter {
  private interval: number;
  private maxCalls: number;
  private calls: number[] = [];

  constructor(interval: number, maxCalls: number) {
    this.interval = interval;
    this.maxCalls = maxCalls;
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove old calls outside the window
    this.calls = this.calls.filter(time => now - time < this.interval);

    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = this.interval - (now - oldestCall);
      if (waitTime > 0) {
        await sleep(waitTime);
        return this.acquire();
      }
    }

    this.calls.push(Date.now());
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    return fn();
  }
}

/**
 * Check if date is within a range
 */
export function isWithinRange(date: Date | string | number, range: TimeRange): boolean {
  const targetDate = toDate(date);
  return targetDate >= range.start && targetDate <= range.end;
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  return toDate(date) < new Date();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  return toDate(date) > new Date();
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string | number): boolean {
  const targetDate = toDate(date);
  const today = new Date();
  return (
    targetDate.getDate() === today.getDate() &&
    targetDate.getMonth() === today.getMonth() &&
    targetDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  const targetDate = toDate(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    targetDate.getDate() === yesterday.getDate() &&
    targetDate.getMonth() === yesterday.getMonth() &&
    targetDate.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string | number): Date {
  const d = toDate(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string | number): Date {
  const d = toDate(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Get start of week (Sunday)
 */
export function startOfWeek(date: Date | string | number): Date {
  const d = toDate(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of week (Saturday)
 */
export function endOfWeek(date: Date | string | number): Date {
  const d = toDate(date);
  const day = d.getDay();
  const end = new Date(d);
  end.setDate(d.getDate() + (6 - day));
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date | string | number): Date {
  const d = toDate(date);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date | string | number): Date {
  const d = toDate(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get start of year
 */
export function startOfYear(date: Date | string | number): Date {
  const d = toDate(date);
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

/**
 * Get end of year
 */
export function endOfYear(date: Date | string | number): Date {
  const d = toDate(date);
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * Add time to date
 */
export function addTime(
  date: Date | string | number,
  amount: number,
  unit: TimeUnit
): Date {
  const d = toDate(date);
  const result = new Date(d);

  switch (unit) {
    case 'ms':
      result.setMilliseconds(d.getMilliseconds() + amount);
      break;
    case 's':
      result.setSeconds(d.getSeconds() + amount);
      break;
    case 'm':
      result.setMinutes(d.getMinutes() + amount);
      break;
    case 'h':
      result.setHours(d.getHours() + amount);
      break;
    case 'd':
      result.setDate(d.getDate() + amount);
      break;
    case 'w':
      result.setDate(d.getDate() + amount * 7);
      break;
    case 'M':
      result.setMonth(d.getMonth() + amount);
      break;
    case 'y':
      result.setFullYear(d.getFullYear() + amount);
      break;
  }

  return result;
}

/**
 * Subtract time from date
 */
export function subtractTime(
  date: Date | string | number,
  amount: number,
  unit: TimeUnit
): Date {
  return addTime(date, -amount, unit);
}

/**
 * Get difference between two dates
 */
export function difference(
  date1: Date | string | number,
  date2: Date | string | number,
  unit: TimeUnit = 'ms'
): number {
  const d1 = toDate(date1);
  const d2 = toDate(date2);
  const diff = d1.getTime() - d2.getTime();

  switch (unit) {
    case 'ms':
      return diff;
    case 's':
      return Math.floor(diff / MS_PER_SECOND);
    case 'm':
      return Math.floor(diff / MS_PER_MINUTE);
    case 'h':
      return Math.floor(diff / MS_PER_HOUR);
    case 'd':
      return Math.floor(diff / MS_PER_DAY);
    case 'w':
      return Math.floor(diff / MS_PER_WEEK);
    case 'M':
      return Math.floor(diff / MS_PER_MONTH);
    case 'y':
      return Math.floor(diff / MS_PER_YEAR);
    default:
      return diff;
  }
}

/**
 * Get time components from date
 */
export function getTimeComponents(date: Date | string | number): TimeComponents {
  const d = toDate(date);
  return {
    years: d.getFullYear(),
    months: d.getMonth(),
    days: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    milliseconds: d.getMilliseconds(),
  };
}

/**
 * Format date to ISO string without milliseconds
 */
export function formatIsoNoMs(date: Date | string | number): string {
  const d = toDate(date);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Format date to local string
 */
export function formatLocal(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = toDate(date);
  return d.toLocaleString(undefined, options);
}

/**
 * Format date to custom format string
 */
export function format(
  date: Date | string | number,
  formatStr: string
): string {
  const d = toDate(date);
  const components = getTimeComponents(d);

  const replacements: Record<string, string | number> = {
    'YYYY': components.years,
    'YY': String(components.years).slice(-2),
    'MM': String(components.months + 1).padStart(2, '0'),
    'M': String(components.months + 1),
    'DD': String(components.days).padStart(2, '0'),
    'D': String(components.days),
    'HH': String(components.hours).padStart(2, '0'),
    'H': String(components.hours),
    'hh': String(components.hours % 12 || 12).padStart(2, '0'),
    'h': String(components.hours % 12 || 12),
    'mm': String(components.minutes).padStart(2, '0'),
    'm': String(components.minutes),
    'ss': String(components.seconds).padStart(2, '0'),
    's': String(components.seconds),
    'SSS': String(components.milliseconds).padStart(3, '0'),
    'A': components.hours >= 12 ? 'PM' : 'AM',
    'a': components.hours >= 12 ? 'pm' : 'am',
  };

  let result = formatStr;
  for (const [token, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(token, 'g'), String(value));
  }

  return result;
}

/**
 * Parse date from custom format string
 */
export function parse(dateStr: string, formatStr: string): Date {
  const replacements: Record<string, string> = {};

  const tokens = ['YYYY', 'YY', 'MM', 'M', 'DD', 'D', 'HH', 'H', 'hh', 'h', 'mm', 'm', 'ss', 's', 'SSS', 'A', 'a'];

  let pattern = formatStr;
  for (const token of tokens) {
    if (pattern.includes(token)) {
      const groupName = token.toLowerCase();
      let regex: string;

      switch (token) {
        case 'YYYY':
          regex = '(\\d{4})';
          break;
        case 'YY':
          regex = '(\\d{2})';
          break;
        case 'MM':
          regex = '(\\d{2})';
          break;
        case 'M':
          regex = '(\\d{1,2})';
          break;
        case 'DD':
          regex = '(\\d{2})';
          break;
        case 'D':
          regex = '(\\d{1,2})';
          break;
        case 'HH':
        case 'hh':
          regex = '(\\d{2})';
          break;
        case 'H':
        case 'h':
          regex = '(\\d{1,2})';
          break;
        case 'mm':
          regex = '(\\d{2})';
          break;
        case 'm':
          regex = '(\\d{1,2})';
          break;
        case 'ss':
          regex = '(\\d{2})';
          break;
        case 's':
          regex = '(\\d{1,2})';
          break;
        case 'SSS':
          regex = '(\\d{3})';
          break;
        case 'A':
        case 'a':
          regex = '([APap][Mm])';
          break;
        default:
          regex = '';
      }

      if (regex) {
        replacements[groupName] = token;
        pattern = pattern.replace(token, regex);
      }
    }
  }

  const regex = new RegExp(`^${pattern}$`);
  const match = dateStr.match(regex);

  if (!match) {
    throw new Error(`Date string "${dateStr}" does not match format "${formatStr}"`);
  }

  let year = 1970;
  let month = 0;
  let day = 1;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let milliseconds = 0;
  let isPM = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const value = match[i + 1];
    if (!value) continue;

    switch (token) {
      case 'YYYY':
        year = parseInt(value, 10);
        break;
      case 'YY':
        year = 2000 + parseInt(value, 10);
        break;
      case 'MM':
      case 'M':
        month = parseInt(value, 10) - 1;
        break;
      case 'DD':
      case 'D':
        day = parseInt(value, 10);
        break;
      case 'HH':
      case 'H':
        hours = parseInt(value, 10);
        break;
      case 'hh':
      case 'h':
        hours = parseInt(value, 10);
        break;
      case 'mm':
      case 'm':
        minutes = parseInt(value, 10);
        break;
      case 'ss':
      case 's':
        seconds = parseInt(value, 10);
        break;
      case 'SSS':
        milliseconds = parseInt(value, 10);
        break;
      case 'A':
      case 'a':
        isPM = value.toLowerCase() === 'pm';
        break;
    }
  }

  // Adjust for 12-hour format
  if (isPM && hours < 12) {
    hours += 12;
  } else if (!isPM && hours === 12) {
    hours = 0;
  }

  return new Date(year, month, day, hours, minutes, seconds, milliseconds);
}

/**
 * Get days in month
 */
export function getDaysInMonth(date: Date | string | number): number {
  const d = toDate(date);
  return endOfMonth(d).getDate();
}

/**
 * Check if year is leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Get week number of year
 */
export function getWeekNumber(date: Date | string | number): number {
  const d = toDate(date);
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Get quarter of year
 */
export function getQuarter(date: Date | string | number): number {
  const d = toDate(date);
  return Math.floor(d.getMonth() / 3) + 1;
}

/**
 * Get timezone offset in minutes
 */
export function getTimezoneOffset(date: Date | string | number = new Date()): number {
  const d = toDate(date);
  return d.getTimezoneOffset();
}

/**
 * Get timezone name
 */
export function getTimezoneName(date: Date | string | number = new Date()): string {
  const d = toDate(date);
  return d.toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2];
}

/**
 * Create a time range
 */
export function createTimeRange(start: Date | string | number, end: Date | string | number): TimeRange {
  return {
    start: toDate(start),
    end: toDate(end),
  };
}

/**
 * Check if two time ranges overlap
 */
export function rangesOverlap(range1: TimeRange, range2: TimeRange): boolean {
  return range1.start <= range2.end && range2.start <= range1.end;
}

/**
 * Get intersection of two time ranges
 */
export function getRangeIntersection(range1: TimeRange, range2: TimeRange): TimeRange | null {
  if (!rangesOverlap(range1, range2)) {
    return null;
  }

  return {
    start: new Date(Math.max(range1.start.getTime(), range2.start.getTime())),
    end: new Date(Math.min(range1.end.getTime(), range2.end.getTime())),
  };
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Measure synchronous execution time
 */
export function measureTimeSync<T>(fn: () => T): { result: T; duration: number } {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Create a timeout promise
 */
export function timeout(ms: number, reason?: any): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(reason ?? new Error(`Timeout after ${ms}ms`)), ms);
  });
}

/**
 * Race a promise against a timeout
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, reason?: any): Promise<T> {
  return Promise.race([promise, timeout(ms, reason)]);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (error: Error, attempt: number) => void;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        options?.onRetry?.(lastError, attempt + 1);
        await sleepWithBackoff(attempt, {
          baseDelay: options?.baseDelay,
          maxDelay: options?.maxDelay,
          factor: options?.factor,
        });
      }
    }
  }

  throw lastError;
}
