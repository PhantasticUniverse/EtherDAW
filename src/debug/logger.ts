/**
 * Debug Logger (v0.9.3)
 * Provides configurable debug output for tracing compilation
 */

export type DebugLevel = 0 | 1 | 2 | 3;

/**
 * Debug levels:
 * 0 - No debug output
 * 1 - Pattern expansion and scheduling
 * 2 - Individual note placement
 * 3 - Effects processing and detailed timing
 */
class DebugLogger {
  private level: DebugLevel = 0;
  private enabled = false;

  /**
   * Set debug level
   */
  setLevel(level: DebugLevel): void {
    this.level = level;
    this.enabled = level > 0;
  }

  /**
   * Get current debug level
   */
  getLevel(): DebugLevel {
    return this.level;
  }

  /**
   * Check if debug is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log a message at a specific level
   */
  log(minLevel: DebugLevel, message: string): void {
    if (this.level >= minLevel) {
      console.log(`[DEBUG:${minLevel}] ${message}`);
    }
  }

  /**
   * Log compilation start
   */
  compileStart(title: string, tempo: number, key?: string): void {
    this.log(1, `Compiling '${title}'`);
    this.log(1, `Settings: tempo=${tempo}${key ? `, key=${key}` : ''}`);
  }

  /**
   * Log section start
   */
  sectionStart(name: string, bars: number, beatsPerBar: number): void {
    this.log(1, ``);
    this.log(1, `Section '${name}' (${bars} bars = ${bars * beatsPerBar} beats)`);
  }

  /**
   * Log track processing
   */
  trackStart(name: string, noteCount: number): void {
    this.log(1, `  Track '${name}': ${noteCount} note(s)`);
  }

  /**
   * Log pattern scheduling
   */
  patternSchedule(pattern: string, beat: number, totalBeats: number): void {
    this.log(1, `    Pattern '${pattern}' at beat ${beat} (${totalBeats} beats)`);
  }

  /**
   * Log note placement
   */
  notePlace(pitch: string, beat: number, duration: number, velocity: number, instrument: string): void {
    this.log(2, `      ${pitch} at beat ${beat.toFixed(2)}, duration ${duration.toFixed(2)}, velocity ${velocity.toFixed(2)} [${instrument}]`);
  }

  /**
   * Log pattern completion
   */
  patternComplete(pattern: string, noteCount: number, totalBeats: number): void {
    this.log(2, `    Pattern '${pattern}' complete: ${noteCount} notes, ${totalBeats} beats`);
  }

  /**
   * Log section completion
   */
  sectionComplete(name: string, noteCount: number): void {
    this.log(1, `  Section '${name}' complete: ${noteCount} notes`);
  }

  /**
   * Log compilation summary
   */
  compileSummary(totalNotes: number, totalSections: number, durationSeconds: number): void {
    this.log(1, ``);
    this.log(1, `Compilation complete:`);
    this.log(1, `  Total notes: ${totalNotes}`);
    this.log(1, `  Sections: ${totalSections}`);
    this.log(1, `  Duration: ${formatTime(durationSeconds)}`);
  }

  /**
   * Log a warning
   */
  warn(message: string): void {
    this.log(1, `⚠ ${message}`);
  }

  /**
   * Log timing mismatch
   */
  timingMismatch(section: string, track: string, trackBeats: number, sectionBeats: number): void {
    this.log(1, `  ⚠ Track '${track}' in section '${section}': ${trackBeats} beats vs section ${sectionBeats} beats`);
  }

  /**
   * Log fill operation
   */
  fillToLength(originalBeats: number, targetBeats: number): void {
    this.log(2, `    Filling pattern: ${originalBeats} beats → ${targetBeats} beats`);
  }

  /**
   * Log humanization
   */
  humanize(amount: number): void {
    this.log(3, `      Applying humanization: ${amount}`);
  }

  /**
   * Log swing
   */
  swing(amount: number): void {
    this.log(3, `      Applying swing: ${amount}`);
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Global singleton instance
export const debug = new DebugLogger();

/**
 * Enable debug mode from environment or CLI flag
 */
export function initDebugFromEnv(): void {
  const envLevel = process.env.DEBUG_LEVEL || process.env.ETHERDAW_DEBUG;
  if (envLevel) {
    const level = parseInt(envLevel, 10);
    if (level >= 0 && level <= 3) {
      debug.setLevel(level as DebugLevel);
    }
  }
}
