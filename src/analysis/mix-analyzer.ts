/**
 * Mix Analyzer for EtherDAW v0.9.10
 *
 * Provides text-based mix analysis so LLMs can understand what they created.
 * Composites existing perceptual analysis functions into actionable mix feedback.
 *
 * Key metrics:
 * - Frequency Balance: Low/mid/high energy distribution
 * - Section Energy: RMS loudness per section for dynamic arc verification
 * - Dynamic Range: Peak-to-RMS ratio, headroom analysis
 * - Mix Suggestions: Actionable text based on analysis
 */

import { analyzePerceptual, computeRMSEnergy, describeEnergy } from './perceptual.js';
import { describeAudio } from './describe-audio.js';
import { calculateFrequencyBalance, type FrequencyBalance } from './benchmark-verifier.js';

/**
 * Section energy metrics
 */
export interface SectionEnergy {
  /** RMS energy in dB */
  rmsDb: number;
  /** Peak level in dB */
  peakDb: number;
  /** Energy category: quiet, soft, moderate, loud, intense */
  category: string;
}

/**
 * Full mix analysis report
 */
export interface MixReport {
  /** Frequency balance: low/mid/high percentages */
  frequencyBalance: FrequencyBalance;

  /** Energy metrics for each section */
  sectionEnergy: Record<string, SectionEnergy>;

  /** Overall dynamic range in dB (difference between loudest and quietest section) */
  dynamicRange: number;

  /** Headroom: dB below 0 (clipping threshold) */
  headroom: number;

  /** Peak level in dB */
  peakLevel: number;

  /** Average RMS level in dB */
  averageRms: number;

  /** LLM-friendly suggestions for mix improvement */
  suggestions: string[];

  /** Frequency balance description */
  frequencyDescription: string;

  /** Energy arc description (building, decaying, arc, steady, dynamic) */
  energyArc: string;
}

/**
 * Options for mix analysis
 */
export interface MixAnalysisOptions {
  /** Target peak level in dB (default: -3) */
  targetPeak?: number;
  /** Minimum acceptable dynamic range in dB (default: 6) */
  minDynamicRange?: number;
}

/**
 * Analyze a single audio segment and return energy metrics
 */
export function analyzeSegmentEnergy(
  samples: Float32Array,
  sampleRate: number
): SectionEnergy {
  // Calculate RMS
  const { rmsDb } = computeRMSEnergy(samples, sampleRate);
  const avgRmsDb = rmsDb.length > 0
    ? rmsDb.reduce((a, b) => a + b, 0) / rmsDb.length
    : -80;

  // Calculate peak
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }
  const peakDb = peak > 0 ? 20 * Math.log10(peak) : -80;

  // Categorize
  const category = describeEnergy(avgRmsDb);

  return {
    rmsDb: avgRmsDb,
    peakDb,
    category,
  };
}

/**
 * Describe frequency balance in human terms
 */
function describeFrequencyBalance(balance: FrequencyBalance): string {
  const { low, mid, high } = balance;

  // Check for imbalances
  const descriptions: string[] = [];

  if (low > 0.45) {
    descriptions.push('bass-heavy');
  } else if (low < 0.15) {
    descriptions.push('thin (lacking bass)');
  }

  if (mid > 0.6) {
    descriptions.push('mid-focused');
  } else if (mid < 0.3) {
    descriptions.push('scooped mids');
  }

  if (high > 0.35) {
    descriptions.push('bright/treble-heavy');
  } else if (high < 0.1) {
    descriptions.push('dark (lacking highs)');
  }

  if (descriptions.length === 0) {
    return 'balanced';
  }

  return descriptions.join(', ');
}

/**
 * Determine energy arc from section energies
 */
function determineEnergyArc(sectionEnergies: Record<string, SectionEnergy>): string {
  const entries = Object.entries(sectionEnergies);
  if (entries.length < 2) return 'single section';

  const energies = entries.map(([_, e]) => e.rmsDb);

  // Check trends
  let increasing = 0;
  let decreasing = 0;

  for (let i = 1; i < energies.length; i++) {
    const diff = energies[i] - energies[i - 1];
    if (diff > 1) increasing++;
    else if (diff < -1) decreasing++;
  }

  const segments = energies.length - 1;
  const threshold = segments * 0.6;

  if (increasing > threshold) return 'building';
  if (decreasing > threshold) return 'decaying';

  // Check for arc (rise then fall)
  const midpoint = Math.floor(energies.length / 2);
  const firstHalf = energies.slice(0, midpoint);
  const secondHalf = energies.slice(midpoint);

  const firstIncreasing = firstHalf.every((e, i) => i === 0 || e >= firstHalf[i - 1] - 1);
  const secondDecreasing = secondHalf.every((e, i) => i === 0 || e <= secondHalf[i - 1] + 1);

  if (firstIncreasing && secondDecreasing && firstHalf.length > 1 && secondHalf.length > 1) {
    return 'arc (rise then fall)';
  }

  // Check variance
  const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
  const variance = energies.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / energies.length;

  if (variance < 4) return 'steady';
  return 'dynamic';
}

