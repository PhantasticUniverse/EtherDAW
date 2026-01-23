/**
 * String formatting utilities for EtherDAW
 *
 * Helpers for consistent output formatting across the codebase.
 */

/**
 * Pluralize a word based on count
 * @param count - Number to check
 * @param singular - Singular form
 * @param plural - Plural form (default: singular + 's')
 * @returns Pluralized word with count
 *
 * @example
 * pluralize(1, 'note')   // "1 note"
 * pluralize(5, 'note')   // "5 notes"
 * pluralize(0, 'pattern') // "0 patterns"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

/**
 * Pad a string to a minimum length
 * @param str - String to pad
 * @param length - Minimum length
 * @param char - Padding character (default: space)
 * @param direction - 'left' or 'right' (default: 'right')
 * @returns Padded string
 */
export function pad(str: string, length: number, char = ' ', direction: 'left' | 'right' = 'right'): string {
  if (str.length >= length) return str;
  const padding = char.repeat(length - str.length);
  return direction === 'left' ? padding + str : str + padding;
}

/**
 * Truncate a string with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length including ellipsis
 * @returns Truncated string
 *
 * @example
 * truncate("Hello World", 8) // "Hello..."
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format a number with fixed decimal places
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

/**
 * Format a percentage
 * @param value - Value as ratio (0-1)
 * @param decimals - Decimal places (default: 0)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(0.756)    // "76%"
 * formatPercent(0.756, 1) // "75.6%"
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format Hz with appropriate unit (Hz or kHz)
 * @param hz - Frequency in Hz
 * @param decimals - Decimal places for kHz (default: 1)
 * @returns Formatted frequency string
 *
 * @example
 * formatHz(440)   // "440 Hz"
 * formatHz(12000) // "12.0 kHz"
 */
export function formatHz(hz: number, decimals = 1): string {
  if (hz >= 1000) {
    return `${(hz / 1000).toFixed(decimals)} kHz`;
  }
  return `${Math.round(hz)} Hz`;
}

/**
 * Format decibels
 * @param db - Value in decibels
 * @param decimals - Decimal places (default: 1)
 * @returns Formatted dB string
 *
 * @example
 * formatDb(-6)  // "-6.0 dB"
 * formatDb(0)   // "0.0 dB"
 */
export function formatDb(db: number, decimals = 1): string {
  return `${db.toFixed(decimals)} dB`;
}

/**
 * Create a simple text progress bar
 * @param progress - Progress value (0-1)
 * @param width - Bar width in characters (default: 20)
 * @param filled - Filled character (default: '█')
 * @param empty - Empty character (default: '░')
 * @returns Progress bar string
 *
 * @example
 * progressBar(0.5) // "██████████░░░░░░░░░░"
 */
export function progressBar(progress: number, width = 20, filled = '█', empty = '░'): string {
  const filledCount = Math.round(progress * width);
  return filled.repeat(filledCount) + empty.repeat(width - filledCount);
}

/**
 * Create a horizontal bar chart entry
 * @param label - Label for the bar
 * @param value - Value (0-1)
 * @param maxLabelWidth - Maximum label width (default: 8)
 * @param barWidth - Bar width (default: 20)
 * @returns Formatted bar chart line
 *
 * @example
 * barChartLine('C', 0.18)  // "   C │██████████░░░░░░░░░░│ 18%"
 */
export function barChartLine(
  label: string,
  value: number,
  maxLabelWidth = 8,
  barWidth = 20
): string {
  const paddedLabel = pad(label, maxLabelWidth, ' ', 'left');
  const bar = progressBar(value, barWidth);
  const percent = formatPercent(value);
  return `${paddedLabel} │${bar}│ ${percent}`;
}

/**
 * Format bytes with appropriate unit
 * @param bytes - Number of bytes
 * @param decimals - Decimal places (default: 1)
 * @returns Formatted size string
 *
 * @example
 * formatBytes(1024)      // "1.0 KB"
 * formatBytes(1048576)   // "1.0 MB"
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${units[i]}`;
}

/**
 * Indent text lines
 * @param text - Text to indent
 * @param spaces - Number of spaces (default: 2)
 * @returns Indented text
 */
export function indent(text: string, spaces = 2): string {
  const prefix = ' '.repeat(spaces);
  return text.split('\n').map(line => prefix + line).join('\n');
}

/**
 * Create a box around text
 * @param text - Text to box
 * @param char - Box character (default: '═')
 * @returns Boxed text
 */
export function box(text: string, char = '═'): string {
  const lines = text.split('\n');
  const maxWidth = Math.max(...lines.map(l => l.length));
  const border = char.repeat(maxWidth + 4);
  return `${border}\n${lines.map(l => `${char} ${pad(l, maxWidth)} ${char}`).join('\n')}\n${border}`;
}

/**
 * Capitalize first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert camelCase to Title Case
 * @param str - camelCase string
 * @returns Title Case string
 *
 * @example
 * camelToTitle('helloWorld') // 'Hello World'
 */
export function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim();
}

/**
 * Convert snake_case to Title Case
 * @param str - snake_case string
 * @returns Title Case string
 *
 * @example
 * snakeToTitle('hello_world') // 'Hello World'
 */
export function snakeToTitle(str: string): string {
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Format a list of items with proper grammar
 * @param items - Array of strings
 * @param conjunction - Conjunction word (default: 'and')
 * @returns Formatted list string
 *
 * @example
 * formatList(['a', 'b', 'c'])       // "a, b, and c"
 * formatList(['a', 'b'])            // "a and b"
 * formatList(['a'])                 // "a"
 * formatList(['a', 'b', 'c'], 'or') // "a, b, or c"
 */
export function formatList(items: string[], conjunction = 'and'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
}
