/**
 * QMX String Utilities
 *
 * Comprehensive string manipulation and formatting utilities
 * for consistent text processing across the application.
 */

/**
 * Case conversion options
 */
export interface CaseOptions {
  /** Preserve acronyms (e.g., "XML" stays "XML") */
  preserveAcronyms?: boolean;
  /** Locale for case conversion */
  locale?: string;
}

/**
 * Truncate options
 */
export interface TruncateOptions {
  /** Maximum length */
  length: number;
  /** Suffix to add when truncated */
  suffix?: string;
  /** Truncate at word boundary */
  atWordBoundary?: boolean;
  /** Preserve HTML tags */
  preserveHtml?: boolean;
}

/**
 * Template interpolation options
 */
export interface TemplateOptions {
  /** Prefix for template variables */
  prefix?: string;
  /** Suffix for template variables */
  suffix?: string;
  /** Escape HTML in values */
  escapeHtml?: boolean;
  /** Throw on missing variables */
  throwOnMissing?: boolean;
  /** Default value for missing variables */
  defaultValue?: string;
}

/**
 * Split options
 */
export interface SplitOptions {
  /** Remove empty strings from result */
  removeEmpty?: boolean;
  /** Trim each part */
  trim?: boolean;
  /** Maximum number of splits */
  limit?: number;
}

/**
 * Pad options
 */
export interface PadOptions {
  /** Character to pad with */
  char?: string;
  /** Pad direction */
  direction?: 'left' | 'right' | 'both';
}

/**
 * Wrap options
 */
export interface WrapOptions {
  /** Maximum line width */
  width: number;
  /** Indentation for first line */
  indent?: string;
  /** Indentation for subsequent lines */
  indentNext?: string;
  /** Break on word boundaries */
  breakOnWords?: boolean;
}

/**
 * Highlight options
 */
export interface HighlightOptions {
  /** Case insensitive matching */
  caseInsensitive?: boolean;
  /** Highlight all occurrences */
  all?: boolean;
  /** HTML tag for highlighting */
  tag?: string;
  /** CSS class for highlighting */
  className?: string;
}

/**
 * Diff result
 */
export interface DiffResult {
  added: string[];
  removed: string[];
  unchanged: string[];
}

/**
 * Levenshtein distance result
 */
export interface LevenshteinResult {
  distance: number;
  similarity: number;
}

// String constants
export const WHITESPACE = ' \t\n\r\f\v';
export const LINE_BREAKS = /\r\n|\r|\n/g;
export const MULTIPLE_SPACES = /  +/g;
export const TRAILING_SLASH = /\/$/;
export const LEADING_SLASH = /^\//;

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string, options?: CaseOptions): string {
  const words = splitWords(str);
  const preserveAcronyms = options?.preserveAcronyms ?? false;

  return words
    .map((word, index) => {
      if (index === 0) {
        return preserveAcronyms && isAcronym(word) ? word.toUpperCase() : word.toLowerCase();
      }
      return capitalize(word, options);
    })
    .join('');
}

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string, options?: CaseOptions): string {
  const words = splitWords(str);
  return words.map(word => capitalize(word, options)).join('');
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  const words = splitWords(str);
  return words.map(word => word.toLowerCase()).join('-');
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str: string): string {
  const words = splitWords(str);
  return words.map(word => word.toLowerCase()).join('_');
}

/**
 * Convert string to CONSTANT_CASE
 */
export function toConstantCase(str: string): string {
  const words = splitWords(str);
  return words.map(word => word.toUpperCase()).join('_');
}

/**
 * Convert string to dot.case
 */
export function toDotCase(str: string): string {
  const words = splitWords(str);
  return words.map(word => word.toLowerCase()).join('.');
}

/**
 * Convert string to path/case
 */
export function toPathCase(str: string): string {
  const words = splitWords(str);
  return words.map(word => word.toLowerCase()).join('/');
}

/**
 * Convert string to Title Case
 */