/**
 * Generate actionable mix suggestions based on analysis
 */
function generateMixSuggestions(
  frequencyBalance: FrequencyBalance,
  sectionEnergies: Record<string, SectionEnergy>,
  dynamicRange: number,
  headroom: number,
  options: MixAnalysisOptions
): string[] {
  const suggestions: string[] = [];
  const { targetPeak = -3, minDynamicRange = 6 } = options;

  // Frequency balance suggestions
  if (frequencyBalance.low > 0.5) {
    suggestions.push('Mix is bass-heavy - consider reducing bass instrument volumes or EQing the low end');
  } else if (frequencyBalance.low < 0.1) {
    suggestions.push('Mix lacks bass presence - check bass instrument volume or add sub-bass');
  }

  if (frequencyBalance.high > 0.4) {
    suggestions.push('Mix is treble-heavy - this may cause listener fatigue; consider softening high frequencies');
  } else if (frequencyBalance.high < 0.08) {
    suggestions.push('Mix lacks brightness - melodies may sound dull; consider boosting lead instrument presence');
  }

  if (frequencyBalance.mid > 0.65) {
    suggestions.push('Heavy midrange concentration - may cause muddy sound; spread instruments across frequency spectrum');
  }

  // Dynamic range suggestions
  if (dynamicRange < minDynamicRange) {
    suggestions.push(`Dynamic range is narrow (${dynamicRange.toFixed(1)} dB) - consider more contrast between quiet and loud sections`);
  }

  if (dynamicRange > 30) {
    suggestions.push(`Very wide dynamic range (${dynamicRange.toFixed(1)} dB) - quiet sections may be inaudible; consider compression`);
  }

  // Headroom suggestions
  if (headroom < 1) {
    suggestions.push('Mix is near clipping - reduce overall volume for headroom');
  } else if (headroom > 12) {
    suggestions.push('Mix is very quiet - consider increasing overall volume');
  }

  // Section-specific suggestions
  const entries = Object.entries(sectionEnergies);
  if (entries.length >= 2) {
    // Check for energy progression issues
    const first = entries[0];
    const last = entries[entries.length - 1];

    if (first[1].rmsDb > last[1].rmsDb + 3) {
      suggestions.push(`Opening "${first[0]}" is louder than ending "${last[0]}" - composition may feel anticlimactic`);
    }

    // Find loudest and quietest
    let loudest = entries[0];
    let quietest = entries[0];
    for (const entry of entries) {
      if (entry[1].rmsDb > loudest[1].rmsDb) loudest = entry;
      if (entry[1].rmsDb < quietest[1].rmsDb) quietest = entry;
    }

    if (loudest[1].rmsDb - quietest[1].rmsDb < 3 && entries.length > 2) {
      suggestions.push('All sections have similar energy - consider more dynamic variation between verse and chorus');
    }
  }

  // If no issues found
  if (suggestions.length === 0) {
    suggestions.push('Mix balance looks good - no major issues detected');
  }

  return suggestions;
}

/**
 * Analyze mix from rendered section samples
 *
 * @param sectionSamples Map of section name to rendered audio samples
 * @param sampleRate Sample rate of the audio
 * @param options Analysis options
 */
export function analyzeMix(
  sectionSamples: Map<string, Float32Array>,
  sampleRate: number,
  options: MixAnalysisOptions = {}
): MixReport {
  // Combine all samples for overall frequency analysis
  let totalLength = 0;
  for (const samples of sectionSamples.values()) {
    totalLength += samples.length;
  }

  const allSamples = new Float32Array(totalLength);
  let offset = 0;
  for (const samples of sectionSamples.values()) {
    allSamples.set(samples, offset);
    offset += samples.length;
  }

  // Calculate overall frequency balance
  const frequencyBalance = calculateFrequencyBalance(allSamples, sampleRate);

  // Analyze each section
  const sectionEnergy: Record<string, SectionEnergy> = {};
  let overallPeak = -80;
  let overallRmsSum = 0;
  let sectionCount = 0;

  for (const [name, samples] of sectionSamples.entries()) {
    const energy = analyzeSegmentEnergy(samples, sampleRate);
    sectionEnergy[name] = energy;

    if (energy.peakDb > overallPeak) {
      overallPeak = energy.peakDb;
    }
    overallRmsSum += energy.rmsDb;
    sectionCount++;
  }

  const averageRms = sectionCount > 0 ? overallRmsSum / sectionCount : -80;
  const headroom = Math.abs(overallPeak);

  // Calculate dynamic range (difference between loudest and quietest section)
  const energyValues = Object.values(sectionEnergy).map(e => e.rmsDb);
  const maxRms = Math.max(...energyValues);
  const minRms = Math.min(...energyValues);
  const dynamicRange = maxRms - minRms;

  // Generate descriptions and suggestions
  const frequencyDescription = describeFrequencyBalance(frequencyBalance);
  const energyArc = determineEnergyArc(sectionEnergy);
  const suggestions = generateMixSuggestions(
    frequencyBalance,
    sectionEnergy,
    dynamicRange,
    headroom,
    options
  );

  return {
    frequencyBalance,
    sectionEnergy,
    dynamicRange,
    headroom,
    peakLevel: overallPeak,
    averageRms,
    suggestions,
    frequencyDescription,
    energyArc,
  };
}

