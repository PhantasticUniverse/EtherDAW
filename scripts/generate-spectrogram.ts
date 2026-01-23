/**
 * Generate spectrogram PNG from WAV file
 * Usage: npx tsx scripts/generate-spectrogram.ts <input.wav> [output.png]
 */

import * as fs from 'fs';
import { generateSpectrogramFromFile, analyzeWavFile } from '../src/analysis/spectrogram.js';
import { analyzePerceptual } from '../src/analysis/perceptual.js';
import { describeAudio } from '../src/analysis/describe-audio.js';
import { readWavFile } from '../src/analysis/wav-reader.js';

async function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: npx tsx scripts/generate-spectrogram.ts <input.wav> [output.png]');
    process.exit(1);
  }

  const baseName = inputFile.replace(/\.[^.]+$/, '').split('/').pop() || 'spectrogram';
  const outputFile = process.argv[3] || `output/${baseName}_spectrogram.png`;

  console.log(`Generating spectrogram for: ${inputFile}`);

  // Generate spectrogram PNG
  const pngBuffer = generateSpectrogramFromFile(inputFile, {
    width: 1200,
    height: 400,
    colorMap: 'magma',
    logScale: true,
    minFreq: 30,
    maxFreq: 16000,
  });

  // Ensure output directory exists
  const outputDir = outputFile.substring(0, outputFile.lastIndexOf('/'));
  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, pngBuffer);
  console.log(`Spectrogram saved to: ${outputFile}`);

  // Also run analysis
  const wav = readWavFile(inputFile);
  const analysis = analyzePerceptual(wav.mono, wav.sampleRate);
  const description = describeAudio(analysis);

  console.log('\n--- Audio Analysis ---');
  console.log(`Duration: ${wav.duration.toFixed(2)}s`);
  console.log(`Brightness: ${description.brightnessText}`);
  console.log(`Texture: ${description.textureText}`);
  console.log(`Energy: ${description.energyText}`);
  console.log(`Tonality: ${description.tonality.text} (${(description.tonality.confidence * 100).toFixed(0)}% confidence)`);
  console.log(`Spectral Centroid: ${analysis.centroid.toFixed(0)} Hz`);
  console.log(`Spectral Flux: ${(analysis.flux * 100).toFixed(1)}%`);
  console.log(`Character: ${description.character.join(', ')}`);
}

main().catch(console.error);
