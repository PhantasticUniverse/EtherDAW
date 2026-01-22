/**
 * MIDI to Audio Renderer
 *
 * Renders MIDI files to WAV using basic synthesis for comparison/testing.
 * This is a simple renderer - not meant to replace proper DAW rendering.
 */

import * as fs from 'fs';
import { writeWavFile, midiToFreq, applyFades } from './test-signals.js';

interface MidiNote {
  pitch: number;
  velocity: number;
  startTime: number;  // seconds
  duration: number;   // seconds
  channel: number;
}

interface MidiFile {
  format: number;
  ticksPerBeat: number;
  tempo: number;  // BPM
  notes: MidiNote[];
  durationSeconds: number;
}

/**
 * Parse a MIDI file
 * Simplified parser - handles common Type 0 and Type 1 MIDI files
 */
export function parseMidiFile(filePath: string): MidiFile {
  const buffer = fs.readFileSync(filePath);
  let offset = 0;

  // Read header chunk
  const headerChunk = buffer.toString('ascii', 0, 4);
  if (headerChunk !== 'MThd') {
    throw new Error('Not a valid MIDI file: missing MThd header');
  }

  const headerLength = buffer.readUInt32BE(4);
  const format = buffer.readUInt16BE(8);
  const numTracks = buffer.readUInt16BE(10);
  const timeDivision = buffer.readUInt16BE(12);

  // Check if it's SMPTE or ticks per beat
  let ticksPerBeat: number;
  if (timeDivision & 0x8000) {
    // SMPTE time - not commonly used, approximate
    ticksPerBeat = 480;
  } else {
    ticksPerBeat = timeDivision;
  }

  offset = 8 + headerLength;

  // Default tempo (120 BPM)
  let tempo = 120;
  const notes: MidiNote[] = [];
  const activeNotes: Map<string, { pitch: number; velocity: number; startTicks: number; channel: number }> = new Map();
  let totalTicks = 0;

  // Parse tracks
  for (let track = 0; track < numTracks && offset < buffer.length; track++) {
    const trackChunk = buffer.toString('ascii', offset, offset + 4);
    if (trackChunk !== 'MTrk') {
      throw new Error(`Invalid track chunk at offset ${offset}`);
    }

    const trackLength = buffer.readUInt32BE(offset + 4);
    offset += 8;
    const trackEnd = offset + trackLength;

    let currentTicks = 0;
    let runningStatus = 0;

    while (offset < trackEnd) {
      // Read delta time (variable length)
      let deltaTime = 0;
      let byte: number;
      do {
        byte = buffer.readUInt8(offset++);
        deltaTime = (deltaTime << 7) | (byte & 0x7f);
      } while (byte & 0x80);

      currentTicks += deltaTime;
      if (currentTicks > totalTicks) totalTicks = currentTicks;

      // Read event
      let status = buffer.readUInt8(offset);

      if (status < 0x80) {
        // Running status
        status = runningStatus;
      } else {
        offset++;
        if (status < 0xf0) {
          runningStatus = status;
        }
      }

      const eventType = status & 0xf0;
      const channel = status & 0x0f;

      if (eventType === 0x90) {
        // Note on
        const pitch = buffer.readUInt8(offset++);
        const velocity = buffer.readUInt8(offset++);

        if (velocity > 0) {
          // Note on with velocity
          const key = `${channel}-${pitch}`;
          activeNotes.set(key, {
            pitch,
            velocity,
            startTicks: currentTicks,
            channel,
          });
        } else {
          // Note on with velocity 0 = note off
          const key = `${channel}-${pitch}`;
          const noteOn = activeNotes.get(key);
          if (noteOn) {
            notes.push({
              pitch: noteOn.pitch,
              velocity: noteOn.velocity / 127,
              startTime: 0,  // Will calculate after we know tempo
              duration: 0,   // Will calculate
              channel: noteOn.channel,
            });
            notes[notes.length - 1].startTime = noteOn.startTicks;
            notes[notes.length - 1].duration = currentTicks - noteOn.startTicks;
            activeNotes.delete(key);
          }
        }
      } else if (eventType === 0x80) {
        // Note off
        const pitch = buffer.readUInt8(offset++);
        offset++; // Skip velocity

        const key = `${channel}-${pitch}`;
        const noteOn = activeNotes.get(key);
        if (noteOn) {
          notes.push({
            pitch: noteOn.pitch,
            velocity: noteOn.velocity / 127,
            startTime: noteOn.startTicks,
            duration: currentTicks - noteOn.startTicks,
            channel: noteOn.channel,
          });
          activeNotes.delete(key);
        }
      } else if (eventType === 0xa0) {
        // Aftertouch
        offset += 2;
      } else if (eventType === 0xb0) {
        // Control change
        offset += 2;
      } else if (eventType === 0xc0) {
        // Program change
        offset += 1;
      } else if (eventType === 0xd0) {
        // Channel pressure
        offset += 1;
      } else if (eventType === 0xe0) {
        // Pitch bend
        offset += 2;
      } else if (status === 0xff) {
        // Meta event
        const metaType = buffer.readUInt8(offset++);
        let metaLength = 0;
        let b: number;
        do {
          b = buffer.readUInt8(offset++);
          metaLength = (metaLength << 7) | (b & 0x7f);
        } while (b & 0x80);

        if (metaType === 0x51 && metaLength === 3) {
          // Tempo change
          const microsecondsPerBeat =
            (buffer.readUInt8(offset) << 16) |
            (buffer.readUInt8(offset + 1) << 8) |
            buffer.readUInt8(offset + 2);
          tempo = 60000000 / microsecondsPerBeat;
        }

        offset += metaLength;
      } else if (status === 0xf0 || status === 0xf7) {
        // SysEx
        let sysexLength = 0;
        let b: number;
        do {
          b = buffer.readUInt8(offset++);
          sysexLength = (sysexLength << 7) | (b & 0x7f);
        } while (b & 0x80);
        offset += sysexLength;
      }
    }
  }

  // Convert ticks to seconds
  const secondsPerTick = 60 / (tempo * ticksPerBeat);

  for (const note of notes) {
    const startTicks = note.startTime;
    const durationTicks = note.duration;
    note.startTime = startTicks * secondsPerTick;
    note.duration = durationTicks * secondsPerTick;
  }

  const durationSeconds = totalTicks * secondsPerTick;

  return {
    format,
    ticksPerBeat,
    tempo,
    notes,
    durationSeconds,
  };
}

