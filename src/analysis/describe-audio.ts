/**
 * Semantic Audio Description for EtherDAW v0.9
 *
 * Converts numeric perceptual metrics to natural language descriptions.
 * These descriptions help LLMs understand audio content without hearing it.
 */

import type { PerceptualAnalysis, Chromagram } from './perceptual.js';
import {
  describeBrightness,
  describeTexture,
  describeEnergy,
  inferKey,
  classifyEnergyEnvelope,
} from './perceptual.js';

/**
 * Full semantic description of audio
 */
export interface SemanticDescription {
  /** Brightness: "warm", "neutral", "bright", "harsh" */
  brightness: string;
  /** Human-readable brightness */
  brightnessText: string;

  /** Texture: "smooth", "rhythmic", "choppy" */
  texture: string;
  /** Human-readable texture */
  textureText: string;

  /** Energy: "quiet", "moderate", "loud", "intense" */
  energy: string;
  /** Human-readable energy */
  energyText: string;

  /** Tonality: inferred key and mode */
  tonality: {
    key: string;
    mode: 'major' | 'minor';
    confidence: number;
    text: string;
  };

  /** Energy envelope shape */
  envelope: string;
  envelopeText: string;

  /** Character descriptors */
  character: string[];

  /** Overall summary */
  summary: string;

  /** Observations - notable features */
  observations: string[];
}

/**
 * Generate semantic description from perceptual analysis
 */
export function describeAudio(analysis: PerceptualAnalysis): SemanticDescription {
  // Brightness description
  const brightness = describeBrightness(analysis.centroid);
  const brightnessText = getBrightnessText(brightness, analysis.centroid);

  // Texture description
  const texture = describeTexture(analysis.flux);
  const textureText = getTextureText(texture, analysis.flux);

  // Energy description
  const energy = describeEnergy(analysis.rmsDb);
  const energyText = getEnergyText(energy, analysis.rmsDb);

  // Tonality
  const tonalityResult = inferKey(analysis.chromagram);
  const tonality = {
    ...tonalityResult,
    text: getTonalityText(tonalityResult, analysis.chromagram),
  };

  // Envelope
  const envelope = classifyEnergyEnvelope(analysis.rmsOverTimeLinear);
  const envelopeText = getEnvelopeText(envelope);

  // Character descriptors
  const character = deriveCharacter(analysis, brightness, texture, energy);

  // Observations
  const observations = generateObservations(analysis, brightness, texture, energy, envelope);

  // Summary
  const summary = generateSummary(brightness, texture, energy, tonality, envelope);

  return {
    brightness,
    brightnessText,
    texture,
    textureText,
    energy,
    energyText,
    tonality,
    envelope,
    envelopeText,
    character,
    summary,
    observations,
  };
}

/**
 * Get human-readable brightness description
 */
function getBrightnessText(brightness: string, centroid: number): string {
  const centroidRounded = Math.round(centroid);
  switch (brightness) {
    case 'very_dark':
      return `Very dark (centroid: ${centroidRounded} Hz) - sub-bass heavy`;
    case 'warm':
      return `Warm (centroid: ${centroidRounded} Hz) - mid-bass focused`;
    case 'neutral':
      return `Neutral (centroid: ${centroidRounded} Hz) - balanced`;
    case 'bright':
      return `Bright (centroid: ${centroidRounded} Hz) - presence-forward`;
    case 'harsh':
      return `Harsh (centroid: ${centroidRounded} Hz) - treble-heavy`;
    default:
      return `Unknown (centroid: ${centroidRounded} Hz)`;
  }
}

/**
 * Get human-readable texture description
 */
function getTextureText(texture: string, flux: number): string {
  const fluxPct = Math.round(flux * 100);
  switch (texture) {
    case 'very_smooth':
      return `Very smooth (flux: ${fluxPct}%) - sustained, pad-like`;
    case 'smooth':
      return `Smooth (flux: ${fluxPct}%) - legato, flowing`;
    case 'moderate':
      return `Moderate (flux: ${fluxPct}%) - balanced articulation`;
    case 'rhythmic':
      return `Rhythmic (flux: ${fluxPct}%) - clear note attacks`;
    case 'choppy':
      return `Choppy (flux: ${fluxPct}%) - staccato, percussive`;
    default:
      return `Unknown (flux: ${fluxPct}%)`;
  }
}

/**
 * Get human-readable energy description
 */
