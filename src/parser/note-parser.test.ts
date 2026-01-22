import { describe, it, expect } from 'vitest';
import {
  parseNote,
  parseRest,
  isRest,
  parseDuration,
  beatsToSeconds,
  pitchToMidi,
  midiToPitch,
  transposePitch,
  parseNotes,
  getArticulationModifiers,
} from './note-parser.js';

describe('parseNote', () => {
  it('parses basic notes', () => {
    const note = parseNote('C4:q');
    expect(note.pitch).toBe('C4');
    expect(note.noteName).toBe('C');
    expect(note.accidental).toBe('');
    expect(note.octave).toBe(4);
    expect(note.duration).toBe('q');
    expect(note.durationBeats).toBe(1);
    expect(note.dotted).toBe(false);
  });

  it('parses sharp notes', () => {
    const note = parseNote('F#3:h');
    expect(note.pitch).toBe('F#3');
    expect(note.noteName).toBe('F');
    expect(note.accidental).toBe('#');
    expect(note.octave).toBe(3);
    expect(note.durationBeats).toBe(2);
  });

  it('parses flat notes', () => {
    const note = parseNote('Bb5:8');
    expect(note.pitch).toBe('Bb5');
    expect(note.noteName).toBe('B');
    expect(note.accidental).toBe('b');
    expect(note.octave).toBe(5);
    expect(note.durationBeats).toBe(0.5);
  });

  it('parses dotted notes', () => {
    const note = parseNote('A4:h.');
    expect(note.durationBeats).toBe(3); // 2 * 1.5
    expect(note.dotted).toBe(true);
  });

  it('parses whole notes', () => {
    const note = parseNote('D3:w');
    expect(note.durationBeats).toBe(4);
  });

  it('parses sixteenth notes', () => {
    const note = parseNote('E4:16');
    expect(note.durationBeats).toBe(0.25);
  });

  it('handles lowercase note names', () => {
    const note = parseNote('c4:q');
    expect(note.noteName).toBe('C');
    expect(note.pitch).toBe('C4');
  });

  it('defaults octave to 4 when not specified', () => {
    const note = parseNote('G:q');
    expect(note.octave).toBe(4);
    expect(note.pitch).toBe('G4');
  });

  it('throws on invalid format', () => {
    expect(() => parseNote('invalid')).toThrow();
    expect(() => parseNote('C4')).toThrow(); // missing duration
    expect(() => parseNote(':q')).toThrow(); // missing note
  });
});

describe('parseRest', () => {
  it('parses quarter rest', () => {
    expect(parseRest('r:q')).toBe(1);
  });

  it('parses half rest', () => {
    expect(parseRest('r:h')).toBe(2);
  });

  it('parses dotted rest', () => {
    expect(parseRest('r:h.')).toBe(3);
  });

  it('throws on invalid format', () => {
    expect(() => parseRest('x:q')).toThrow();
  });
});

describe('isRest', () => {
  it('identifies rests', () => {
    expect(isRest('r:q')).toBe(true);
    expect(isRest('r:h')).toBe(true);
  });

  it('identifies non-rests', () => {
    expect(isRest('C4:q')).toBe(false);
    expect(isRest('rest')).toBe(false);
  });
});

describe('parseDuration', () => {
  it('parses all durations correctly', () => {
    expect(parseDuration('w')).toBe(4);
    expect(parseDuration('h')).toBe(2);
    expect(parseDuration('q')).toBe(1);
    expect(parseDuration('8')).toBe(0.5);
    expect(parseDuration('16')).toBe(0.25);
    expect(parseDuration('32')).toBe(0.125);
  });

  it('handles dotted durations', () => {
    expect(parseDuration('q', true)).toBe(1.5);
    expect(parseDuration('h', true)).toBe(3);
  });
});

describe('beatsToSeconds', () => {
  it('converts at 120 BPM', () => {
    expect(beatsToSeconds(1, 120)).toBe(0.5);
    expect(beatsToSeconds(4, 120)).toBe(2);
  });

  it('converts at 60 BPM', () => {
    expect(beatsToSeconds(1, 60)).toBe(1);
    expect(beatsToSeconds(2, 60)).toBe(2);
  });
});

describe('pitchToMidi', () => {
  it('converts standard pitches', () => {
    expect(pitchToMidi('C4')).toBe(60);
    expect(pitchToMidi('A4')).toBe(69);
    expect(pitchToMidi('C5')).toBe(72);
  });

  it('handles sharps', () => {
    expect(pitchToMidi('C#4')).toBe(61);
    expect(pitchToMidi('F#3')).toBe(54);
  });

  it('handles flats', () => {
    expect(pitchToMidi('Bb4')).toBe(70);
    expect(pitchToMidi('Eb3')).toBe(51);
  });

  it('handles low octaves', () => {
    expect(pitchToMidi('C2')).toBe(36);
    expect(pitchToMidi('C1')).toBe(24);
  });
});