export function toTitleCase(str: string, options?: { smallWords?: string[] }): string {
  const smallWords = options?.smallWords ?? ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];
  
  const words = str.toLowerCase().split(/\s+/);
  
  return words
    .map((word, index) => {
      // Always capitalize first and last word
      if (index === 0 || index === words.length - 1) {
        return capitalize(word);
      }
      // Don't capitalize small words
      if (smallWords.includes(word)) {
        return word;
      }
      return capitalize(word);
    })
    .join(' ');
}

/**
 * Convert string to sentence case
 */
export function toSentenceCase(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return '';
  
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string, options?: CaseOptions): string {
  if (!str) return '';
  const locale = options?.locale;
  return str.charAt(0).toLocaleUpperCase(locale) + str.slice(1).toLocaleLowerCase(locale);
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string, options?: CaseOptions): string {
  return str
    .split(/\s+/)
    .map(word => capitalize(word, options))
    .join(' ');
}

/**
 * Lowercase first letter of string
 */
export function uncapitalize(str: string, options?: CaseOptions): string {
  if (!str) return '';
  const locale = options?.locale;
  return str.charAt(0).toLocaleLowerCase(locale) + str.slice(1);
}

/**
 * Split string into words
 */
export function splitWords(str: string): string[] {
  // Handle camelCase, PascalCase, kebab-case, snake_case, and spaces
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // XMLParser -> XML Parser
    .replace(/[-_./\\]/g, ' ') // Replace separators with space
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Check if string is an acronym
 */
export function isAcronym(str: string): boolean {
  return /^[A-Z]{2,}$/.test(str);
}

/**
 * Truncate string to maximum length
 */
export function truncate(str: string, options: number | TruncateOptions): string {
  const opts: TruncateOptions = typeof options === 'number'
    ? { length: options, suffix: '...' }
    : { suffix: '...', ...options };

  if (str.length <= opts.length) return str;

  let truncated = str.slice(0, opts.length);

  if (opts.atWordBoundary) {
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.slice(0, lastSpace);
    }
  }

  return truncated + (opts.suffix ?? '');
}

/**
 * Truncate from the middle (elipsis in center)
 */
export function truncateMiddle(str: string, maxLength: number, separator: string = '...'): string {
  if (str.length <= maxLength) return str;

  const separatorLength = separator.length;
  const charsToShow = maxLength - separatorLength;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return str.slice(0, frontChars) + separator + str.slice(-backChars);
}

/**
 * Pad string on the left
 */
export function padLeft(str: string, length: number, char: string = ' '): string {
  const padding = char.repeat(Math.max(0, length - str.length));
  return padding + str.slice(0, length);
}

/**
 * Pad string on the right
 */
export function padRight(str: string, length: number, char: string = ' '): string {
  const padding = char.repeat(Math.max(0, length - str.length));
  return str.slice(0, length) + padding;
}

/**
 * Pad string on both sides
 */
export function padBoth(str: string, length: number, char: string = ' '): string {
  if (str.length >= length) return str.slice(0, length);

  const totalPadding = length - str.length;
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;

  return char.repeat(leftPadding) + str + char.repeat(rightPadding);
}

/**
 * Pad string with options
 */
export function pad(str: string, length: number, options?: PadOptions): string {
  const opts: Required<PadOptions> = {
    char: ' ',
    direction: 'left',
    ...options,
  };

  switch (opts.direction) {
    case 'left':
      return padLeft(str, length, opts.char);
    case 'right':
      return padRight(str, length, opts.char);
    case 'both':
      return padBoth(str, length, opts.char);
  }
}

/**
 * Trim whitespace from string
 */
export function trim(str: string, chars?: string): string {
  if (chars) {
    const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^[${escaped}]+|[${escaped}]+$`, 'g');
    return str.replace(regex, '');
  }
  return str.trim();
}

/**
 * Trim from left only
 */
export function trimLeft(str: string, chars?: string): string {
  if (chars) {
    const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^[${escaped}]+`);
    return str.replace(regex, '');
  }
  return str.trimStart();
}

/**
 * Trim from right only
 */
export function trimRight(str: string, chars?: string): string {
  if (chars) {
    const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`[${escaped}]+$`);
    return str.replace(regex, '');
  }
  return str.trimEnd();
}

/**
 * Remove all whitespace from string
 */
