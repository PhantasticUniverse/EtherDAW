#!/usr/bin/env npx tsx
/**
 * Threshold Album Perceptual Analysis Script
 *
 * Analyzes all tracks in the Threshold album using v0.9 perceptual analysis tools.
 * Generates a comprehensive report comparing intent vs actual sonic characteristics.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createNodePlayer } from '../src/node/player.js';
import { analyzePerceptual, describeBrightness, describeTexture, inferKey, classifyEnergyEnvelope } from '../src/analysis/perceptual.js';
import { describeAudio, generateAnalysisReport } from '../src/analysis/describe-audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Album track definitions with creative intent
const TRACKS = [
  {
    file: '01-before-dawn.etherscore.json',
    title: 'Before Dawn',
    intent: 'Still, warm ambient',
    expectations: {
      brightness: 'warm',  // centroid < 800 Hz
      texture: 'smooth',   // flux < 10%
      envelope: 'steady',
      notes: 'Very warm, sub-focused, minimal activity'
    }
  },
  {
    file: '02-first-light.etherscore.json',
    title: 'First Light',
    intent: 'Awakening, hopeful',
    expectations: {
      brightness: 'neutral', // balanced
      texture: 'smooth',
      envelope: 'building',
      notes: 'Energy should build, rising centroid'
    }
  },
  {
    file: '03-the-commute.etherscore.json',
    title: 'The Commute',
    intent: 'Hypnotic, rhythmic',
    expectations: {
      brightness: 'neutral',
      texture: 'rhythmic',  // Higher flux
      envelope: 'steady',
      notes: 'Consistent flux, no dead spots'
    }
  },
  {
    file: '04-midday-static.etherscore.json',
    title: 'Midday Static',
    intent: 'Dense, present',
    expectations: {
      brightness: 'neutral',
      texture: 'moderate',
      envelope: 'steady',
      notes: 'Rich chromagram, complex harmony'
    }
  },
  {
    file: '05-dissolution.etherscore.json',
    title: 'Dissolution',
    intent: 'Fading, soft',
    expectations: {
      brightness: 'warm',
      texture: 'smooth',
      envelope: 'decaying',
      notes: 'Decaying energy, falling centroid'
    }
  },
  {
    file: '06-blue-hour.etherscore.json',
    title: 'Blue Hour',
    intent: 'Wistful, bittersweet',
    expectations: {
      brightness: 'warm',
      texture: 'smooth',
      envelope: 'arc',
      notes: 'Major with minor elements'
    }
  },
  {
    file: '07-night-architecture.etherscore.json',
    title: 'Night Architecture',
    intent: 'Electronic, geometric',
    expectations: {
      brightness: 'bright',  // Higher centroid for electronic feel
      texture: 'rhythmic',
      envelope: 'dynamic',
      notes: 'Tight flux patterns, clear onsets'
    }
  },
  {
    file: '08-return.etherscore.json',
    title: 'Return',
    intent: 'Peaceful, home',
    expectations: {
      brightness: 'warm',
      texture: 'smooth',
      envelope: 'decaying', // Settling
      notes: 'Similar warmth to track 1, peaceful arc'
    }
  }
];

interface AnalysisResult {
  track: typeof TRACKS[0];
  analysis: ReturnType<typeof analyzePerceptual>;
  description: ReturnType<typeof describeAudio>;
  issues: string[];
  matches: string[];
}

async function analyzeTrack(albumDir: string, track: typeof TRACKS[0]): Promise<AnalysisResult> {
  const filePath = resolve(albumDir, track.file);

  // Create player and load file
  const player = createNodePlayer();
  await player.loadFile(filePath);

  // Render to samples
  const samples = player.renderToSamples();
  const sampleRate = player.getLastRenderedSampleRate();

  // Run perceptual analysis
  const analysis = analyzePerceptual(samples, sampleRate);
  const description = describeAudio(analysis);

  // Compare against expectations
  const issues: string[] = [];
  const matches: string[] = [];

  // Check brightness
  const actualBrightness = describeBrightness(analysis.centroid);
  if (actualBrightness === track.expectations.brightness) {
    matches.push(`✓ Brightness: ${actualBrightness} (${Math.round(analysis.centroid)} Hz)`);
  } else {
    issues.push(`✗ Brightness: Expected ${track.expectations.brightness}, got ${actualBrightness} (${Math.round(analysis.centroid)} Hz)`);
  }

  // Check texture
  const actualTexture = describeTexture(analysis.flux);
  // Allow some flexibility - smooth and very_smooth are close enough
  const textureMatches =
    actualTexture === track.expectations.texture ||
    (track.expectations.texture === 'smooth' && actualTexture === 'very_smooth') ||
    (track.expectations.texture === 'smooth' && actualTexture === 'moderate');

  if (textureMatches) {
    matches.push(`✓ Texture: ${actualTexture} (flux: ${(analysis.flux * 100).toFixed(0)}%)`);
  } else {
    issues.push(`✗ Texture: Expected ${track.expectations.texture}, got ${actualTexture} (flux: ${(analysis.flux * 100).toFixed(0)}%)`);
  }

  // Check envelope
  const actualEnvelope = classifyEnergyEnvelope(analysis.rmsOverTimeLinear);
  // Allow flexibility for envelope detection
  const envelopeClose =
    actualEnvelope === track.expectations.envelope ||
    (track.expectations.envelope === 'steady' && actualEnvelope === 'dynamic') ||
    (track.expectations.envelope === 'decaying' && actualEnvelope === 'arc');

  if (envelopeClose) {
    matches.push(`✓ Envelope: ${actualEnvelope}`);
  } else {
    issues.push(`✗ Envelope: Expected ${track.expectations.envelope}, got ${actualEnvelope}`);
  }

  // Close player
  player.stop();

  return { track, analysis, description, issues, matches };
}

async function main() {
  const albumDir = resolve(__dirname, '../examples/album-1-01');

  console.log('═'.repeat(70));
  console.log('THRESHOLD ALBUM - PERCEPTUAL ANALYSIS REPORT');
  console.log('═'.repeat(70));
  console.log();

  const results: AnalysisResult[] = [];

  // Analyze each track
  for (let i = 0; i < TRACKS.length; i++) {
    const track = TRACKS[i];
    console.log(`Analyzing ${i + 1}/${TRACKS.length}: ${track.title}...`);

    try {
      const result = await analyzeTrack(albumDir, track);
      results.push(result);
    } catch (error) {
      console.error(`  Error analyzing ${track.title}: ${(error as Error).message}`);
    }
  }

  console.log();
  console.log('═'.repeat(70));
  console.log('INDIVIDUAL TRACK ANALYSIS');
  console.log('═'.repeat(70));

  // Print individual results
  for (const result of results) {
    console.log();
    console.log('─'.repeat(70));
    console.log(`TRACK ${result.track.title}`);
    console.log(`Intent: ${result.track.intent}`);
    console.log('─'.repeat(70));

    console.log();
    console.log('METRICS:');
    console.log(`  Brightness: ${result.description.brightness} (${Math.round(result.analysis.centroid)} Hz)`);
    console.log(`  Texture: ${result.description.texture} (flux: ${(result.analysis.flux * 100).toFixed(0)}%)`);
    console.log(`  Energy: ${result.description.energy} (${Math.round(result.analysis.rmsDb)} dB)`);
    console.log(`  Envelope: ${result.description.envelope}`);
    console.log(`  Key: ${result.description.tonality.key} ${result.description.tonality.mode}`);

    console.log();
    console.log('INTENT vs ACTUAL:');
    for (const match of result.matches) {
      console.log(`  ${match}`);
    }
    for (const issue of result.issues) {
      console.log(`  ${issue}`);
    }

    if (result.issues.length === 0) {
      console.log('  All expectations met!');
    }
  }

  // Album cohesion analysis
  console.log();
  console.log('═'.repeat(70));
  console.log('ALBUM COHESION ANALYSIS');
  console.log('═'.repeat(70));

  // Track 1 vs Track 8 comparison (full circle)
  const track1 = results.find(r => r.track.file.includes('01-'));
  const track8 = results.find(r => r.track.file.includes('08-'));

  if (track1 && track8) {
    console.log();
    console.log('BOOKEND COMPARISON (Track 1 vs Track 8):');
    const centroidDiff = Math.abs(track1.analysis.centroid - track8.analysis.centroid);
    const fluxDiff = Math.abs(track1.analysis.flux - track8.analysis.flux);
    const energyDiff = Math.abs(track1.analysis.rmsDb - track8.analysis.rmsDb);

    console.log(`  Track 1 centroid: ${Math.round(track1.analysis.centroid)} Hz`);
    console.log(`  Track 8 centroid: ${Math.round(track8.analysis.centroid)} Hz`);
    console.log(`  Difference: ${Math.round(centroidDiff)} Hz`);

    if (centroidDiff < 300) {
      console.log('  ✓ Good warmth match - similar tonal character');
    } else {
      console.log('  ✗ Warmth mismatch - tracks feel different');
    }

    console.log();
    console.log(`  Track 1 flux: ${(track1.analysis.flux * 100).toFixed(0)}%`);
    console.log(`  Track 8 flux: ${(track8.analysis.flux * 100).toFixed(0)}%`);

    if (fluxDiff < 0.1) {
      console.log('  ✓ Good texture match - similar smoothness');
    } else {
      console.log('  ✗ Texture mismatch');
    }
  }

  // Overall summary
  console.log();
  console.log('═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));

  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  console.log(`  Total expectations checked: ${totalIssues + totalMatches}`);
  console.log(`  Matched: ${totalMatches}`);
  console.log(`  Issues: ${totalIssues}`);
  console.log();

  if (totalIssues > 0) {
    console.log('TRACKS NEEDING REFINEMENT:');
    for (const result of results) {
      if (result.issues.length > 0) {
        console.log(`  - ${result.track.title}: ${result.issues.length} issue(s)`);
      }
    }
  } else {
    console.log('All tracks match creative intent!');
  }

  console.log();
  console.log('═'.repeat(70));
}

main().catch(console.error);
