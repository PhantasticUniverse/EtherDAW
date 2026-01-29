#!/usr/bin/env npx tsx
/**
 * Check Pattern Timing - Validates that all patterns have correct beat lengths
 *
 * Usage:
 *   npx tsx scripts/check-pattern-timing.ts <file.etherscore.json>
 *
 * This script checks:
 * - Note patterns have correct beat totals
 * - Chord patterns have correct beat totals
 * - Arpeggio patterns have explicit `steps` parameter
 * - Section pattern arrays match section bar counts
 */

import { readFileSync } from 'fs';
import { parseNote, parseRest, isRest, isBracketChord, parseBracketChord } from '../src/parser/note-parser.js';
import { parseChord } from '../src/parser/chord-parser.js';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: npx tsx scripts/check-pattern-timing.ts <file.etherscore.json>');
  process.exit(1);
}

const score = JSON.parse(readFileSync(filePath, 'utf-8'));
const timeSignature = score.settings?.timeSignature || '4/4';
const [beatsPerBar] = timeSignature.split('/').map(Number);

let errors: string[] = [];
let warnings: string[] = [];

console.log(`\nChecking pattern timing for: ${filePath}`);
console.log(`Time signature: ${timeSignature} (${beatsPerBar} beats per bar)\n`);

// Calculate pattern lengths
const patternLengths: Record<string, number> = {};

for (const [name, pattern] of Object.entries(score.patterns || {})) {
  if (name.startsWith('//')) continue; // Skip comments

  const p = pattern as any;

  // Note patterns
  if (p.notes) {
    let length = 0;
    for (const noteStr of p.notes) {
      if (isRest(noteStr)) {
        length += parseRest(noteStr);
      } else if (isBracketChord(noteStr)) {
        const chord = parseBracketChord(noteStr);
        length += chord.durationBeats;
      } else {
        try {
          const note = parseNote(noteStr);
          length += note.durationBeats;
        } catch (e) {
          warnings.push(`Pattern "${name}": Could not parse note "${noteStr}"`);
        }
      }
    }
    patternLengths[name] = length;
  }

  // Chord patterns
  else if (p.chords) {
    let length = 0;
    for (const chordStr of p.chords) {
      if (isRest(chordStr)) {
        length += parseRest(chordStr);
      } else {
        try {
          const chord = parseChord(chordStr);
          length += chord.durationBeats;
        } catch (e) {
          warnings.push(`Pattern "${name}": Could not parse chord "${chordStr}"`);
        }
      }
    }
    patternLengths[name] = length;
  }

  // Arpeggio patterns - MUST have steps parameter
  else if (p.arpeggio) {
    const arp = p.arpeggio;
    if (!arp.steps) {
      errors.push(`Pattern "${name}": Arpeggio missing "steps" parameter - timing will be unpredictable!`);
    } else {
      // Calculate length from steps and duration
      const durationMap: Record<string, number> = {
        'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25, '32': 0.125
      };
      const noteDuration = durationMap[arp.duration] || 0.25;
      patternLengths[name] = arp.steps * noteDuration;
    }
  }
}

// Check section pattern arrays
console.log('Section Analysis:\n');

for (const [sectionName, section] of Object.entries(score.sections || {})) {
  const s = section as any;
  const sectionBars = s.bars;
  const sectionBeats = sectionBars * beatsPerBar;

  console.log(`${sectionName}: ${sectionBars} bars (${sectionBeats} beats)`);

  for (const [trackName, track] of Object.entries(s.tracks || {})) {
    const t = track as any;

    if (t.patterns && Array.isArray(t.patterns)) {
      // Calculate total beats from pattern array
      let totalBeats = 0;
      const patternCount = t.patterns.length;

      for (const patternName of t.patterns) {
        const pLen = patternLengths[patternName];
        if (pLen !== undefined) {
          totalBeats += pLen;
        } else {
          warnings.push(`Section "${sectionName}", track "${trackName}": Pattern "${patternName}" length unknown`);
        }
      }

      // Check if total matches section
      if (Math.abs(totalBeats - sectionBeats) > 0.01) {
        errors.push(
          `Section "${sectionName}", track "${trackName}": ` +
          `${patternCount} patterns total ${totalBeats.toFixed(2)} beats, ` +
          `but section needs ${sectionBeats} beats`
        );
      } else {
        console.log(`  ${trackName}: ${patternCount} patterns = ${totalBeats} beats ✓`);
      }
    } else if (t.pattern && t.repeat) {
      // Single pattern with repeat
      const pLen = patternLengths[t.pattern];
      if (pLen !== undefined) {
        const totalBeats = pLen * t.repeat;
        if (Math.abs(totalBeats - sectionBeats) > 0.01) {
          errors.push(
            `Section "${sectionName}", track "${trackName}": ` +
            `Pattern "${t.pattern}" (${pLen} beats) x ${t.repeat} = ${totalBeats} beats, ` +
            `but section needs ${sectionBeats} beats`
          );
        } else {
          console.log(`  ${trackName}: "${t.pattern}" x ${t.repeat} = ${totalBeats} beats ✓`);
        }
      }
    }
  }
  console.log('');
}

// Print pattern lengths
console.log('\nPattern Lengths:\n');
const sortedPatterns = Object.entries(patternLengths).sort((a, b) => a[0].localeCompare(b[0]));
for (const [name, length] of sortedPatterns) {
  const bars = length / beatsPerBar;
  const isWholeBar = Math.abs(bars - Math.round(bars)) < 0.01;
  const status = isWholeBar ? '' : ' ⚠️ (not whole bars)';
  console.log(`  ${name}: ${length} beats (${bars.toFixed(2)} bars)${status}`);
}

// Print results
if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:\n');
  for (const w of warnings) {
    console.log(`  ${w}`);
  }
}

if (errors.length > 0) {
  console.log('\n❌ Errors:\n');
  for (const e of errors) {
    console.log(`  ${e}`);
  }
  console.log(`\n${errors.length} timing error(s) found.`);
  process.exit(1);
} else {
  console.log('\n✓ All pattern timing checks passed!');
  process.exit(0);
}