describe('midiToPitch', () => {
  it('converts MIDI to pitch', () => {
    expect(midiToPitch(60)).toBe('C4');
    expect(midiToPitch(69)).toBe('A4');
    expect(midiToPitch(72)).toBe('C5');
  });

  it('uses sharps for accidentals', () => {
    expect(midiToPitch(61)).toBe('C#4');
    expect(midiToPitch(70)).toBe('A#4');
  });
});

describe('transposePitch', () => {
  it('transposes up', () => {
    expect(transposePitch('C4', 2)).toBe('D4');
    expect(transposePitch('C4', 12)).toBe('C5');
  });

  it('transposes down', () => {
    expect(transposePitch('C4', -2)).toBe('A#3');
    expect(transposePitch('C4', -12)).toBe('C3');
  });

  it('handles accidentals', () => {
    expect(transposePitch('F#3', 1)).toBe('G3');
    expect(transposePitch('Bb4', -1)).toBe('A4');
  });
});

describe('parseNotes', () => {
  it('parses array of notes', () => {
    const notes = parseNotes(['C4:q', 'E4:q', 'G4:h']);
    expect(notes).toHaveLength(3);
    expect(notes[0].pitch).toBe('C4');
    expect(notes[1].pitch).toBe('E4');
    expect(notes[2].pitch).toBe('G4');
    expect(notes[2].durationBeats).toBe(2);
  });
});

describe('articulation (v0.3)', () => {
  it('parses staccato notes', () => {
    const note = parseNote('C4:q*');
    expect(note.pitch).toBe('C4');
    expect(note.durationBeats).toBe(1);
    expect(note.articulation).toBe('*');
  });

  it('parses legato notes', () => {
    const note = parseNote('D4:h~');
    expect(note.pitch).toBe('D4');
    expect(note.durationBeats).toBe(2);
    expect(note.articulation).toBe('~');
  });

  it('parses accent notes', () => {
    const note = parseNote('E4:8>');
    expect(note.pitch).toBe('E4');
    expect(note.durationBeats).toBe(0.5);
    expect(note.articulation).toBe('>');
  });

  it('parses marcato notes', () => {
    const note = parseNote('F#3:q^');
    expect(note.pitch).toBe('F#3');
    expect(note.durationBeats).toBe(1);
    expect(note.articulation).toBe('^');
  });

  it('parses dotted notes with articulation', () => {
    const note = parseNote('A4:h.*');
    expect(note.durationBeats).toBe(3);
    expect(note.dotted).toBe(true);
    expect(note.articulation).toBe('*');
  });

  it('defaults to empty articulation', () => {
    const note = parseNote('C4:q');
    expect(note.articulation).toBe('');
  });
});

describe('getArticulationModifiers', () => {
  it('returns staccato modifiers', () => {
    const mods = getArticulationModifiers('*');
    expect(mods.gate).toBe(0.3);
    expect(mods.velocityBoost).toBe(0);
  });

  it('returns legato modifiers', () => {
    const mods = getArticulationModifiers('~');
    expect(mods.gate).toBe(1.1);
    expect(mods.velocityBoost).toBe(0);
  });

  it('returns accent modifiers', () => {
    const mods = getArticulationModifiers('>');
    expect(mods.gate).toBe(1.0);
    expect(mods.velocityBoost).toBe(0.2);
  });

  it('returns marcato modifiers', () => {
    const mods = getArticulationModifiers('^');
    expect(mods.gate).toBe(0.3);
    expect(mods.velocityBoost).toBe(0.2);
  });

  it('returns default modifiers for no articulation', () => {
    const mods = getArticulationModifiers(undefined);
    expect(mods.gate).toBe(1.0);
    expect(mods.velocityBoost).toBe(0);
  });

  it('returns default modifiers for empty string', () => {
    const mods = getArticulationModifiers('');
    expect(mods.gate).toBe(1.0);
    expect(mods.velocityBoost).toBe(0);
  });
});