/**
 * Simple sine-based synth for rendering
 */
function generateNote(
  pitch: number,
  velocity: number,
  duration: number,
  sampleRate: number
): Float32Array {
  const frequency = midiToFreq(pitch);
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);

  // ADSR envelope
  const attackSamples = Math.min(Math.floor(0.01 * sampleRate), numSamples);
  const decaySamples = Math.min(Math.floor(0.1 * sampleRate), numSamples);
  const sustainLevel = 0.7;
  const releaseSamples = Math.min(Math.floor(0.1 * sampleRate), numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Generate sound (sine with harmonics for more realistic tone)
    let sample = Math.sin(2 * Math.PI * frequency * t);
    sample += 0.3 * Math.sin(2 * Math.PI * frequency * 2 * t); // Octave
    sample += 0.15 * Math.sin(2 * Math.PI * frequency * 3 * t); // Fifth
    sample += 0.1 * Math.sin(2 * Math.PI * frequency * 4 * t);
    sample *= 0.4; // Normalize

    // Apply envelope
    let envelope: number;
    if (i < attackSamples) {
      envelope = i / attackSamples;
    } else if (i < attackSamples + decaySamples) {
      const decayProgress = (i - attackSamples) / decaySamples;
      envelope = 1 - (1 - sustainLevel) * decayProgress;
    } else if (i >= numSamples - releaseSamples) {
      const releaseProgress = (numSamples - i) / releaseSamples;
      envelope = sustainLevel * releaseProgress;
    } else {
      envelope = sustainLevel;
    }

    samples[i] = sample * envelope * velocity;
  }

  return samples;
}

/**
 * Render MIDI file to WAV
 */
export async function renderMidiToWav(
  midiPath: string,
  outputPath: string,
  sampleRate: number = 44100
): Promise<void> {
  const midi = parseMidiFile(midiPath);

  // Add some padding
  const duration = midi.durationSeconds + 0.5;
  const numSamples = Math.floor(duration * sampleRate);
  const output = new Float32Array(numSamples);

  console.log(`  Tempo: ${midi.tempo.toFixed(1)} BPM`);
  console.log(`  Notes: ${midi.notes.length}`);
  console.log(`  Duration: ${midi.durationSeconds.toFixed(1)}s`);

  // Render each note
  for (const note of midi.notes) {
    const noteAudio = generateNote(
      note.pitch,
      note.velocity,
      note.duration,
      sampleRate
    );

    const startSample = Math.floor(note.startTime * sampleRate);

    for (let i = 0; i < noteAudio.length; i++) {
      const outIdx = startSample + i;
      if (outIdx < numSamples) {
        output[outIdx] += noteAudio[i];
      }
    }
  }

  // Normalize to prevent clipping
  let maxAbs = 0;
  for (let i = 0; i < output.length; i++) {
    const abs = Math.abs(output[i]);
    if (abs > maxAbs) maxAbs = abs;
  }

  if (maxAbs > 0.9) {
    const gain = 0.9 / maxAbs;
    for (let i = 0; i < output.length; i++) {
      output[i] *= gain;
    }
  }

  // Apply overall fades
  const faded = applyFades(output, 0.01, 0.05, sampleRate);

  writeWavFile(faded, outputPath, sampleRate);
}