/**
 * Analyze mix from a single audio sample (full composition)
 * Provides overall metrics without section breakdown
 */
export function analyzeMixSimple(
  samples: Float32Array,
  sampleRate: number,
  options: MixAnalysisOptions = {}
): MixReport {
  // Create single section entry
  const sectionSamples = new Map<string, Float32Array>();
  sectionSamples.set('full', samples);

  return analyzeMix(sectionSamples, sampleRate, options);
}

/**
 * Format frequency balance as ASCII bar visualization
 */
function formatFrequencyBalanceASCII(balance: FrequencyBalance): string {
  const maxBar = 20;
  const lines: string[] = [];

  const formatBar = (value: number, label: string, range: string) => {
    const barLen = Math.round(value * maxBar);
    const bar = '\u2588'.repeat(barLen) + '\u2591'.repeat(maxBar - barLen);
    const pct = (value * 100).toFixed(0).padStart(3);
    return `  ${label.padEnd(6)} |${bar}| ${pct}%  ${range}`;
  };

  lines.push(formatBar(balance.low, 'Low', '(<250 Hz)'));
  lines.push(formatBar(balance.mid, 'Mid', '(250-4k Hz)'));
  lines.push(formatBar(balance.high, 'High', '(>4k Hz)'));

  return lines.join('\n');
}

/**
 * Format section energy as ASCII visualization
 */
function formatSectionEnergyASCII(sectionEnergy: Record<string, SectionEnergy>): string {
  const entries = Object.entries(sectionEnergy);
  if (entries.length === 0) return 'No section data';

  const maxNameLen = Math.max(...entries.map(([name]) => name.length), 8);
  const lines: string[] = [];

  // Find range for normalization
  const rmsValues = entries.map(([_, e]) => e.rmsDb);
  const maxRms = Math.max(...rmsValues);
  const minRms = Math.min(...rmsValues, -40);
  const range = maxRms - minRms;

  for (const [name, energy] of entries) {
    const normalizedEnergy = range > 0 ? (energy.rmsDb - minRms) / range : 0.5;
    const barLen = Math.round(normalizedEnergy * 15);
    const bar = '\u2588'.repeat(barLen) + '\u2591'.repeat(15 - barLen);

    const nameCol = name.padEnd(maxNameLen);
    const dbCol = `${energy.rmsDb.toFixed(1)} dB`.padStart(9);
    const category = energy.category.padEnd(10);

    lines.push(`  ${nameCol}  ${bar}  ${dbCol}  ${category}`);
  }

  return lines.join('\n');
}

/**
 * Format full mix report as ASCII for terminal display
 */
export function formatMixReportASCII(report: MixReport, title?: string): string {
  const lines: string[] = [];
  const width = 60;

  // Header
  lines.push('='.repeat(width));
  lines.push(title ? `Mix Analysis: ${title}` : 'Mix Analysis');
  lines.push('='.repeat(width));
  lines.push('');

  // Frequency Balance
  lines.push('FREQUENCY BALANCE:');
  lines.push(formatFrequencyBalanceASCII(report.frequencyBalance));
  lines.push('');
  lines.push(`  Character: ${report.frequencyDescription}`);
  lines.push('');

  // Section Energy (if more than one section)
  const sectionCount = Object.keys(report.sectionEnergy).length;
  if (sectionCount > 1) {
    lines.push('SECTION ENERGY:');
    lines.push(formatSectionEnergyASCII(report.sectionEnergy));
    lines.push('');
    lines.push(`  Energy arc: ${report.energyArc}`);
    lines.push(`  Dynamic range: ${report.dynamicRange.toFixed(1)} dB`);
    lines.push('');
  }

  // Levels
  lines.push('LEVELS:');
  lines.push(`  Peak level: ${report.peakLevel.toFixed(1)} dB`);
  lines.push(`  Average RMS: ${report.averageRms.toFixed(1)} dB`);
  lines.push(`  Headroom: ${report.headroom.toFixed(1)} dB`);
  lines.push('');

  // Suggestions
  lines.push('SUGGESTIONS:');
  for (const suggestion of report.suggestions) {
    lines.push(`  \u2022 ${suggestion}`);
  }
  lines.push('');

  lines.push('-'.repeat(width));

  return lines.join('\n');
}

/**
 * Generate a quick summary line for the mix
 */
export function getMixSummary(report: MixReport): string {
  const parts: string[] = [];

  parts.push(report.frequencyDescription);
  parts.push(`${report.dynamicRange.toFixed(0)}dB range`);
  parts.push(`peak: ${report.peakLevel.toFixed(0)}dB`);

  if (report.suggestions.length === 1 && report.suggestions[0].includes('looks good')) {
    parts.push('balanced');
  } else {
    parts.push(`${report.suggestions.length} suggestion${report.suggestions.length !== 1 ? 's' : ''}`);
  }

  return parts.join(' \u00B7 ');
}