function getEnergyText(energy: string, rmsDb: number): string {
  const dbRounded = Math.round(rmsDb);
  switch (energy) {
    case 'quiet':
      return `Quiet (${dbRounded} dB) - ambient, subtle`;
    case 'soft':
      return `Soft (${dbRounded} dB) - intimate, restrained`;
    case 'moderate':
      return `Moderate (${dbRounded} dB) - conversational`;
    case 'loud':
      return `Loud (${dbRounded} dB) - energetic, full`;
    case 'intense':
      return `Intense (${dbRounded} dB) - powerful, driving`;
    default:
      return `Unknown (${dbRounded} dB)`;
  }
}

/**
 * Get human-readable tonality description
 */
function getTonalityText(
  tonality: { key: string; mode: 'major' | 'minor'; confidence: number },
  chromagram: Chromagram
): string {
  const confPct = Math.round(tonality.confidence * 100);
  const modeWord = tonality.mode === 'major' ? 'major' : 'minor';

  if (tonality.confidence < 0.3) {
    return `Ambiguous tonality (${confPct}% confidence)`;
  }

  // Find strong pitch classes
  const strongPitches = chromagram.labels.filter((_, i) => chromagram.chroma[i] > 0.15);
  const pitchesStr = strongPitches.length > 0 ? ` (strong: ${strongPitches.join(', ')})` : '';

  return `${tonality.key} ${modeWord}${pitchesStr} (${confPct}% confidence)`;
}

/**
 * Get human-readable envelope description
 */
function getEnvelopeText(envelope: string): string {
  switch (envelope) {
    case 'building':
      return 'Building - energy increases over time (crescendo)';
    case 'decaying':
      return 'Decaying - energy decreases over time (diminuendo)';
    case 'arc':
      return 'Arc - rises then falls (classic phrase shape)';
    case 'steady':
      return 'Steady - consistent energy throughout';
    case 'dynamic':
      return 'Dynamic - varied energy, expressive';
    default:
      return 'Unknown envelope';
  }
}

/**
 * Derive character descriptors from analysis
 */
function deriveCharacter(
  analysis: PerceptualAnalysis,
  brightness: string,
  texture: string,
  energy: string
): string[] {
  const character: string[] = [];

  // Brightness-based
  if (brightness === 'very_dark' || brightness === 'warm') {
    character.push('warm');
    if (analysis.centroid < 400) character.push('subby');
  }
  if (brightness === 'bright' || brightness === 'harsh') {
    character.push('bright');
    if (brightness === 'harsh') character.push('aggressive');
  }

  // Texture-based
  if (texture === 'very_smooth' || texture === 'smooth') {
    character.push('sustained');
    character.push('pad-like');
  }
  if (texture === 'rhythmic' || texture === 'choppy') {
    character.push('percussive');
    if (texture === 'choppy') character.push('staccato');
  }

  // Energy-based
  if (energy === 'quiet') {
    character.push('ambient');
    character.push('subtle');
  }
  if (energy === 'intense' || energy === 'loud') {
    character.push('powerful');
    character.push('full');
  }

  // ZCR-based (noisiness)
  if (analysis.zcr > 5000) {
    character.push('noisy');
  } else if (analysis.zcr < 1000) {
    character.push('tonal');
    character.push('pure');
  }

  // Remove duplicates
  return [...new Set(character)];
}

/**
 * Generate notable observations
 */
function generateObservations(
  analysis: PerceptualAnalysis,
  brightness: string,
  texture: string,
  energy: string,
  envelope: string
): string[] {
  const observations: string[] = [];

  // Brightness observations
  if (analysis.centroid < 600) {
    observations.push('Very warm, bass-focused frequency balance');
  } else if (analysis.centroid > 3000) {
    observations.push('Bright, treble-forward frequency balance');
  }

  // Texture observations
  if (analysis.flux < 0.1) {
    observations.push('Smooth, sustained character - works well as pad or ambient');
  } else if (analysis.flux > 0.35) {
    observations.push('High rhythmic activity - strong note articulation');
  }

  // Energy observations
  const rmsRange = Math.max(...analysis.rmsOverTime) - Math.min(...analysis.rmsOverTime);
  if (rmsRange > 30) {
    observations.push(`Wide dynamic range (${Math.round(rmsRange)} dB) - expressive dynamics`);
  } else if (rmsRange < 6) {
    observations.push('Compressed dynamics - consistent loudness');
  }

  // Chromagram observations
  const strongPitchCount = analysis.chromagram.chroma.filter(c => c > 0.12).length;
  if (strongPitchCount <= 3) {
    observations.push('Clear harmonic focus - simple, direct tonality');
  } else if (strongPitchCount >= 6) {
    observations.push('Rich harmonic content - complex, colorful');
  }

  // Envelope observations
  if (envelope === 'arc') {
    observations.push('Classic phrase arc - natural musical shape');
  } else if (envelope === 'building') {
    observations.push('Energy builds - creates anticipation');
  } else if (envelope === 'decaying') {
    observations.push('Energy decays - resolution, settling');
  }

  return observations;
}