export function removeWhitespace(str: string): string {
  return str.replace(/\s/g, '');
}

/**
 * Normalize whitespace (multiple spaces to single)
 */
export function normalizeWhitespace(str: string): string {
  return str.replace(MULTIPLE_SPACES, ' ').trim();
}

/**
 * Normalize line breaks to \n
 */
export function normalizeLineBreaks(str: string): string {
  return str.replace(LINE_BREAKS, '\n');
}

/**
 * Split string by separator
 */
export function split(str: string, separator: string | RegExp, options?: SplitOptions): string[] {
  const opts: Required<SplitOptions> = {
    removeEmpty: false,
    trim: false,
    limit: Infinity,
    ...options,
  };

  let parts = str.split(separator);

  if (opts.trim) {
    parts = parts.map(p => p.trim());
  }

  if (opts.removeEmpty) {
    parts = parts.filter(p => p.length > 0);
  }

  if (opts.limit < Infinity) {
    parts = parts.slice(0, opts.limit);
  }

  return parts;
}

/**
 * Split string into lines
 */
export function splitLines(str: string, options?: { removeEmpty?: boolean }): string[] {
  return split(str, LINE_BREAKS, { removeEmpty: options?.removeEmpty });
}

/**
 * Join array with separator
 */
export function join(items: any[], separator: string = ''): string {
  return items.join(separator);
}

/**
 * Join with Oxford comma
 */
export function joinWithOxford(items: string[], separator: string = ', '): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  
  return items.slice(0, -1).join(separator) + separator + 'and ' + items[items.length - 1];
}

/**
 * Natural join with custom conjunction
 */
export function naturalJoin(items: string[], options?: { separator?: string; conjunction?: string }): string {
  const opts = { separator: ', ', conjunction: 'and', ...options };
  
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(` ${opts.conjunction} `);
  
  return items.slice(0, -1).join(opts.separator) + opts.separator + opts.conjunction + ' ' + items[items.length - 1];
}

/**
 * Interpolate template string with values
 */
