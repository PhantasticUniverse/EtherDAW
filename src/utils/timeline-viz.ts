/**
 * Timeline Visualization for EtherDAW v0.9.6
 *
 * ASCII visualization of composition structure.
 * Helps composers see section flow and track arrangement at a glance.
 */

import type { EtherScore } from '../schema/types.js';

/**
 * Generate an ASCII timeline showing section structure
 */
export function generateSectionTimeline(
  score: EtherScore,
  options: { width?: number } = {}
): string {
  const width = options.width ?? 80;
  const lines: string[] = [];
  const tempo = score.settings.tempo;
  const beatsPerBar = getBeatsPerBar(score.settings.timeSignature);

  // Calculate section data
  const sectionData: Array<{
    name: string;
    startBeat: number;
    endBeat: number;
    bars: number;
    instruments: string[];
  }> = [];

  let currentBeat = 0;
  for (const sectionName of score.arrangement) {
    const section = score.sections[sectionName];
    if (!section) continue;

    const bars = section.bars || 4;
    const beats = bars * beatsPerBar;
    const instruments = Object.keys(section.tracks || {});

    sectionData.push({
      name: sectionName,
      startBeat: currentBeat,
      endBeat: currentBeat + beats,
      bars,
      instruments,
    });

    currentBeat += beats;
  }

  const totalBeats = currentBeat;
  const totalSeconds = (totalBeats / tempo) * 60;
  const totalBars = totalBeats / beatsPerBar;

  // Header
  const title = score.meta?.title || 'Untitled';
  lines.push(`Timeline: ${title} (${formatDuration(totalSeconds)})`);
  lines.push('═'.repeat(width));
  lines.push('');

  // Time markers
  const timeMarkerLine = generateTimeMarkers(totalSeconds, width);
  lines.push(timeMarkerLine);
  lines.push('│' + ' '.repeat(width - 2) + '│');

  // Section bars
  for (const section of sectionData) {
    const startPct = section.startBeat / totalBeats;
    const endPct = section.endBeat / totalBeats;
    const startCol = Math.floor(startPct * (width - 2)) + 1;
    const endCol = Math.floor(endPct * (width - 2)) + 1;
    const barWidth = Math.max(2, endCol - startCol);

    // Section name line
    let nameLine = '├';
    nameLine += '─'.repeat(startCol - 1);
    nameLine += ' ' + truncate(section.name, barWidth - 2) + ' ';
    const remaining = width - nameLine.length - 1;
    nameLine += '─'.repeat(Math.max(0, remaining));
    nameLine += '┤';
    lines.push(nameLine);

    // Instruments line
    const instrumentStr = `[${section.instruments.join(', ')}]`;
    let instrLine = '│';
    instrLine += ' '.repeat(startCol - 1);
    instrLine += '  ' + truncate(instrumentStr, barWidth - 4);
    const instrRemaining = width - instrLine.length - 1;
    instrLine += ' '.repeat(Math.max(0, instrRemaining));
    instrLine += '│';
    lines.push(instrLine);

    lines.push('│' + ' '.repeat(width - 2) + '│');
  }

  // Footer
  lines.push('═'.repeat(width));
  lines.push('');
  lines.push(`Sections: ${sectionData.length} | Bars: ${totalBars} | Tempo: ${tempo} BPM`);

  return lines.join('\n');
}

/**
 * Generate a track timeline showing instrument activity
 */