/**
 * Generate overall summary
 */
function generateSummary(
  brightness: string,
  texture: string,
  energy: string,
  tonality: { key: string; mode: 'major' | 'minor'; confidence: number },
  envelope: string
): string {
  const parts: string[] = [];

  // Brightness + texture combo
  if (brightness === 'warm' && (texture === 'smooth' || texture === 'very_smooth')) {
    parts.push('Warm, sustained');
  } else if (brightness === 'bright' && (texture === 'rhythmic' || texture === 'choppy')) {
    parts.push('Bright, energetic');
  } else {
    parts.push(`${capitalize(brightness)}, ${texture}`);
  }

  // Energy
  parts.push(energy);

  // Tonality (if confident)
  if (tonality.confidence > 0.4) {
    const modeWord = tonality.mode === 'major' ? '' : 'm';
    parts.push(`${tonality.key}${modeWord}`);
  }

  // Envelope
  if (envelope !== 'steady' && envelope !== 'dynamic') {
    parts.push(envelope);
  }

  return parts.join(' · ');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * Format chromagram as ASCII visualization
 */
export function formatChromagramASCII(chromagram: Chromagram): string {
  const maxBar = 20;
  const maxChroma = Math.max(...chromagram.chroma);
  const scale = maxChroma > 0 ? maxBar / maxChroma : 0;

  const lines: string[] = [];
  lines.push('Chromagram (pitch class distribution):');
  lines.push('');

  for (let i = 0; i < 12; i++) {
    const label = chromagram.labels[i].padStart(2);
    const value = chromagram.chroma[i];
    const barLen = Math.round(value * scale);
    const bar = '█'.repeat(barLen) + '░'.repeat(maxBar - barLen);
    const pct = (value * 100).toFixed(0).padStart(3);
    const marker = i === chromagram.dominant ? ' ◄' : '';
    lines.push(`  ${label} │${bar}│ ${pct}%${marker}`);
  }

  lines.push('');
  lines.push(`  Dominant: ${chromagram.dominantName}`);

  return lines.join('\n');
}

/**
 * Format energy curve as ASCII visualization
 */
export function formatEnergyCurveASCII(
  rmsOverTime: number[],
  frameTimes: number[],
  height: number = 6
): string {
  if (rmsOverTime.length === 0) return 'No energy data';

  const width = Math.min(50, rmsOverTime.length);
  const samplesPerCol = Math.floor(rmsOverTime.length / width);

  // Downsample to width
  const downsampled: number[] = [];
  for (let x = 0; x < width; x++) {
    const start = x * samplesPerCol;
    const end = Math.min(start + samplesPerCol, rmsOverTime.length);
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += rmsOverTime[i];
    }
    downsampled.push(sum / (end - start));
  }

  // Normalize to 0-1 for display
  const minVal = Math.min(...downsampled);
  const maxVal = Math.max(...downsampled);
  const range = maxVal - minVal || 1;

  const grid: string[][] = Array(height).fill(null).map(() => Array(width).fill(' '));
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  for (let x = 0; x < width; x++) {
    const normalized = (downsampled[x] - minVal) / range;
    const charIdx = Math.min(chars.length - 1, Math.floor(normalized * chars.length));
    const row = height - 1 - Math.floor(normalized * (height - 1));
    grid[row][x] = chars[charIdx];
  }

  const lines: string[] = [];
  lines.push('Energy curve (RMS over time):');
  lines.push('');
  lines.push('┌' + '─'.repeat(width) + '┐');
  for (const row of grid) {
    lines.push('│' + row.join('') + '│');
  }
  lines.push('└' + '─'.repeat(width) + '┘');

  // Time labels
  const duration = frameTimes.length > 0 ? frameTimes[frameTimes.length - 1] : 0;
  const startLabel = '0:00';
  const endLabel = formatTime(duration);
  const padding = width - startLabel.length - endLabel.length;
  lines.push(' ' + startLabel + ' '.repeat(Math.max(0, padding)) + endLabel);

  return lines.join('\n');
}

