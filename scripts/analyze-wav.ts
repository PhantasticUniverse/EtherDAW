/**
 * Analyze a WAV file and output perceptual analysis report
 * Usage: npx tsx scripts/analyze-wav.ts <input.wav>
 */

import { readFile } from 'fs/promises';
import { analyzePerceptual, type PerceptualAnalysis } from '../src/analysis/perceptual.js';
import { describeAudio, type SemanticDescription } from '../src/analysis/describe-audio.js';
import { readWavFile } from '../src/analysis/wav-reader.js';

function formatChromagram(analysis: PerceptualAnalysis): string {
  const labels = analysis.chromagram.labels;
  const chroma = analysis.chromagram.chroma;
  const max = Math.max(...chroma);

  let output = '';
  for (let i = 0; i < 12; i++) {
    const pct = (chroma[i] / max) * 100;
    const bar = '█'.repeat(Math.round(pct / 5));
    const pad = i === analysis.chromagram.dominant ? ' ◄' : '';
    output += `  ${labels[i].padStart(2)} │${bar.padEnd(20)}│ ${pct.toFixed(0).padStart(3)}%${pad}\n`;
  }
  return output;
}

async function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: npx tsx scripts/analyze-wav.ts <input.wav>');
    process.exit(1);
  }

  console.log(`\nAnalyzing: ${inputFile}\n`);
  console.log('═'.repeat(60));

  // Read WAV file
  const { mono: audioData, sampleRate, numChannels: channels, duration } = readWavFile(inputFile);
  console.log(`Format: ${sampleRate} Hz, ${channels} channel(s), ${duration.toFixed(2)}s`);

  // Run perceptual analysis
  const analysis = analyzePerceptual(audioData, sampleRate);
  const description = describeAudio(analysis);

  console.log('\n');
  console.log('SPECTRAL PROFILE');
  console.log('─'.repeat(40));
  console.log(`  ${description.brightnessText}`);
  console.log(`  ${description.textureText}`);
  console.log(`  ${description.energyText}`);

  console.log('\n');
  console.log('CHROMAGRAM');
  console.log('─'.repeat(40));
  console.log(formatChromagram(analysis));

  console.log('TONALITY');
  console.log('─'.repeat(40));
  console.log(`  ${description.tonality.text}`);
  console.log(`  Confidence: ${(description.tonality.confidence * 100).toFixed(0)}%`);

  console.log('\n');
  console.log('DYNAMICS');
  console.log('─'.repeat(40));
  console.log(`  ${description.envelopeText}`);
  console.log(`  Average RMS: ${analysis.rmsDb.toFixed(1)} dB`);
  console.log(`  Spectral Centroid: ${analysis.centroid.toFixed(0)} Hz`);
  console.log(`  Spectral Flux: ${(analysis.flux * 100).toFixed(1)}%`);

  console.log('\n');
  console.log('OBSERVATIONS');
  console.log('─'.repeat(40));
  for (const obs of description.observations) {
    console.log(`  • ${obs}`);
  }

  console.log('\n');
  console.log('SUMMARY');
  console.log('─'.repeat(40));
  console.log(`  ${description.summary}`);

  console.log('\n');
  console.log('CHARACTER');
  console.log('─'.repeat(40));
  console.log(`  ${description.character.join(', ')}`);

  console.log('\n' + '═'.repeat(60));
}

main().catch(console.error);