/**
 * Create a simple MIDI file with a melody
 * Useful for creating test reference files
 */
export function createTestMidi(filePath: string, notes: Array<{ pitch: number; duration: number }>, tempo: number = 120): void {
  const ticksPerBeat = 480;
  const secondsPerTick = 60 / (tempo * ticksPerBeat);

  // Calculate required bytes
  const trackEvents: number[] = [];

  // Tempo meta event
  const microsecondsPerBeat = Math.floor(60000000 / tempo);
  trackEvents.push(0x00, 0xff, 0x51, 0x03);
  trackEvents.push((microsecondsPerBeat >> 16) & 0xff);
  trackEvents.push((microsecondsPerBeat >> 8) & 0xff);
  trackEvents.push(microsecondsPerBeat & 0xff);

  // Note events
  let currentTick = 0;
  for (const note of notes) {
    const durationTicks = Math.floor(note.duration / secondsPerTick);

    // Note on (delta time 0 for first, then delta from previous)
    const deltaOn = currentTick === 0 ? 0 : 0;
    trackEvents.push(...encodeVariableLength(deltaOn));
    trackEvents.push(0x90, note.pitch, 100); // Channel 0, velocity 100

    // Note off
    trackEvents.push(...encodeVariableLength(durationTicks));
    trackEvents.push(0x80, note.pitch, 0);

    currentTick += durationTicks;
  }

  // End of track
  trackEvents.push(0x00, 0xff, 0x2f, 0x00);

  // Build MIDI file
  const header = Buffer.alloc(14);
  header.write('MThd', 0);
  header.writeUInt32BE(6, 4);
  header.writeUInt16BE(0, 8);   // Format 0
  header.writeUInt16BE(1, 10);  // 1 track
  header.writeUInt16BE(ticksPerBeat, 12);

  const trackHeader = Buffer.alloc(8);
  trackHeader.write('MTrk', 0);
  trackHeader.writeUInt32BE(trackEvents.length, 4);

  const trackData = Buffer.from(trackEvents);

  const midiFile = Buffer.concat([header, trackHeader, trackData]);
  fs.writeFileSync(filePath, midiFile);
}

function encodeVariableLength(value: number): number[] {
  const bytes: number[] = [];
  bytes.push(value & 0x7f);
  value >>= 7;

  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }

  return bytes;
}

/**
 * Create "Mary Had a Little Lamb" MIDI file for testing
 */
export function createMaryHadALittleLamb(filePath: string): void {
  // E D C D E E E r D D D r E G G r E D C D E E E E D D E D C
  const quarter = 0.5;  // seconds
  const half = 1.0;

  const melody = [
    { pitch: 64, duration: quarter },  // E
    { pitch: 62, duration: quarter },  // D
    { pitch: 60, duration: quarter },  // C
    { pitch: 62, duration: quarter },  // D
    { pitch: 64, duration: quarter },  // E
    { pitch: 64, duration: quarter },  // E
    { pitch: 64, duration: half },     // E (half)
    { pitch: 62, duration: quarter },  // D
    { pitch: 62, duration: quarter },  // D
    { pitch: 62, duration: half },     // D (half)
    { pitch: 64, duration: quarter },  // E
    { pitch: 67, duration: quarter },  // G
    { pitch: 67, duration: half },     // G (half)
    { pitch: 64, duration: quarter },  // E
    { pitch: 62, duration: quarter },  // D
    { pitch: 60, duration: quarter },  // C
    { pitch: 62, duration: quarter },  // D
    { pitch: 64, duration: quarter },  // E
    { pitch: 64, duration: quarter },  // E
    { pitch: 64, duration: quarter },  // E
    { pitch: 64, duration: quarter },  // E
    { pitch: 62, duration: quarter },  // D
    { pitch: 62, duration: quarter },  // D
    { pitch: 64, duration: quarter },  // E
    { pitch: 62, duration: quarter },  // D
    { pitch: 60, duration: half },     // C (final)
  ];

  createTestMidi(filePath, melody, 100);
}
