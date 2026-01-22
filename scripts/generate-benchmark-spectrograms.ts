#!/usr/bin/env npx tsx
/**
 * Generate Analysis for Benchmark Compositions
 *
 * Exports each benchmark EtherScore to MIDI and creates analysis files.
 * Spectrograms require browser-based WAV rendering.
 *
 * Usage: npm run generate:benchmarks
 */

import * as fs from 'fs';
import * as path from 'path';

import { validateOrThrow } from '../src/schema/validator.js';
import { compile } from '../src/engine/compiler.js';
import { exportToMidi } from '../src/output/midi-export.js';

// Directories
const EXAMPLES_DIR = 'examples';
const OUTPUT_DIR = 'reference/benchmarks';
const AUDIO_DIR = `${OUTPUT_DIR}/audio`;
const SPEC_DIR = `${OUTPUT_DIR}/spectrograms`;
const ANALYSIS_DIR = `${OUTPUT_DIR}/analysis`;

interface BenchmarkAnalysis {
  name: string;
  title: string;
  description: string;
  duration: number;
  paths: {
    etherscore: string;
    midi: string;
    spectrogram: string;
    analysis: string;
  };
  features: string[];
  verified: boolean;
  notes?: string;
}

interface BenchmarkManifest {
  generated: string;
  totalBenchmarks: number;
  benchmarks: BenchmarkAnalysis[];
}

/**
 * Get all benchmark files from examples directory
 */
function getBenchmarkFiles(): string[] {
  const files = fs.readdirSync(EXAMPLES_DIR);
  return files
    .filter(f => f.startsWith('benchmark-') && f.endsWith('.etherscore.json'))
    .sort();
}

/**
 * Parse and compile an EtherScore file
 */
function loadEtherScore(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const score = validateOrThrow(JSON.parse(content));
  const compiled = compile(score);
  return { score, compiled };
}

/**
 * Extract features tested by a benchmark from its description and tags
 */
function extractFeatures(score: any): string[] {
  const features: string[] = [];

  // From tags
  if (score.meta?.tags) {
    features.push(...score.meta.tags.filter((t: string) => t !== 'benchmark'));
  }

  // From patterns
  const patterns = score.patterns || {};
  for (const [name, pattern] of Object.entries(patterns)) {
    if (name.startsWith('//')) continue;
    const p = pattern as any;

    if (p.markov) features.push('markov');
    if (p.euclidean) features.push('euclidean');
    if (p.transform) features.push('transforms');
    if (p.voiceLead) features.push('voice-leading');
    if (p.continuation) features.push('continuation');
    if (p.arpeggio) features.push('arpeggio');
    if (p.degrees) features.push('scale-degrees');
    if (p.drums) features.push('drums');
    if (p.chords) features.push('chords');
  }

  // From sections
  const sections = score.sections || {};
  for (const [name, section] of Object.entries(sections)) {
    if (name.startsWith('//')) continue;
    const s = section as any;

    if (s.automation) features.push('automation');
    if (s.density) features.push('density');
    if (s.tension) features.push('tension');
  }

  // Deduplicate
  return [...new Set(features)];
}

/**
 * Count patterns in score (excluding comment keys)
 */
function countPatterns(score: any): number {
  return Object.keys(score.patterns || {}).filter(k => !k.startsWith('//')).length;
}

/**
 * Analyze a benchmark and generate outputs
 */
async function analyzeBenchmark(filename: string): Promise<BenchmarkAnalysis> {
  const filepath = path.join(EXAMPLES_DIR, filename);
  const baseName = filename.replace('.etherscore.json', '');

  console.log(`\n=== ${baseName} ===`);
  console.log(`  Loading: ${filepath}`);

  // Load and compile
  const { score, compiled } = loadEtherScore(filepath);

  const title = score.meta?.title || baseName;
  const description = score.meta?.description || '';

  // Use the durationSeconds from compiled stats
  const duration = compiled.stats.durationSeconds;

  console.log(`  Title: ${title}`);
  console.log(`  Duration: ${duration.toFixed(1)}s`);

  // Export to MIDI
  const midi = exportToMidi(compiled.timeline, { name: title });
  const midiPath = path.join(AUDIO_DIR, `${baseName}.mid`);
  fs.writeFileSync(midiPath, Buffer.from(midi.toArray()));
  console.log(`  MIDI: ${midiPath}`);

  // Extract features
  const features = extractFeatures(score);
  console.log(`  Features: ${features.join(', ')}`);

  // Create analysis file
  const analysis = {
    benchmark: baseName,
    title,
    description,
    features,
    duration,
    tempo: score.settings.tempo,
    key: score.settings.key,
    sections: compiled.stats.totalSections,
    patterns: countPatterns(score),
    notes: compiled.stats.totalNotes,
    instruments: compiled.stats.instruments,
    compiledAt: new Date().toISOString(),
    expectedCharacteristics: getExpectedCharacteristics(baseName, features),
  };

  const analysisPath = path.join(ANALYSIS_DIR, `${baseName}-analysis.json`);
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  console.log(`  Analysis: ${analysisPath}`);

  // Spectrogram path placeholder
  const specPath = path.join(SPEC_DIR, `${baseName}.png`);

  return {
    name: baseName,
    title,
    description,
    duration,
    paths: {
      etherscore: filepath,
      midi: midiPath,
      spectrogram: specPath,
      analysis: analysisPath,
    },
    features,
    verified: false,
    notes: 'MIDI exported. Spectrogram requires WAV rendering in browser.',
  };
}

