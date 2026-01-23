/**
 * Tests for format utilities
 */
import { describe, it, expect } from 'vitest';
import {
  pluralize,
  pad,
  truncate,
  formatNumber,
  formatPercent,
  formatHz,
  formatDb,
  progressBar,
  barChartLine,
  formatBytes,
  indent,
  box,
  capitalize,
  camelToTitle,
  snakeToTitle,
  formatList,
} from './format.js';

describe('Format Utilities', () => {
  describe('pluralize', () => {
    it('should handle singular', () => {
      expect(pluralize(1, 'note')).toBe('1 note');
    });

    it('should handle plural', () => {
      expect(pluralize(5, 'note')).toBe('5 notes');
      expect(pluralize(0, 'pattern')).toBe('0 patterns');
    });

    it('should use custom plural', () => {
      expect(pluralize(2, 'child', 'children')).toBe('2 children');
    });
  });

  describe('pad', () => {
    it('should pad right by default', () => {
      expect(pad('hi', 5)).toBe('hi   ');
    });

    it('should pad left', () => {
      expect(pad('hi', 5, ' ', 'left')).toBe('   hi');
    });

    it('should use custom character', () => {
      expect(pad('hi', 5, '0', 'left')).toBe('000hi');
    });

    it('should not truncate', () => {
      expect(pad('hello', 3)).toBe('hello');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });

  describe('formatNumber', () => {
    it('should format with decimal places', () => {
      expect(formatNumber(3.14159, 2)).toBe('3.14');
      expect(formatNumber(3.14159, 4)).toBe('3.1416');
    });
  });

  describe('formatPercent', () => {
    it('should format as percentage', () => {
      expect(formatPercent(0.756)).toBe('76%');
      expect(formatPercent(0.756, 1)).toBe('75.6%');
      expect(formatPercent(1)).toBe('100%');
    });
  });

  describe('formatHz', () => {
    it('should format Hz', () => {
      expect(formatHz(440)).toBe('440 Hz');
      expect(formatHz(100)).toBe('100 Hz');
    });

    it('should format kHz', () => {
      expect(formatHz(12000)).toBe('12.0 kHz');
      expect(formatHz(1500, 2)).toBe('1.50 kHz');
    });
  });

  describe('formatDb', () => {
    it('should format decibels', () => {
      expect(formatDb(-6)).toBe('-6.0 dB');
      expect(formatDb(0)).toBe('0.0 dB');
      expect(formatDb(-12.5, 1)).toBe('-12.5 dB');
    });
  });

  describe('progressBar', () => {
    it('should create progress bar', () => {
      expect(progressBar(0.5, 10)).toBe('█████░░░░░');
      expect(progressBar(0, 5)).toBe('░░░░░');
      expect(progressBar(1, 5)).toBe('█████');
    });

    it('should use custom characters', () => {
      expect(progressBar(0.5, 4, '#', '-')).toBe('##--');
    });
  });

  describe('barChartLine', () => {
    it('should create bar chart line', () => {
      const line = barChartLine('C', 0.18);
      expect(line).toContain('C');
      expect(line).toContain('18%');
      expect(line).toContain('│');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1048576)).toBe('1.0 MB');
    });
  });

  describe('indent', () => {
    it('should indent text', () => {
      expect(indent('hi')).toBe('  hi');
      expect(indent('hello', 4)).toBe('    hello');
    });

    it('should indent multiple lines', () => {
      expect(indent('a\nb')).toBe('  a\n  b');
    });
  });

  describe('box', () => {
    it('should create box around text', () => {
      const result = box('Hi');
      expect(result).toContain('═');
      expect(result).toContain('Hi');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('camelToTitle', () => {
    it('should convert camelCase', () => {
      expect(camelToTitle('helloWorld')).toBe('Hello World');
      expect(camelToTitle('simpleTest')).toBe('Simple Test');
    });
  });

  describe('snakeToTitle', () => {
    it('should convert snake_case', () => {
      expect(snakeToTitle('hello_world')).toBe('Hello World');
      expect(snakeToTitle('simple_test')).toBe('Simple Test');
    });
  });

  describe('formatList', () => {
    it('should format empty list', () => {
      expect(formatList([])).toBe('');
    });

    it('should format single item', () => {
      expect(formatList(['a'])).toBe('a');
    });

    it('should format two items', () => {
      expect(formatList(['a', 'b'])).toBe('a and b');
    });

    it('should format multiple items', () => {
      expect(formatList(['a', 'b', 'c'])).toBe('a, b, and c');
    });

    it('should use custom conjunction', () => {
      expect(formatList(['a', 'b', 'c'], 'or')).toBe('a, b, or c');
    });
  });
});
