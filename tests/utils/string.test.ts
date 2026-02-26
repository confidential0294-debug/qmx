/**
 * Tests for String Utilities
 */

import { describe, it, expect } from 'vitest';

describe('String Utilities', () => {
  describe('Case Conversion', () => {
    it('should convert to camelCase', () => {
      const toCamelCase = (str: string): string => {
        const words = str.split(/[-_\s]+/);
        return words
          .map((word, index) => {
            if (index === 0) return word.toLowerCase();
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join('');
      };

      expect(toCamelCase('hello world')).toBe('helloWorld');
      expect(toCamelCase('hello-world')).toBe('helloWorld');
      expect(toCamelCase('hello_world')).toBe('helloWorld');
    });

    it('should convert to PascalCase', () => {
      const toPascalCase = (str: string): string => {
        return str
          .split(/[-_\s]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('');
      };

      expect(toPascalCase('hello world')).toBe('HelloWorld');
      expect(toPascalCase('hello-world')).toBe('HelloWorld');
    });

    it('should convert to kebab-case', () => {
      const toKebabCase = (str: string): string => {
        return str
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .toLowerCase();
      };

      expect(toKebabCase('helloWorld')).toBe('hello-world');
      expect(toKebabCase('HelloWorld')).toBe('hello-world');
    });

    it('should convert to snake_case', () => {
      const toSnakeCase = (str: string): string => {
        return str
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .toLowerCase();
      };

      expect(toSnakeCase('helloWorld')).toBe('hello_world');
    });

    it('should convert to CONSTANT_CASE', () => {
      const toConstantCase = (str: string): string => {
        return str
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .toUpperCase();
      };

      expect(toConstantCase('helloWorld')).toBe('HELLO_WORLD');
    });

    it('should convert to Title Case', () => {
      const toTitleCase = (str: string): string => {
        const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to'];

        return str
          .toLowerCase()
          .split(/\s+/)
          .map((word, index) => {
            if (index === 0 || index === str.split(/\s+/).length - 1) {
              return word.charAt(0).toUpperCase() + word.slice(1);
            }
            if (smallWords.includes(word)) {
              return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(' ');
      };

      expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    });
  });

  describe('Capitalization', () => {
    it('should capitalize first letter', () => {
      const capitalize = (str: string): string => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('should capitalize each word', () => {
      const capitalizeWords = (str: string): string => {
        return str
          .split(/\s+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      expect(capitalizeWords('hello world')).toBe('Hello World');
    });

    it('should uncapitalize first letter', () => {
      const uncapitalize = (str: string): string => {
        if (!str) return '';
        return str.charAt(0).toLowerCase() + str.slice(1);
      };

      expect(uncapitalize('Hello')).toBe('hello');
    });
  });

  describe('String Truncation', () => {
    it('should truncate string to length', () => {
      const truncate = (str: string, length: number, suffix: string = '...'): string => {
        if (str.length <= length) return str;
        return str.slice(0, length) + suffix;
      };

      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Hi', 5)).toBe('Hi');
    });

    it('should truncate at word boundary', () => {
      const truncateAtWord = (str: string, length: number, suffix: string = '...'): string => {
        if (str.length <= length) return str;
        let truncated = str.slice(0, length);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) {
          truncated = truncated.slice(0, lastSpace);
        }
        return truncated + suffix;
      };

      expect(truncateAtWord('Hello World Test', 12)).toBe('Hello...');
    });

    it('should truncate from middle', () => {
      const truncateMiddle = (str: string, maxLength: number, separator: string = '...'): string => {
        if (str.length <= maxLength) return str;
        const separatorLength = separator.length;
        const charsToShow = maxLength - separatorLength;
        const frontChars = Math.ceil(charsToShow / 2);
        const backChars = Math.floor(charsToShow / 2);
        return str.slice(0, frontChars) + separator + str.slice(-backChars);
      };

      expect(truncateMiddle('Hello World', 8)).toContain('...');
    });
  });

  describe('String Padding', () => {
    it('should pad left', () => {
      const padLeft = (str: string, length: number, char: string = ' '): string => {
        const padding = char.repeat(Math.max(0, length - str.length));
        return padding + str.slice(0, length);
      };

      expect(padLeft('5', 3, '0')).toBe('005');
      expect(padLeft('hello', 10)).toBe('     hello');
    });

    it('should pad right', () => {
      const padRight = (str: string, length: number, char: string = ' '): string => {
        const padding = char.repeat(Math.max(0, length - str.length));
        return str.slice(0, length) + padding;
      };

      expect(padRight('hello', 10)).toBe('hello     ');
    });

    it('should pad both sides', () => {
      const padBoth = (str: string, length: number, char: string = ' '): string => {
        if (str.length >= length) return str.slice(0, length);
        const totalPadding = length - str.length;
        const leftPadding = Math.floor(totalPadding / 2);
        const rightPadding = totalPadding - leftPadding;
        return char.repeat(leftPadding) + str + char.repeat(rightPadding);
      };

      expect(padBoth('hello', 11)).toBe('  hello  ');
    });
  });

  describe('String Trimming', () => {
    it('should trim whitespace', () => {
      expect('  hello  '.trim()).toBe('hello');
    });

    it('should trim specific characters', () => {
      const trim = (str: string, chars: string): string => {
        const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^[${escaped}]+|[${escaped}]+$`, 'g');
        return str.replace(regex, '');
      };

      expect(trim('---hello---', '-')).toBe('hello');
    });

    it('should trim left only', () => {
      const trimLeft = (str: string): string => {
        return str.trimStart();
      };

      expect(trimLeft('  hello  ')).toBe('hello  ');
    });

    it('should trim right only', () => {
      const trimRight = (str: string): string => {
        return str.trimEnd();
      };

      expect(trimRight('  hello  ')).toBe('  hello');
    });
  });

  describe('String Splitting', () => {
    it('should split by separator', () => {
      const split = (str: string, separator: string): string[] => {
        return str.split(separator);
      };

      expect(split('a,b,c', ',')).toEqual(['a', 'b', 'c']);
    });

    it('should split into lines', () => {
      const splitLines = (str: string): string[] => {
        return str.split(/\r\n|\r|\n/);
      };

      expect(splitLines('line1\nline2\nline3')).toHaveLength(3);
    });

    it('should split with options', () => {
      const split = (str: string, separator: string, options?: { removeEmpty?: boolean; trim?: boolean }): string[] => {
        let parts = str.split(separator);
        if (options?.trim) parts = parts.map(p => p.trim());
        if (options?.removeEmpty) parts = parts.filter(p => p.length > 0);
        return parts;
      };

      expect(split('a,,b,,c', ',', { removeEmpty: true })).toEqual(['a', 'b', 'c']);
      expect(split(' a , b , c ', ',', { trim: true })).toEqual(['a', 'b', 'c']);
    });
  });

  describe('String Joining', () => {
    it('should join with separator', () => {
      expect(['a', 'b', 'c'].join(',')).toBe('a,b,c');
    });

    it('should join with Oxford comma', () => {
      const joinWithOxford = (items: string[], separator: string = ', '): string => {
        if (items.length === 0) return '';
        if (items.length === 1) return items[0];
        if (items.length === 2) return items.join(' and ');
        return items.slice(0, -1).join(separator) + separator + 'and ' + items[items.length - 1];
      };

      expect(joinWithOxford(['a'])).toBe('a');
      expect(joinWithOxford(['a', 'b'])).toBe('a and b');
      expect(joinWithOxford(['a', 'b', 'c'])).toBe('a, b, and c');
    });

    it('should natural join', () => {
      const naturalJoin = (items: string[], options?: { separator?: string; conjunction?: string }): string => {
        const opts = { separator: ', ', conjunction: 'and', ...options };
        if (items.length === 0) return '';
        if (items.length === 1) return items[0];
        if (items.length === 2) return items.join(` ${opts.conjunction} `);
        return items.slice(0, -1).join(opts.separator) + opts.separator + opts.conjunction + ' ' + items[items.length - 1];
      };

      expect(naturalJoin(['a', 'b', 'c'])).toBe('a, b, and c');
      expect(naturalJoin(['a', 'b', 'c'], { conjunction: 'or' })).toBe('a, b, or c');
    });
  });

  describe('String Interpolation', () => {
    it('should interpolate template', () => {
      const interpolate = (template: string, values: Record<string, any>): string => {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
          return key in values ? String(values[key]) : match;
        });
      };

      const result = interpolate('Hello {name}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should handle missing variables', () => {
      const interpolate = (template: string, values: Record<string, any>, defaultValue: string = ''): string => {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
          return key in values ? String(values[key]) : defaultValue;
        });
      };

      const result = interpolate('Hello {name}!', {}, '[missing]');
      expect(result).toBe('Hello [missing]!');
    });
  });

  describe('HTML Operations', () => {
    it('should escape HTML', () => {
      const escapeHtml = (str: string): string => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        };
        return str.replace(/[&<>"']/g, char => entities[char]);
      };

      expect(escapeHtml('<script>alert("xss")</script>')).toContain('&lt;');
    });

    it('should unescape HTML', () => {
      const unescapeHtml = (str: string): string => {
        const entities: Record<string, string> = {
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&quot;': '"',
          '&#39;': "'",
        };
        return str.replace(/&(amp|lt|gt|quot|#39);/g, match => entities[match] || match);
      };

      expect(unescapeHtml('&lt;hello&gt;')).toBe('<hello>');
    });

    it('should strip HTML tags', () => {
      const stripHtml = (str: string): string => {
        return str.replace(/<[^>]*>/g, '');
      };

      expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
    });
  });

  describe('Regex Operations', () => {
    it('should escape regex characters', () => {
      const escapeRegex = (str: string): string => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };

      expect(escapeRegex('hello.world')).toBe('hello\\.world');
      expect(escapeRegex('test*pattern')).toBe('test\\*pattern');
    });

    it('should count occurrences', () => {
      const countOccurrences = (str: string, search: string): number => {
        if (!search) return 0;
        return str.split(search).length - 1;
      };

      expect(countOccurrences('hello hello hello', 'hello')).toBe(3);
      expect(countOccurrences('hello', 'x')).toBe(0);
    });

    it('should count regex matches', () => {
      const countMatches = (str: string, pattern: string): number => {
        const regex = new RegExp(pattern, 'g');
        const matches = str.match(regex);
        return matches ? matches.length : 0;
      };

      expect(countMatches('abc123def456', '\\d+')).toBe(2);
    });
  });

  describe('String Searching', () => {
    it('should check if contains', () => {
      const contains = (str: string, search: string, caseSensitive: boolean = true): boolean => {
        if (!caseSensitive) {
          return str.toLowerCase().includes(search.toLowerCase());
        }
        return str.includes(search);
      };

      expect(contains('Hello World', 'world', false)).toBe(true);
      expect(contains('Hello World', 'world', true)).toBe(false);
    });

    it('should check if starts with', () => {
      expect('hello'.startsWith('hel')).toBe(true);
      expect('hello'.startsWith('world')).toBe(false);
    });

    it('should check if ends with', () => {
      expect('hello'.endsWith('llo')).toBe(true);
      expect('hello'.endsWith('world')).toBe(false);
    });

    it('should remove prefix', () => {
      const removePrefix = (str: string, prefix: string): string => {
        if (str.startsWith(prefix)) {
          return str.slice(prefix.length);
        }
        return str;
      };

      expect(removePrefix('prefix_value', 'prefix_')).toBe('value');
    });

    it('should remove suffix', () => {
      const removeSuffix = (str: string, suffix: string): string => {
        if (str.endsWith(suffix)) {
          return str.slice(0, -suffix.length);
        }
        return str;
      };

      expect(removeSuffix('value.txt', '.txt')).toBe('value');
    });
  });

  describe('String Replacement', () => {
    it('should replace first occurrence', () => {
      const replaceFirst = (str: string, search: string, replacement: string): string => {
        const index = str.indexOf(search);
        if (index === -1) return str;
        return str.slice(0, index) + replacement + str.slice(index + search.length);
      };

      expect(replaceFirst('hello hello', 'hello', 'hi')).toBe('hi hello');
    });

    it('should replace last occurrence', () => {
      const replaceLast = (str: string, search: string, replacement: string): string => {
        const index = str.lastIndexOf(search);
        if (index === -1) return str;
        return str.slice(0, index) + replacement + str.slice(index + search.length);
      };

      expect(replaceLast('hello hello', 'hello', 'hi')).toBe('hello hi');
    });

    it('should replace all occurrences', () => {
      const replaceAll = (str: string, search: string, replacement: string): string => {
        return str.split(search).join(replacement);
      };

      expect(replaceAll('hello hello', 'hello', 'hi')).toBe('hi hi');
    });
  });

  describe('String Extraction', () => {
    it('should get substring between delimiters', () => {
      const between = (str: string, start: string, end: string): string => {
        const startIndex = str.indexOf(start);
        if (startIndex === -1) return '';
        const endIndex = str.indexOf(end, startIndex + start.length);
        if (endIndex === -1) return '';
        return str.slice(startIndex + start.length, endIndex);
      };

      expect(between('Hello [World]!', '[', ']')).toBe('World');
    });

    it('should get substring before delimiter', () => {
      const before = (str: string, delimiter: string): string => {
        const index = str.indexOf(delimiter);
        return index === -1 ? str : str.slice(0, index);
      };

      expect(before('hello@world', '@')).toBe('hello');
    });

    it('should get substring after delimiter', () => {
      const after = (str: string, delimiter: string): string => {
        const index = str.indexOf(delimiter);
        return index === -1 ? '' : str.slice(index + delimiter.length);
      };

      expect(after('hello@world', '@')).toBe('world');
    });
  });

  describe('String Comparison', () => {
    it('should compare strings', () => {
      expect('a'.localeCompare('b')).toBeLessThan(0);
      expect('b'.localeCompare('a')).toBeGreaterThan(0);
      expect('a'.localeCompare('a')).toBe(0);
    });

    it('should compare case-insensitively', () => {
      const compare = (a: string, b: string): number => {
        return a.localeCompare(b, undefined, { sensitivity: 'base' });
      };

      expect(compare('A', 'a')).toBe(0);
      expect(compare('ABC', 'abc')).toBe(0);
    });

    it('should check equality', () => {
      const equals = (a: string, b: string, caseSensitive: boolean = true): boolean => {
        if (!caseSensitive) {
          return a.toLowerCase() === b.toLowerCase();
        }
        return a === b;
      };

      expect(equals('Hello', 'hello', false)).toBe(true);
      expect(equals('Hello', 'hello', true)).toBe(false);
    });
  });

  describe('String Manipulation', () => {
    it('should reverse string', () => {
      const reverse = (str: string): string => {
        return str.split('').reverse().join('');
      };

      expect(reverse('hello')).toBe('olleh');
    });

    it('should repeat string', () => {
      expect('ab'.repeat(3)).toBe('ababab');
    });

    it('should insert at position', () => {
      const insert = (str: string, substring: string, position: number): string => {
        const pos = Math.max(0, Math.min(position, str.length));
        return str.slice(0, pos) + substring + str.slice(pos);
      };

      expect(insert('helo', 'l', 2)).toBe('hello');
    });
  });
});