/**
 * Get expected spectrogram characteristics for verification
 */
function getExpectedCharacteristics(name: string, features: string[]): Record<string, string> {
  const characteristics: Record<string, string> = {};

  if (name.includes('synthesis')) {
    characteristics.synthesis = 'Each preset should show distinct harmonic signature';
  }
  if (name.includes('drums')) {
    characteristics.drums = 'Transient attacks visible, kit differences apparent';
  }
  if (name.includes('chords')) {
    characteristics.chords = 'Multiple frequency bands for each chord, correct voicing spread';
  }
  if (name.includes('arpeggios')) {
    characteristics.arpeggios = 'Sequential note onsets, correct pitch progression';
  }
  if (name.includes('articulations')) {
    characteristics.articulations = 'Staccato = short duration, legato = connected, accents = brighter';
  }
  if (name.includes('effects')) {
    characteristics.effects = 'Reverb = time smear, delay = repeats, filter = frequency cutoff';
  }
  if (name.includes('dynamics')) {
    characteristics.dynamics = 'Amplitude variation visible in spectrogram brightness';
  }
  if (name.includes('timing')) {
    characteristics.timing = 'Note spacing changes with swing, even grid without';
  }
  if (name.includes('layering')) {
    characteristics.layering = 'Wider frequency spread, detuned = beating pattern';
  }
  if (name.includes('lfo')) {
    characteristics.lfo = 'Periodic modulation visible in target parameter';
  }
  if (name.includes('generative')) {
    characteristics.generative = 'Each Markov preset produces distinct melodic patterns';
  }
  if (name.includes('transforms')) {
    characteristics.transforms = 'Inversions should mirror, retrogrades reverse timing';
  }
  if (name.includes('voice-leading')) {
    characteristics.voiceLeading = 'Smooth transitions between chords, no parallel fifths in Bach style';
  }
  if (name.includes('automation')) {
    characteristics.automation = 'Continuous parameter changes visible in spectrogram';
  }
  if (name.includes('density-tension')) {
    characteristics.densityTension = 'Note density should increase/decrease according to curve';
  }
  if (name.includes('euclidean')) {
    characteristics.euclidean = 'Regular rhythmic patterns with specified hit distribution';
  }
  if (name.includes('parallel')) {
    characteristics.parallel = 'Multiple pattern layers visible simultaneously';
  }
  if (name.includes('continuation')) {
    characteristics.continuation = 'Sequences should show transposed repetitions of motifs';
  }
  if (name.includes('scale-degrees')) {
    characteristics.scaleDegrees = 'Notes should resolve to correct pitches in each key';
  }
  if (name.includes('mixing')) {
    characteristics.mixing = 'EQ changes visible in frequency balance, pan in stereo spread';
  }

  return characteristics;
}

/**
 * Main entry point
 */
async function main() {
  console.log('=== EtherDAW Benchmark Analysis Generator ===\n');

  // Ensure directories exist
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(SPEC_DIR, { recursive: true });
  fs.mkdirSync(ANALYSIS_DIR, { recursive: true });

  // Get all benchmark files
  const benchmarks = getBenchmarkFiles();
  console.log(`Found ${benchmarks.length} benchmark files:\n`);
  benchmarks.forEach(b => console.log(`  - ${b}`));

  // Process each benchmark
  const results: BenchmarkAnalysis[] = [];

  for (const benchmark of benchmarks) {
    try {
      const analysis = await analyzeBenchmark(benchmark);
      results.push(analysis);
    } catch (error) {
      console.error(`  ERROR: ${error}`);
      results.push({
        name: benchmark.replace('.etherscore.json', ''),
        title: benchmark,
        description: 'Error during processing',
        duration: 0,
        paths: {
          etherscore: path.join(EXAMPLES_DIR, benchmark),
          midi: '',
          spectrogram: '',
          analysis: '',
        },
        features: [],
        verified: false,
        notes: `Error: ${error}`,
      });
    }
  }

  // Generate manifest
  const manifest: BenchmarkManifest = {
    generated: new Date().toISOString(),
    totalBenchmarks: results.length,
    benchmarks: results,
  };

  const manifestPath = path.join(OUTPUT_DIR, 'benchmark-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Processed ${results.length} benchmarks`);
  console.log(`Manifest: ${manifestPath}`);

  // Feature coverage summary
  const allFeatures = new Set<string>();
  results.forEach(r => r.features.forEach(f => allFeatures.add(f)));
  console.log(`\nFeatures covered: ${allFeatures.size}`);
  console.log([...allFeatures].sort().join(', '));

  // Stats
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`\nTotal benchmark duration: ${(totalDuration / 60).toFixed(1)} minutes`);

  console.log('\nNote: Spectrograms require WAV rendering in browser.');
  console.log('Open player.html, render each benchmark, then use spectrogram tools.');
}

main().catch(console.error);