export function generateTrackTimeline(
  score: EtherScore,
  options: { width?: number } = {}
): string {
  const width = options.width ?? 80;
  const lines: string[] = [];
  const tempo = score.settings.tempo;
  const beatsPerBar = getBeatsPerBar(score.settings.timeSignature);

  // Collect all instruments and their activity
  const instruments = new Set<string>();
  const instrumentActivity: Map<string, Array<{ start: number; end: number }>> = new Map();

  let currentBeat = 0;
  for (const sectionName of score.arrangement) {
    const section = score.sections[sectionName];
    if (!section) continue;

    const bars = section.bars || 4;
    const beats = bars * beatsPerBar;

    for (const [instrument, track] of Object.entries(section.tracks || {})) {
      instruments.add(instrument);

      if (!instrumentActivity.has(instrument)) {
        instrumentActivity.set(instrument, []);
      }

      instrumentActivity.get(instrument)!.push({
        start: currentBeat,
        end: currentBeat + beats,
      });
    }

    currentBeat += beats;
  }

  const totalBeats = currentBeat;
  const totalSeconds = (totalBeats / tempo) * 60;

  // Header
  lines.push('Track Timeline');
  lines.push('═'.repeat(width));
  lines.push('');

  // Find longest instrument name for padding
  const maxNameLen = Math.max(10, ...Array.from(instruments).map(n => n.length));
  const barWidth = width - maxNameLen - 4;

  // Draw each track
  for (const instrument of Array.from(instruments).sort()) {
    const activity = instrumentActivity.get(instrument) || [];
    let bar = '';

    for (let i = 0; i < barWidth; i++) {
      const beatPos = (i / barWidth) * totalBeats;
      const isActive = activity.some(a => beatPos >= a.start && beatPos < a.end);
      bar += isActive ? '█' : '░';
    }

    lines.push(`${instrument.padEnd(maxNameLen)} │${bar}│`);
  }

  // Time footer
  lines.push(' '.repeat(maxNameLen) + ' │' + ' '.repeat(barWidth) + '│');

  // Time markers at bottom
  const timeMarkers: string[] = [];
  const numMarkers = 4;
  for (let i = 0; i <= numMarkers; i++) {
    const seconds = (i / numMarkers) * totalSeconds;
    timeMarkers.push(formatDuration(seconds));
  }

  let markerLine = ' '.repeat(maxNameLen + 2);
  for (let i = 0; i < timeMarkers.length; i++) {
    const pos = Math.floor((i / numMarkers) * barWidth);
    const marker = timeMarkers[i];
    markerLine = markerLine.padEnd(maxNameLen + 2 + pos) + marker;
  }
  lines.push(markerLine);

  return lines.join('\n');
}

/**
 * Generate a compact section overview
 */
export function generateSectionOverview(score: EtherScore): string {
  const lines: string[] = [];
  const tempo = score.settings.tempo;
  const beatsPerBar = getBeatsPerBar(score.settings.timeSignature);

  lines.push('Section Overview:');
  lines.push('');

  let currentTime = 0;
  for (const sectionName of score.arrangement) {
    const section = score.sections[sectionName];
    if (!section) continue;

    const bars = section.bars || 4;
    const beats = bars * beatsPerBar;
    const durationSeconds = (beats / tempo) * 60;

    const instruments = Object.keys(section.tracks || {});
    const startTime = formatDuration(currentTime);
    const endTime = formatDuration(currentTime + durationSeconds);

    lines.push(`  ${startTime} - ${endTime}  ${sectionName} (${bars} bars)`);
    lines.push(`             └─ ${instruments.join(', ')}`);

    currentTime += durationSeconds;
  }

  lines.push('');
  lines.push(`Total: ${formatDuration(currentTime)}`);

  return lines.join('\n');
}

// Helper functions

function getBeatsPerBar(timeSignature?: string): number {
  if (!timeSignature) return 4;
  const [beats] = timeSignature.split('/').map(Number);
  return beats || 4;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

function generateTimeMarkers(totalSeconds: number, width: number): string {
  const numMarkers = 4;
  let line = '';

  for (let i = 0; i <= numMarkers; i++) {
    const seconds = (i / numMarkers) * totalSeconds;
    const pos = Math.floor((i / numMarkers) * (width - 6));
    const marker = formatDuration(seconds);

    while (line.length < pos) {
      line += ' ';
    }
    line += marker;
  }

  return line;
}
