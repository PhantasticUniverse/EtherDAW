import { describe, it, expect } from 'vitest';
import {
  parseChord,
  parseChords,
  getChordNotes,
  getSupportedChordQualities,
} from './chord-parser.js';

describe('parseChord', () => {
  it('parses major chords', () => {
    const chord = parseChord('C:w');
    expect(chord.root).toBe('C');
    expect(chord.quality).toBe('maj');
    expect(chord.durationBeats).toBe(4);
    expect(chord.notes).toContain('C3');
    expect(chord.notes).toContain('E3');
    expect(chord.notes).toContain('G3');
  });

  it('parses minor chords', () => {
    const chord = parseChord('Am:h');
    expect(chord.root).toBe('A');
    expect(chord.quality).toBe('m');
    expect(chord.notes).toHaveLength(3);
    expect(chord.durationBeats).toBe(2);
  });

  it('parses seventh chords', () => {
    const chord = parseChord('Cmaj7:q');
    expect(chord.quality).toBe('maj7');
    expect(chord.notes).toHaveLength(4);
  });

  it('parses dominant seventh', () => {
    const chord = parseChord('G7:q');
    expect(chord.quality).toBe('7');
    expect(chord.notes).toHaveLength(4);
  });

  it('parses sharp root notes', () => {
    const chord = parseChord('F#m:h');
    expect(chord.root).toBe('F#');
    expect(chord.quality).toBe('m');
  });

  it('parses flat root notes', () => {
    const chord = parseChord('Bbmaj7:w');
    expect(chord.root).toBe('Bb');
    expect(chord.quality).toBe('maj7');
  });

  it('parses diminished chords', () => {
    const chord = parseChord('Bdim:q');
    expect(chord.quality).toBe('dim');
    expect(chord.notes).toHaveLength(3);
  });

  it('parses augmented chords', () => {
    const chord = parseChord('Caug:q');
    expect(chord.quality).toBe('aug');
    expect(chord.notes).toHaveLength(3);
  });

  it('parses suspended chords', () => {
    const sus2 = parseChord('Csus2:q');
    expect(sus2.quality).toBe('sus2');

    const sus4 = parseChord('Gsus4:h');
    expect(sus4.quality).toBe('sus4');
  });

  it('parses slash chords', () => {
    const chord = parseChord('C/E:w');
    expect(chord.root).toBe('C');
    expect(chord.bass).toBe('E');
    expect(chord.notes[0]).toBe('E2'); // Bass note in lower octave
  });

  it('parses dotted durations', () => {
    const chord = parseChord('Am:h.');
    expect(chord.durationBeats).toBe(3);
  });

  it('parses extended chords', () => {
    const ninth = parseChord('C9:q');
    expect(ninth.notes).toHaveLength(5);

    const eleventh = parseChord('C11:q');
    expect(eleventh.notes.length).toBeGreaterThanOrEqual(5);
  });

  it('parses add chords', () => {
    const add9 = parseChord('Cadd9:q');
    expect(add9.notes).toHaveLength(4);
  });

  it('throws on invalid format', () => {
    expect(() => parseChord('invalid')).toThrow();
    expect(() => parseChord('C')).toThrow(); // missing duration
  });

  it('uses custom octave', () => {
    const chord = parseChord('C:q', 4);
    expect(chord.notes).toContain('C4');
  });
});

describe('parseChords', () => {
  it('parses array of chords', () => {
    const chords = parseChords(['C:q', 'Am:q', 'F:h', 'G:h']);
    expect(chords).toHaveLength(4);
    expect(chords[0].root).toBe('C');
    expect(chords[1].root).toBe('A');
    expect(chords[2].root).toBe('F');
    expect(chords[3].root).toBe('G');
  });
});

describe('getChordNotes', () => {
  it('gets notes for major chord', () => {
    const notes = getChordNotes('C', 4);
    expect(notes).toContain('C4');
    expect(notes).toContain('E4');
    expect(notes).toContain('G4');
  });

  it('gets notes for minor seventh', () => {
    const notes = getChordNotes('Am7', 3);
    expect(notes).toHaveLength(4);
  });

  it('gets notes with custom octave', () => {
    const notes = getChordNotes('Fmaj7', 2);
    expect(notes[0]).toBe('F2');
  });
});

describe('getSupportedChordQualities', () => {
  it('returns array of qualities', () => {
    const qualities = getSupportedChordQualities();
    expect(qualities).toContain('maj');
    expect(qualities).toContain('m');
    expect(qualities).toContain('7');
    expect(qualities).toContain('maj7');
    expect(qualities).toContain('dim');
    expect(qualities).toContain('aug');
  });
});
