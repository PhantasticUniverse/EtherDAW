/**
 * MIDI export functionality for EtherDAW
 */

import MidiModule from '@tonejs/midi';
const { Midi } = MidiModule;
type MidiType = InstanceType<typeof Midi>;
type TrackType = MidiType['tracks'][number];
import type { Timeline, NoteEvent } from '../schema/types.js';
import { getAllNotes } from '../engine/timeline.js';
import { pitchToMidi } from '../parser/note-parser.js';
import { NOTE_NAMES, MIDI, DEFAULT_SETTINGS } from '../config/constants.js';

/**
 * Options for MIDI export
 */
export interface MidiExportOptions {
  /** Name for the MIDI file */
  name?: string;
  /** Include metadata */
  includeMetadata?: boolean;
  /** Separate instruments into different tracks */
  separateTracks?: boolean;
  /** MIDI channel to use (1-16) if not separating tracks */
  channel?: number;
}

/**
 * Export a timeline to MIDI format
 */
export function exportToMidi(
  timeline: Timeline,
  options: MidiExportOptions = {}
): MidiType {
  const {
    name = 'EtherDAW Export',
    includeMetadata = true,
    separateTracks = true,
  } = options;

  const midi = new Midi();

  // Set header info
  midi.header.setTempo(timeline.settings.tempo);
  if (name) {
    midi.header.name = name;
  }

  const notes = getAllNotes(timeline);

  if (separateTracks) {
    // Create a track for each instrument
    const instrumentNotes = new Map<string, NoteEvent[]>();

    for (const note of notes) {
      if (!instrumentNotes.has(note.instrument)) {
        instrumentNotes.set(note.instrument, []);
      }
      instrumentNotes.get(note.instrument)!.push(note);
    }

    let trackIndex = 0;
    for (const [instrumentName, instrNotes] of instrumentNotes) {
      const track = midi.addTrack();
      track.name = instrumentName;
      track.channel = trackIndex % 16;

      for (const note of instrNotes) {
        addNoteToTrack(track, note);
      }

      trackIndex++;
    }
  } else {
    // Single track
    const track = midi.addTrack();
    track.name = name;
    track.channel = (options.channel ?? 1) - 1;

    for (const note of notes) {
      addNoteToTrack(track, note);
    }
  }

  return midi;
}

/**
 * Add a note event to a MIDI track
 */
function addNoteToTrack(track: TrackType, note: NoteEvent): void {
  const midiNote = pitchToMidi(note.pitch);

  track.addNote({
    midi: midiNote,
    time: note.timeSeconds,
    duration: note.durationSeconds,
    velocity: note.velocity,
  });
}

/**
 * Export timeline to MIDI and return as Uint8Array (for file saving)
 */
export function exportToMidiBytes(
  timeline: Timeline,
  options: MidiExportOptions = {}
): Uint8Array {
  const midi = exportToMidi(timeline, options);
  return midi.toArray();
}

/**
 * Export timeline to MIDI and return as base64 string
 */
export function exportToMidiBase64(
  timeline: Timeline,
  options: MidiExportOptions = {}
): string {
  const bytes = exportToMidiBytes(timeline, options);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Import a MIDI file and convert to a simplified note array
 */
export function importMidi(midiData: ArrayBuffer): {
  tempo: number;
  tracks: Array<{
    name: string;
    notes: Array<{
      pitch: string;
      time: number;
      duration: number;
      velocity: number;
    }>;
  }>;
} {
  const midi = new Midi(midiData);

  const tracks = midi.tracks.map(track => ({
    name: track.name || 'Untitled',
    notes: track.notes.map(note => ({
      pitch: midiToPitchString(note.midi),
      time: note.time,
      duration: note.duration,
      velocity: note.velocity,
    })),
  }));

  return {
    tempo: midi.header.tempos[0]?.bpm ?? DEFAULT_SETTINGS.tempo,
    tracks,
  };
}

/**
 * Convert MIDI note number to pitch string
 */
function midiToPitchString(midiNote: number): string {
  const octave = Math.floor(midiNote / MIDI.SEMITONES_PER_OCTAVE) - 1;
  const noteIndex = midiNote % MIDI.SEMITONES_PER_OCTAVE;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Get MIDI file information
 */
export function getMidiInfo(midiData: ArrayBuffer): {
  name: string;
  duration: number;
  tempo: number;
  trackCount: number;
  noteCount: number;
} {
  const midi = new Midi(midiData);

  return {
    name: midi.header.name || 'Untitled',
    duration: midi.duration,
    tempo: midi.header.tempos[0]?.bpm ?? DEFAULT_SETTINGS.tempo,
    trackCount: midi.tracks.length,
    noteCount: midi.tracks.reduce((sum, t) => sum + t.notes.length, 0),
  };
}