describe('v0.4 expression syntax', () => {
  describe('per-note velocity (@)', () => {
    it('parses velocity suffix', () => {
      const note = parseNote('C4:q@0.8');
      expect(note.pitch).toBe('C4');
      expect(note.durationBeats).toBe(1);
      expect(note.velocity).toBe(0.8);
    });

    it('parses velocity of 0', () => {
      const note = parseNote('D4:h@0');
      expect(note.velocity).toBe(0);
    });

    it('parses velocity of 1', () => {
      const note = parseNote('E4:8@1');
      expect(note.velocity).toBe(1);
    });

    it('parses decimal velocities', () => {
      expect(parseNote('C4:q@0.5').velocity).toBe(0.5);
      expect(parseNote('C4:q@.7').velocity).toBe(0.7);
      expect(parseNote('C4:q@1.0').velocity).toBe(1.0);
    });

    it('throws on invalid velocity', () => {
      expect(() => parseNote('C4:q@1.5')).toThrow('Invalid velocity');
      expect(() => parseNote('C4:q@-0.5')).toThrow();
    });

    it('returns undefined when no velocity specified', () => {
      const note = parseNote('C4:q');
      expect(note.velocity).toBeUndefined();
    });
  });

  describe('probability (?)', () => {
    it('parses probability suffix', () => {
      const note = parseNote('C4:q?0.7');
      expect(note.pitch).toBe('C4');
      expect(note.probability).toBe(0.7);
    });

    it('parses probability of 0', () => {
      const note = parseNote('D4:h?0');
      expect(note.probability).toBe(0);
    });

    it('parses probability of 1', () => {
      const note = parseNote('E4:8?1');
      expect(note.probability).toBe(1);
    });

    it('throws on invalid probability', () => {
      expect(() => parseNote('C4:q?1.5')).toThrow('Invalid probability');
    });

    it('returns undefined when no probability specified', () => {
      const note = parseNote('C4:q');
      expect(note.probability).toBeUndefined();
    });
  });

  describe('timing offset (+/-ms)', () => {
    it('parses positive timing offset', () => {
      const note = parseNote('C4:q+10ms');
      expect(note.timingOffset).toBe(10);
    });

    it('parses negative timing offset', () => {
      const note = parseNote('D4:h-5ms');
      expect(note.timingOffset).toBe(-5);
    });

    it('parses zero timing offset', () => {
      const note = parseNote('E4:8+0ms');
      expect(note.timingOffset).toBe(0);
    });

    it('returns undefined when no timing specified', () => {
      const note = parseNote('C4:q');
      expect(note.timingOffset).toBeUndefined();
    });
  });

  describe('portamento (~>)', () => {
    it('parses portamento marker', () => {
      const note = parseNote('C4:q~>');
      expect(note.pitch).toBe('C4');
      expect(note.portamento).toBe(true);
    });

    it('does not confuse legato with portamento', () => {
      const legato = parseNote('C4:q~');
      expect(legato.articulation).toBe('~');
      expect(legato.portamento).toBeUndefined();

      const portamento = parseNote('C4:q~>');
      expect(portamento.articulation).toBe('');
      expect(portamento.portamento).toBe(true);
    });

    it('returns undefined when no portamento specified', () => {
      const note = parseNote('C4:q');
      expect(note.portamento).toBeUndefined();
    });
  });

  describe('combined modifiers', () => {
    it('parses velocity with articulation', () => {
      const note = parseNote('C4:q*@0.9');
      expect(note.articulation).toBe('*');
      expect(note.velocity).toBe(0.9);
    });

    it('parses velocity and probability', () => {
      const note = parseNote('D4:h@0.8?0.5');
      expect(note.velocity).toBe(0.8);
      expect(note.probability).toBe(0.5);
    });

    it('parses velocity and timing', () => {
      const note = parseNote('E4:8@0.7+15ms');
      expect(note.velocity).toBe(0.7);
      expect(note.timingOffset).toBe(15);
    });

    it('parses all modifiers together', () => {
      const note = parseNote('F#4:q.>@0.9-10ms?0.8');
      expect(note.pitch).toBe('F#4');
      expect(note.dotted).toBe(true);
      expect(note.articulation).toBe('>');
      expect(note.velocity).toBe(0.9);
      expect(note.timingOffset).toBe(-10);
      expect(note.probability).toBe(0.8);
    });

    it('parses portamento with velocity', () => {
      const note = parseNote('G4:h~>@0.6');
      expect(note.portamento).toBe(true);
      expect(note.velocity).toBe(0.6);
    });

    it('parses dotted note with all v0.4 modifiers', () => {
      const note = parseNote('A4:q.*@0.85+5ms?0.9');
      expect(note.dotted).toBe(true);
      expect(note.durationBeats).toBe(1.5);
      expect(note.articulation).toBe('*');
      expect(note.velocity).toBe(0.85);
      expect(note.timingOffset).toBe(5);
      expect(note.probability).toBe(0.9);
    });
  });
});