/**
 * Format time as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format spectral centroid over time as ASCII
 */
export function formatBrightnessCurveASCII(
  centroidOverTime: number[],
  frameTimes: number[],
  height: number = 6
): string {
  if (centroidOverTime.length === 0) return 'No brightness data';

  const width = Math.min(50, centroidOverTime.length);
  const samplesPerCol = Math.floor(centroidOverTime.length / width);

  // Downsample
  const downsampled: number[] = [];
  for (let x = 0; x < width; x++) {
    const start = x * samplesPerCol;
    const end = Math.min(start + samplesPerCol, centroidOverTime.length);
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += centroidOverTime[i];
    }
    downsampled.push(sum / (end - start));
  }

  // Log scale for frequency display
  const logValues = downsampled.map(v => Math.log10(Math.max(20, v)));
  const minLog = Math.min(...logValues);
  const maxLog = Math.max(...logValues);
  const range = maxLog - minLog || 1;

  const grid: string[][] = Array(height).fill(null).map(() => Array(width).fill(' '));

  for (let x = 0; x < width; x++) {
    const normalized = (logValues[x] - minLog) / range;
    const row = height - 1 - Math.floor(normalized * (height - 1));
    grid[row][x] = '─';
  }

  const lines: string[] = [];
  lines.push('Spectral Centroid over time (brightness):');
  lines.push('');

  const avgCentroid = centroidOverTime.reduce((a, b) => a + b, 0) / centroidOverTime.length;
  const minCentroid = Math.min(...centroidOverTime);
  const maxCentroid = Math.max(...centroidOverTime);

  lines.push(`  8k │${''.padEnd(width)}│`);
  lines.push('┌' + '─'.repeat(width) + '┐');
  for (const row of grid) {
    lines.push('│' + row.join('') + '│');
  }
  lines.push('└' + '─'.repeat(width) + '┘');
  lines.push(` 100 │${''.padEnd(width)}│`);

  const duration = frameTimes.length > 0 ? frameTimes[frameTimes.length - 1] : 0;
  lines.push('');
  lines.push(`Average: ${Math.round(avgCentroid)} Hz (${describeBrightness(avgCentroid)})`);
  lines.push(`Range: ${Math.round(minCentroid)}-${Math.round(maxCentroid)} Hz`);

  return lines.join('\n');
}

/**
 * Generate full analysis report
 */
export function generateAnalysisReport(
  analysis: PerceptualAnalysis,
  sectionName?: string
): string {
  const description = describeAudio(analysis);
  const lines: string[] = [];

  // Header
  lines.push('═'.repeat(60));
  lines.push(sectionName
    ? `Audio Analysis: ${sectionName}`
    : 'Audio Analysis'
  );
  lines.push('═'.repeat(60));
  lines.push('');

  // Basic info
  lines.push(`Duration: ${formatTime(analysis.duration)}`);
  lines.push(`Sample rate: ${analysis.sampleRate} Hz`);
  lines.push('');

  // Spectral profile
  lines.push('SPECTRAL PROFILE:');
  lines.push(`  ${description.brightnessText}`);
  lines.push(`  ${description.textureText}`);
  lines.push('');

  // Energy
  lines.push('ENERGY:');
  lines.push(`  ${description.energyText}`);
  lines.push(`  Envelope: ${description.envelopeText}`);
  lines.push('');

  // Tonality
  lines.push('TONALITY:');
  lines.push(`  ${description.tonality.text}`);
  lines.push('');

  // Chromagram visualization
  lines.push(formatChromagramASCII(analysis.chromagram));
  lines.push('');

  // Energy curve
  lines.push(formatEnergyCurveASCII(analysis.rmsOverTime, analysis.frameTimes));
  lines.push('');

  // Character
  if (description.character.length > 0) {
    lines.push('CHARACTER:');
    lines.push(`  ${description.character.join(', ')}`);
    lines.push('');
  }

  // Observations
  if (description.observations.length > 0) {
    lines.push('OBSERVATIONS:');
    for (const obs of description.observations) {
      lines.push(`  • ${obs}`);
    }
    lines.push('');
  }

  // Summary
  lines.push('─'.repeat(60));
  lines.push(`Summary: ${description.summary}`);
  lines.push('─'.repeat(60));

  return lines.join('\n');
}