export function interpolate(template: string, values: Record<string, any>, options?: TemplateOptions): string {
  const opts: Required<TemplateOptions> = {
    prefix: '{',
    suffix: '}',
    escapeHtml: false,
    throwOnMissing: false,
    defaultValue: '',
    ...options,
  };

  const pattern = new RegExp(
    `${escapeRegex(opts.prefix)}([^${escapeRegex(opts.suffix)}]+)${escapeRegex(opts.suffix)}`,
    'g'
  );

  return template.replace(pattern, (_match, key) => {
    const trimmedKey = key.trim();
    
    if (!(trimmedKey in values)) {
      if (opts.throwOnMissing) {
        throw new Error(`Missing template variable: ${trimmedKey}`);
      }
      return opts.defaultValue;
    }

    let value = String(values[trimmedKey]);
    
    if (opts.escapeHtml) {
      value = escapeHtml(value);
    }

    return value;
  });
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return str.replace(/[&<>"']/g, char => htmlEntities[char]);
}

/**
 * Unescape HTML special characters
 */
export function unescapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  const regex = /&(amp|lt|gt|quot|#39|apos);/g;
  return str.replace(regex, match => htmlEntities[match] || match);
}

/**
 * Escape regex special characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Unescape regex special characters
 */
export function unescapeRegex(str: string): string {
  return str.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
}

/**
 * Escape JSON special characters
 */
export function escapeJson(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Wrap text to specified width
 */
export function wrap(str: string, options: number | WrapOptions): string {
  const opts: Required<WrapOptions> = typeof options === 'number'
    ? { width: options, indent: '', indentNext: '', breakOnWords: true }
    : { breakOnWords: true, indent: '', indentNext: '', ...options };

  const lines: string[] = [];
  const indent = opts.indent;
  const indentNext = opts.indentNext || indent;

  const paragraphs = str.split('\n\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    let currentLine = indent;

    for (const word of words) {
      if (!word) continue;

      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= opts.width) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = indentNext + word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    lines.push('');
  }

  // Remove trailing empty line
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

/**
 * Indent each line of string
 */
export function indent(str: string, spaces: number | string = 2): string {
  const indentStr = typeof spaces === 'number' ? ' '.repeat(spaces) : spaces;
  return str
    .split('\n')
    .map(line => indentStr + line)
    .join('\n');
}

/**
 * Remove common indentation from string
 */
export function dedent(str: string): string {
  const lines = str.split('\n');
  
  // Find minimum indentation
  const minIndent = lines
    .filter(line => line.trim().length > 0)
    .reduce((min, line) => {
      const indent = line.match(/^\s*/)?.[0]?.length ?? 0;
      return Math.min(min, indent);
    }, Infinity);

  if (minIndent === Infinity || minIndent === 0) return str;

  return lines.map(line => line.slice(minIndent)).join('\n');
}

/**
 * Remove common indentation from template literal
 */
export function dedentTemplate(strings: TemplateStringsArray, ...values: any[]): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += String(values[i]);
    }
  }
  return dedent(result);
}

/**
 * Highlight occurrences of text
 */
export function highlight(str: string, search: string | string[], options?: HighlightOptions): string {
  const opts: Required<HighlightOptions> = {
    caseInsensitive: true,
    all: true,
    tag: 'mark',
    className: 'highlight',
    ...options,
  };

  const searches = Array.isArray(search) ? search : [search];
  let result = str;

  for (const term of searches) {
    const flags = opts.caseInsensitive ? 'gi' : 'g';
    const pattern = escapeRegex(term);
    const regex = new RegExp(`(${pattern})`, flags);
    
    const classAttr = opts.className ? ` class="${opts.className}"` : '';
    const replacement = `<${opts.tag}${classAttr}>$1</${opts.tag}>`;
    
    if (!opts.all) {
      result = result.replace(regex, replacement);
      break;
    }
    result = result.replace(regex, replacement);
  }

  return result;
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Strip ANSI escape codes from string
 */
export function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Count occurrences of substring
 */
export function countOccurrences(str: string, search: string): number {
  if (!search) return 0;
  return (str.split(search).length - 1);
}

/**
 * Count occurrences with regex
 */
export function countMatches(str: string, pattern: string | RegExp): number {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : new RegExp(pattern.source, 'g');
  const matches = str.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Check if string contains substring
 */
export function contains(str: string, search: string, caseSensitive: boolean = true): boolean {
  if (!caseSensitive) {
    return str.toLowerCase().includes(search.toLowerCase());
  }
  return str.includes(search);
}

/**
 * Check if string starts with prefix
 */
export function startsWith(str: string, prefix: string, caseSensitive: boolean = true): boolean {
  if (!caseSensitive) {
    return str.toLowerCase().startsWith(prefix.toLowerCase());
  }
  return str.startsWith(prefix);
}

/**
 * Check if string ends with suffix
 */
export function endsWith(str: string, suffix: string, caseSensitive: boolean = true): boolean {
  if (!caseSensitive) {
    return str.toLowerCase().endsWith(suffix.toLowerCase());
  }
  return str.endsWith(suffix);
}

/**
 * Remove prefix from string
 */
export function removePrefix(str: string, prefix: string, caseSensitive: boolean = true): string {
  if (startsWith(str, prefix, caseSensitive)) {
    return str.slice(prefix.length);
  }
  return str;
}

/**
 * Remove suffix from string
 */
export function removeSuffix(str: string, suffix: string, caseSensitive: boolean = true): string {
  if (endsWith(str, suffix, caseSensitive)) {
    return str.slice(0, -suffix.length);
  }
  return str;
}

/**
 * Remove all occurrences of substring
 */
export function removeAll(str: string, search: string): string {
  return str.split(search).join('');
}

/**
 * Replace first occurrence
 */
export function replaceFirst(str: string, search: string, replacement: string): string {
  const index = str.indexOf(search);
  if (index === -1) return str;
  return str.slice(0, index) + replacement + str.slice(index + search.length);
}

/**
 * Replace last occurrence
 */
export function replaceLast(str: string, search: string, replacement: string): string {
  const index = str.lastIndexOf(search);
  if (index === -1) return str;
  return str.slice(0, index) + replacement + str.slice(index + search.length);
}

/**
 * Replace all occurrences
 */
export function replaceAll(str: string, search: string, replacement: string): string {
  return str.split(search).join(replacement);
}

/**
 * Replace using regex
 */
export function replaceRegex(str: string, pattern: string | RegExp, replacement: string | ((match: string) => string)): string {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : new RegExp(pattern.source, 'g');
  
  if (typeof replacement === 'function') {
    return str.replace(regex, replacement);
  }
  
  return str.replace(regex, replacement);
}

/**
 * Reverse string
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

/**
 * Shuffle characters in string
 */
export function shuffle(str: string): string {
  const chars = str.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Repeat string n times
 */
export function repeat(str: string, count: number, separator?: string): string {
  if (separator) {
    return Array(count).fill(str).join(separator);
  }
  return str.repeat(count);
}

/**
 * Insert substring at position
 */
export function insert(str: string, substring: string, position: number): string {
  const pos = Math.max(0, Math.min(position, str.length));
  return str.slice(0, pos) + substring + str.slice(pos);
}

/**
 * Remove characters from position
 */
export function remove(str: string, start: number, end?: number): string {
  const startPos = Math.max(0, start);
  const endPos = end !== undefined ? Math.min(end, str.length) : str.length;
  return str.slice(0, startPos) + str.slice(endPos);
}

/**
 * Extract substring between delimiters
 */
export function between(str: string, start: string, end: string, options?: { includeDelimiters?: boolean }): string {
  const startIndex = str.indexOf(start);
  if (startIndex === -1) return '';

  const endIndex = str.indexOf(end, startIndex + start.length);
  if (endIndex === -1) return '';

  const contentStart = startIndex + start.length;
  const contentEnd = endIndex;

  if (options?.includeDelimiters) {
    return str.slice(startIndex, endIndex + end.length);
  }

  return str.slice(contentStart, contentEnd);
}

/**
 * Extract substring before delimiter
 */
export function before(str: string, delimiter: string): string {
  const index = str.indexOf(delimiter);
  return index === -1 ? str : str.slice(0, index);
}

/**
 * Extract substring before last delimiter
 */
export function beforeLast(str: string, delimiter: string): string {
  const index = str.lastIndexOf(delimiter);
  return index === -1 ? str : str.slice(0, index);
}

/**
 * Extract substring after delimiter
 */
export function after(str: string, delimiter: string): string {
  const index = str.indexOf(delimiter);
  return index === -1 ? '' : str.slice(index + delimiter.length);
}

/**
 * Extract substring after last delimiter
 */
export function afterLast(str: string, delimiter: string): string {
  const index = str.lastIndexOf(delimiter);
  return index === -1 ? '' : str.slice(index + delimiter.length);
}

/**
 * Get character at position
 */
export function charAt(str: string, position: number): string {
  return str[position] ?? '';
}

/**
 * Get substring from start to end
 */
export function substring(str: string, start: number, end?: number): string {
  return str.substring(start, end);
}

/**
 * Get slice of string (supports negative indices)
 */
export function slice(str: string, start: number, end?: number): string {
  return str.slice(start, end);
}

/**
 * Compare two strings
 */
export function compare(a: string, b: string, caseSensitive: boolean = true): number {
  if (!caseSensitive) {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  }
  return a.localeCompare(b);
}

/**
 * Compare strings naturally (for sorting with numbers)
 */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Check if strings are equal
 */
export function equals(a: string, b: string, caseSensitive: boolean = true): boolean {
  if (!caseSensitive) {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}

/**
 * Calculate Levenshtein distance
 */
export function levenshtein(str1: string, str2: string): LevenshteinResult {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  const similarity = maxLength === 0 ? 1 : 1 - distance / maxLength;

  return { distance, similarity };
}

/**
 * Check if string is similar to another
 */
export function isSimilar(str1: string, str2: string, threshold: number = 0.8): boolean {
  const { similarity } = levenshtein(str1, str2);
  return similarity >= threshold;
}

/**
 * Generate hash of string
 */
export function hash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * Generate simple checksum
 */
export function checksum(str: string): string {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return sum.toString(16).padStart(4, '0');
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Check if string is empty or whitespace
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Check if string is not empty
 */
export function isNotEmpty(str: string | null | undefined): boolean {
  return !isEmpty(str);
}

/**
 * Check if string is blank (empty or whitespace only)
 */
export function isBlank(str: string | null | undefined): boolean {
  return isEmpty(str);
}

/**
 * Check if string is not blank
 */
export function isNotBlank(str: string | null | undefined): boolean {
  return isNotEmpty(str);
}

/**
 * Check if string is numeric
 */
export function isNumeric(str: string): boolean {
  return /^-?\d*\.?\d+$/.test(str);
}

/**
 * Check if string is integer
 */
export function isInteger(str: string): boolean {
  return /^-?\d+$/.test(str);
}

/**
 * Check if string is a valid email
 */
export function isEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Check if string is a valid URL
 */
export function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is JSON
 */
export function isJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is base64
 */
export function isBase64(str: string): boolean {
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(str);
}

/**
 * Check if string is hexadecimal
 */
export function isHex(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str);
}

/**
 * Check if string is UUID
 */
export function isUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if string is credit card number (basic validation)
 */
export function isCreditCard(str: string): boolean {
  const sanitized = str.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(sanitized)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Check if string is phone number (basic validation)
 */
export function isPhoneNumber(str: string): boolean {
  const phoneRegex = /^[\d\s()+-]{10,}$/;
  return phoneRegex.test(str);
}

/**
 * Check if string is IP address
 */
export function isIpAddress(str: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(str) || ipv6Regex.test(str);
}

/**
 * Check if string is a valid variable name
 */
export function isValidVariableName(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

/**
 * Check if string is a valid filename
 */
export function isValidFilename(str: string): boolean {
  const invalidChars = /[<>:"|?*\\]/;
  return !invalidChars.test(str) && str.length > 0 && str.length <= 255;
}

/**
 * Mask sensitive string (e.g., credit cards, SSN)
 */
export function mask(str: string, options?: { visibleChars?: number; maskChar?: string; position?: 'start' | 'end' }): string {
  const opts = {
    visibleChars: 4,
    maskChar: '*',
    position: 'end' as const,
    ...options,
  };

  if (str.length <= opts.visibleChars) {
    return opts.maskChar.repeat(str.length);
  }

  if (opts.position === 'start') {
    return str.slice(0, opts.visibleChars) + opts.maskChar.repeat(str.length - opts.visibleChars);
  }

  return opts.maskChar.repeat(str.length - opts.visibleChars) + str.slice(-opts.visibleChars);
}

/**
 * Redact sensitive patterns from string
 */
export function redact(str: string, patterns?: Array<{ pattern: RegExp; replacement: string }>): string {
  const defaultPatterns = [
    { pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, replacement: '[CARD_REDACTED]' },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  ];

  const patternsToUse = patterns ?? defaultPatterns;
  let result = str;

  for (const { pattern, replacement } of patternsToUse) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Create a string diff between two strings
 */
export function diffStrings(str1: string, str2: string): DiffResult {
  const lines1 = str1.split('\n');
  const lines2 = str2.split('\n');

  const added: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];

  const maxLen = Math.max(lines1.length, lines2.length);

  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i];
    const line2 = lines2[i];

    if (line1 === undefined) {
      added.push(line2);
    } else if (line2 === undefined) {
      removed.push(line1);
    } else if (line1 === line2) {
      unchanged.push(line1);
    } else {
      removed.push(line1);
      added.push(line2);
    }
  }

  return { added, removed, unchanged };
}

/**
 * Convert bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Convert number to ordinal string (1st, 2nd, 3rd, etc.)
 */
export function toOrdinal(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  return `${num}th`;
}

/**
 * Convert number to words (basic implementation)
 */
export function numberToWords(num: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

  if (num === 0) return 'zero';
  if (num < 0) return 'minus ' + numberToWords(-num);

  const convertHundreds = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += ones[Math.floor(n / 100)] + ' hundred';
      n %= 100;
      if (n > 0) str += ' ';
    }
    if (n > 19) {
      str += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) str += ' ' + ones[n];
    } else if (n > 0) {
      str += teens[n - 10];
    }
    return str;
  };

  let result = '';
  let scale = 0;
  const scales = ['', 'thousand', 'million', 'billion', 'trillion'];

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk > 0) {
      const chunkStr = convertHundreds(chunk);
      if (scale > 0) {
        result = chunkStr + ' ' + scales[scale] + (result ? ' ' + result : '');
      } else {
        result = chunkStr + (result ? ' ' + result : '');
      }
    }
    num = Math.floor(num / 1000);
    scale++;
  }

  return result;
}

/**
 * Parse string to number with default
 */
export function parseNumber(str: string, defaultValue: number = 0): number {
  const parsed = Number(str);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse string to boolean
 */
export function parseBoolean(str: string, defaultValue: boolean = false): boolean {
  const lower = str.toLowerCase().trim();
  if (['true', 'yes', '1', 'on'].includes(lower)) return true;
  if (['false', 'no', '0', 'off'].includes(lower)) return false;
  return defaultValue;
}

/**
 * Slugify string for URLs
 */
export function slugify(str: string, options?: { separator?: string; lowercase?: boolean }): string {
  const opts = { separator: '-', lowercase: true, ...options };
  
  let result = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, opts.separator)
    .replace(/-+/g, opts.separator);

  if (opts.lowercase) {
    result = result.toLowerCase();
  }

  return result.replace(/^-+|-+$/g, '');
}

/**
 * Generate random string
 */
export function randomString(length: number = 16, charset?: string): string {
  const defaultCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const chars = charset ?? defaultCharset;
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random alphanumeric string
 */
export function randomAlphanumeric(length: number = 16): string {
  return randomString(length);
}

/**
 * Generate random hex string
 */
export function randomHex(length: number = 16): string {
  return randomString(length, '0123456789abcdef');
}

/**
 * Generate UUID v4
 */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create ellipsis text
 */
export function ellipsis(str: string, maxLength: number): string {
  return truncate(str, { length: maxLength, suffix: '…' });
}

/**
 * Pluralize word
 */
export function pluralize(word: string, count: number, suffix?: string): string {
  if (count === 1) return word;
  return word + (suffix ?? 's');
}

/**
 * Singularize word (basic implementation)
 */
export function singularize(word: string): string {
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('es')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s')) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Convert string to array of characters
 */
export function toCharArray(str: string): string[] {
  return Array.from(str);
}

/**
 * Convert string to array of code points
 */
export function toCodePoints(str: string): number[] {
  return Array.from(str).map(c => c.codePointAt(0)!);
}

/**
 * Get string length accounting for Unicode
 */
export function unicodeLength(str: string): number {
  return Array.from(str).length;
}

/**
 * Reverse string accounting for Unicode surrogate pairs
 */
export function unicodeReverse(str: string): string {
  return Array.from(str).reverse().join('');
}

/**
 * Check if string contains only ASCII characters
 */
export function isAscii(str: string): boolean {
  return /^[\x00-\x7F]*$/.test(str);
}

/**
 * Check if string contains only printable characters
 */
export function isPrintable(str: string): boolean {
  return /^[\x20-\x7E]*$/.test(str);
}

/**
 * Get most frequent character in string
 */
export function mostFrequentChar(str: string): { char: string; count: number } | null {
  if (!str) return null;

  const freq: Record<string, number> = {};
  let maxChar = '';
  let maxCount = 0;

  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
    if (freq[char] > maxCount) {
      maxCount = freq[char];
      maxChar = char;
    }
  }

  return { char: maxChar, count: maxCount };
}

/**
 * Get character frequency map
 */
export function charFrequency(str: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }
  return freq;
}

/**
 * Check if string is palindrome
 */
export function isPalindrome(str: string, ignoreCase: boolean = true, ignoreSpaces: boolean = true): boolean {
  let processed = str;
  if (ignoreCase) processed = processed.toLowerCase();
  if (ignoreSpaces) processed = processed.replace(/\s/g, '');
  
  return processed === processed.split('').reverse().join('');
}

/**
 * Check if string is an anagram of another
 */
export function isAnagram(str1: string, str2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/\s/g, '').split('').sort().join('');
  return normalize(str1) === normalize(str2);
}
