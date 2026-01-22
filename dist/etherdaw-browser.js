// src/config/constants.ts
var DURATIONS = {
  w: 4,
  // whole
  h: 2,
  // half
  q: 1,
  // quarter
  "8": 0.5,
  // eighth
  "16": 0.25,
  // sixteenth
  "32": 0.125,
  // thirty-second
  // Alternative notations
  "2": 2,
  // alternative half notation
  "4": 1
  // alternative quarter notation
};
var DOTTED_MULTIPLIER = 1.5;
var MIDI = {
  MIDDLE_C: 60,
  // C4 = MIDI note 60
  SEMITONES_PER_OCTAVE: 12,
  DEFAULT_VELOCITY: 100,
  // 0-127 scale
  MAX_VELOCITY: 127,
  VELOCITY_SCALE: 127
  // Internal 0-1 to MIDI 0-127
};
var AUDIO = {
  SAMPLE_RATE: 44100,
  BIT_DEPTH: 16,
  CHANNELS: 2
  // Stereo
};
var VELOCITY_ENVELOPE = {
  MIN_VELOCITY: 0.3,
  // Floor for diminuendo
  MAX_VELOCITY: 1,
  // Ceiling for crescendo
  SWELL_PEAK: 1.2,
  // Overshoot for swell (clamped to 1.0)
  ACCENT_BOOST: 0.2,
  // Added to accented notes
  DEFAULT_VELOCITY: 0.8
  // Default track velocity
};
var ARTICULATION = {
  staccato: { gate: 0.3, velocityBoost: 0 },
  // * short note
  legato: { gate: 1.1, velocityBoost: 0 },
  // ~ slightly longer
  accent: { gate: 1, velocityBoost: 0.2 },
  // > louder
  marcato: { gate: 0.3, velocityBoost: 0.2 },
  // ^ accent + staccato
  normal: { gate: 1, velocityBoost: 0 }
  // default
};
var EFFECT_DEFAULTS = {
  reverb: {
    decay: 2,
    wet: 0.3,
    preDelay: 0.01
  },
  delay: {
    time: "8n",
    feedback: 0.3,
    wet: 0.25
  },
  filter: {
    frequency: 1e3,
    type: "lowpass",
    Q: 1
  },
  chorus: {
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.7,
    wet: 0.3
  },
  distortion: {
    distortion: 0.4,
    wet: 0.5
  },
  bitcrusher: {
    bits: 8,
    wet: 0.5
  },
  compressor: {
    threshold: -24,
    ratio: 4,
    attack: 3e-3,
    release: 0.25
  },
  eq: {
    low: 0,
    mid: 0,
    high: 0
  }
};
var ENVELOPE_PRESETS = {
  piano: { attack: 5e-3, decay: 0.2, sustain: 0.3, release: 0.8 },
  organ: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.1 },
  pad: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 },
  pluck: { attack: 1e-3, decay: 0.3, sustain: 0.1, release: 0.5 },
  bass: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.3 },
  lead: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.4 },
  bell: { attack: 1e-3, decay: 2, sustain: 0, release: 2 },
  strings: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 0.5 }
};
var DEFAULT_SETTINGS = {
  tempo: 120,
  key: "C major",
  timeSignature: "4/4",
  swing: 0
};
var HUMANIZE = {
  MAX_TIMING_VARIANCE_BEATS: 0.05,
  // 5% of beat
  MAX_VELOCITY_VARIANCE: 0.1,
  // +/-10%
  MAX_DURATION_VARIANCE: 0.05
  // +/-5%
};
var PORTAMENTO = {
  DEFAULT_TIME: 0.05,
  // 50ms glide
  MAX_TIME: 0.5
  // 500ms max
};
var ARPEGGIATOR = {
  DEFAULT_GATE: 0.8,
  // Note length ratio
  DEFAULT_OCTAVES: 1
  // Octave span
};
var DRUM_SEQUENCER = {
  DEFAULT_STEP_DURATION: "16",
  // 16th notes
  ACCENT_VELOCITY: 1,
  DEFAULT_VELOCITY: 0.8
};
var NOTE_VALUES = {
  "C": 0,
  "D": 2,
  "E": 4,
  "F": 5,
  "G": 7,
  "A": 9,
  "B": 11
};
var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var SCALE_INTERVALS = {
  "major": [0, 2, 4, 5, 7, 9, 11],
  "minor": [0, 2, 3, 5, 7, 8, 10],
  "dorian": [0, 2, 3, 5, 7, 9, 10],
  "phrygian": [0, 1, 3, 5, 7, 8, 10],
  "lydian": [0, 2, 4, 6, 7, 9, 11],
  "mixolydian": [0, 2, 4, 5, 7, 9, 10],
  "aeolian": [0, 2, 3, 5, 7, 8, 10],
  "locrian": [0, 1, 3, 5, 6, 8, 10]
};
var GROOVE_TEMPLATES = {
  straight: {
    name: "Straight",
    timingOffsets: [0, 0, 0, 0],
    velocityMultipliers: [1, 0.8, 0.9, 0.8]
  },
  shuffle: {
    name: "Shuffle",
    timingOffsets: [0, 0.08, 0, 0.08],
    velocityMultipliers: [1, 0.7, 0.9, 0.7]
  },
  funk: {
    name: "Funk",
    timingOffsets: [0, -0.02, 0.02, -0.01],
    velocityMultipliers: [1, 0.9, 0.85, 0.95]
  },
  laid_back: {
    name: "Laid Back",
    timingOffsets: [0.03, 0.03, 0.03, 0.03],
    velocityMultipliers: [1, 0.85, 0.9, 0.85]
  },
  pushed: {
    name: "Pushed",
    timingOffsets: [-0.02, -0.02, -0.02, -0.02],
    velocityMultipliers: [1, 0.9, 0.95, 0.9]
  },
  hip_hop: {
    name: "Hip Hop",
    timingOffsets: [0, 0.05, 0, 0.07],
    velocityMultipliers: [1, 0.75, 0.9, 0.8]
  }
};

// src/schema/types.ts
var DURATION_MAP = DURATIONS;

// src/parser/note-parser.ts
var NOTE_REGEX = /^([A-Ga-g])([#b]?)(-?\d)?:(\d+|[whq])(\.?)(?:([*>^])|(~>)|(~))?(?:@((?:0|1)?\.?\d+))?(?:([+-]\d+)ms)?(?:\?((?:0|1)?\.?\d+))?$/;
var REST_REGEX = /^r:(\d+|[whq])(\.?)$/;
function parseNote(noteStr) {
  const match = noteStr.trim().match(NOTE_REGEX);
  if (!match) {
    throw new Error(`Invalid note format: "${noteStr}". Expected format: {pitch}{octave}:{duration}[articulation][@velocity][+/-timing][?probability] (e.g., "C4:q", "C4:q*", "C4:q@0.8")`);
  }
  const [
    ,
    noteNameRaw,
    // 1: Note name
    accidentalRaw,
    // 2: Accidental
    octaveStr,
    // 3: Octave
    durationCode,
    // 4: Duration
    dotted,
    // 5: Dot
    articulationRaw,
    // 6: Articulation (*>^)
    portamentoRaw,
    // 7: Portamento (~>)
    legatoRaw,
    // 8: Legato (~)
    velocityRaw,
    // 9: Velocity
    timingRaw,
    // 10: Timing offset
    probabilityRaw
    // 11: Probability
  ] = match;
  const noteName = noteNameRaw.toUpperCase();
  const accidental = accidentalRaw || "";
  const octave = octaveStr ? parseInt(octaveStr, 10) : 4;
  const isDotted = dotted === ".";
  let articulation = "";
  if (articulationRaw) {
    articulation = articulationRaw;
  } else if (legatoRaw) {
    articulation = "~";
  }
  const portamento = portamentoRaw === "~>";
  const velocity = velocityRaw ? parseFloat(velocityRaw) : void 0;
  const timingOffset = timingRaw ? parseInt(timingRaw, 10) : void 0;
  const probability = probabilityRaw ? parseFloat(probabilityRaw) : void 0;
  if (velocity !== void 0 && (velocity < 0 || velocity > 1)) {
    throw new Error(`Invalid velocity ${velocity} in "${noteStr}". Must be 0.0-1.0`);
  }
  if (probability !== void 0 && (probability < 0 || probability > 1)) {
    throw new Error(`Invalid probability ${probability} in "${noteStr}". Must be 0.0-1.0`);
  }
  const baseDuration = DURATION_MAP[durationCode];
  if (baseDuration === void 0) {
    throw new Error(`Invalid duration code: "${durationCode}"`);
  }
  const durationBeats = isDotted ? baseDuration * DOTTED_MULTIPLIER : baseDuration;
  const pitch = `${noteName}${accidental}${octave}`;
  const result = {
    pitch,
    noteName,
    accidental,
    octave,
    duration: durationCode,
    durationBeats,
    dotted: isDotted,
    articulation
  };
  if (velocity !== void 0) result.velocity = velocity;
  if (probability !== void 0) result.probability = probability;
  if (timingOffset !== void 0) result.timingOffset = timingOffset;
  if (portamento) result.portamento = true;
  return result;
}
function getArticulationModifiers(articulation) {
  switch (articulation) {
    case "*":
      return { ...ARTICULATION.staccato };
    case "~":
      return { ...ARTICULATION.legato };
    case ">":
      return { ...ARTICULATION.accent };
    case "^":
      return { ...ARTICULATION.marcato };
    default:
      return { ...ARTICULATION.normal };
  }
}
function parseRest(restStr) {
  const match = restStr.trim().match(REST_REGEX);
  if (!match) {
    throw new Error(`Invalid rest format: "${restStr}". Expected format: r:{duration} (e.g., "r:q", "r:h")`);
  }
  const [, durationCode, dotted] = match;
  const baseDuration = DURATION_MAP[durationCode];
  if (baseDuration === void 0) {
    throw new Error(`Invalid duration code: "${durationCode}"`);
  }
  return dotted === "." ? baseDuration * DOTTED_MULTIPLIER : baseDuration;
}
function isRest(str) {
  return str.trim().startsWith("r:");
}
function parseDuration(durationStr, dotted = false) {
  const baseDuration = DURATION_MAP[durationStr];
  if (baseDuration === void 0) {
    throw new Error(`Invalid duration: "${durationStr}". Valid durations: ${Object.keys(DURATION_MAP).join(", ")}`);
  }
  return dotted ? baseDuration * DOTTED_MULTIPLIER : baseDuration;
}
function beatsToSeconds(beats, tempo) {
  return beats / tempo * 60;
}
function pitchToMidi(pitch) {
  const match = pitch.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) {
    throw new Error(`Invalid pitch: "${pitch}"`);
  }
  const [, noteName, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  let noteValue = NOTE_VALUES[noteName];
  if (accidental === "#") noteValue += 1;
  if (accidental === "b") noteValue -= 1;
  return (octave + 1) * MIDI.SEMITONES_PER_OCTAVE + noteValue;
}
function midiToPitch(midi) {
  const octave = Math.floor(midi / MIDI.SEMITONES_PER_OCTAVE) - 1;
  const noteIndex = midi % MIDI.SEMITONES_PER_OCTAVE;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}
function transposePitch(pitch, semitones) {
  const midi = pitchToMidi(pitch);
  return midiToPitch(midi + semitones);
}
function parseNotes(noteStrings) {
  return noteStrings.map(parseNote);
}

// src/parser/chord-parser.ts
var CHORD_REGEX = /^([A-G][#b]?)((?:maj|min|m|M|dim|aug|sus[24]?|add)?(?:\d+)?(?:b\d+|#\d+)*)(?:\/([A-G][#b]?))?:(\d+|[whq])(\.?)([*~>^]?)$/;
var CHORD_INTERVALS = {
  // Triads
  "": [0, 4, 7],
  // major (default)
  "maj": [0, 4, 7],
  // major
  "M": [0, 4, 7],
  // major
  "m": [0, 3, 7],
  // minor
  "min": [0, 3, 7],
  // minor
  "dim": [0, 3, 6],
  // diminished
  "aug": [0, 4, 8],
  // augmented
  "sus2": [0, 2, 7],
  // suspended 2nd
  "sus4": [0, 5, 7],
  // suspended 4th
  "sus": [0, 5, 7],
  // suspended 4th (default)
  // Seventh chords
  "7": [0, 4, 7, 10],
  // dominant 7th
  "maj7": [0, 4, 7, 11],
  // major 7th
  "M7": [0, 4, 7, 11],
  // major 7th
  "m7": [0, 3, 7, 10],
  // minor 7th
  "min7": [0, 3, 7, 10],
  // minor 7th
  "dim7": [0, 3, 6, 9],
  // diminished 7th
  "m7b5": [0, 3, 6, 10],
  // half-diminished 7th
  "aug7": [0, 4, 8, 10],
  // augmented 7th
  // Extended chords
  "9": [0, 4, 7, 10, 14],
  // dominant 9th
  "maj9": [0, 4, 7, 11, 14],
  // major 9th
  "m9": [0, 3, 7, 10, 14],
  // minor 9th
  "11": [0, 4, 7, 10, 14, 17],
  // dominant 11th
  "13": [0, 4, 7, 10, 14, 21],
  // dominant 13th
  // Add chords
  "add9": [0, 4, 7, 14],
  // add 9
  "add11": [0, 4, 7, 17],
  // add 11
  "6": [0, 4, 7, 9],
  // major 6th
  "m6": [0, 3, 7, 9]
  // minor 6th
};
function getChordIntervals(quality) {
  if (CHORD_INTERVALS[quality]) {
    return [...CHORD_INTERVALS[quality]];
  }
  let baseQuality = quality;
  const alterations = [];
  const altRegex = /([b#])(\d+)/g;
  let altMatch;
  while ((altMatch = altRegex.exec(quality)) !== null) {
    const [full, accidental, degree] = altMatch;
    baseQuality = baseQuality.replace(full, "");
    alterations.push({
      degree: parseInt(degree, 10),
      delta: accidental === "#" ? 1 : -1
    });
  }
  const intervals = CHORD_INTERVALS[baseQuality] || CHORD_INTERVALS[""];
  const result = [...intervals];
  for (const alt of alterations) {
    const degreeToSemitone = {
      5: 7,
      9: 14,
      11: 17,
      13: 21
    };
    const baseSemitone = degreeToSemitone[alt.degree];
    if (baseSemitone !== void 0) {
      const index = result.indexOf(baseSemitone);
      if (index >= 0) {
        result[index] += alt.delta;
      } else {
        result.push(baseSemitone + alt.delta);
      }
    }
  }
  return result.sort((a, b) => a - b);
}
function parseChord(chordStr, defaultOctave = 3) {
  const match = chordStr.trim().match(CHORD_REGEX);
  if (!match) {
    throw new Error(`Invalid chord format: "${chordStr}". Expected format: {root}{quality}:{duration}[articulation] (e.g., "Cmaj7:w", "Dm:h", "Am7:q*")`);
  }
  const [, root, quality, bass, durationCode, dotted, articulationRaw] = match;
  const isDotted = dotted === ".";
  const articulation = articulationRaw || "";
  const baseDuration = DURATION_MAP[durationCode];
  if (baseDuration === void 0) {
    throw new Error(`Invalid duration code: "${durationCode}"`);
  }
  const durationBeats = isDotted ? baseDuration * 1.5 : baseDuration;
  const intervals = getChordIntervals(quality || "");
  const rootPitch = `${root}${defaultOctave}`;
  const rootMidi = pitchToMidi(rootPitch);
  const notes = intervals.map((interval) => midiToPitch(rootMidi + interval));
  if (bass) {
    const bassPitch = `${bass}${defaultOctave - 1}`;
    notes.unshift(bassPitch);
  }
  return {
    root,
    quality: quality || "maj",
    bass,
    duration: durationCode,
    durationBeats,
    notes,
    articulation
  };
}
function parseChords(chordStrings, defaultOctave = 3) {
  return chordStrings.map((str) => parseChord(str, defaultOctave));
}
function getChordNotes(chordSymbol, octave = 3) {
  const parsed = parseChord(`${chordSymbol}:q`, octave);
  return parsed.notes;
}
function getSupportedChordQualities() {
  return Object.keys(CHORD_INTERVALS);
}

// src/theory/euclidean.ts
function euclidean(hits, steps) {
  if (hits === 0) return new Array(steps).fill(false);
  if (hits >= steps) return new Array(steps).fill(true);
  let pattern = [];
  for (let i = 0; i < hits; i++) {
    pattern.push([1]);
  }
  for (let i = 0; i < steps - hits; i++) {
    pattern.push([0]);
  }
  function distributeRemainders(groups) {
    const numGroups = groups.length;
    let onesCount = 0;
    let zerosCount = 0;
    for (const group of groups) {
      if (group[0] === 1) onesCount++;
      else zerosCount++;
    }
    if (zerosCount <= 1 || onesCount <= 1) {
      return groups;
    }
    const newGroups = [];
    const minCount = Math.min(onesCount, zerosCount);
    for (let i = 0; i < minCount; i++) {
      const oneIdx = groups.findIndex((g) => g[0] === 1);
      const zeroIdx = groups.findIndex((g) => g[0] === 0);
      if (oneIdx !== -1 && zeroIdx !== -1) {
        newGroups.push([...groups[oneIdx], ...groups[zeroIdx]]);
        groups.splice(Math.max(oneIdx, zeroIdx), 1);
        groups.splice(Math.min(oneIdx, zeroIdx), 1);
      }
    }
    newGroups.push(...groups);
    return distributeRemainders(newGroups);
  }
  pattern = distributeRemainders(pattern);
  const result = [];
  for (const group of pattern) {
    for (const val of group) {
      result.push(val === 1);
    }
  }
  return result;
}
function rotatePattern(pattern, rotation) {
  if (pattern.length === 0 || rotation === 0) return [...pattern];
  const normalizedRotation = (rotation % pattern.length + pattern.length) % pattern.length;
  return [
    ...pattern.slice(pattern.length - normalizedRotation),
    ...pattern.slice(0, pattern.length - normalizedRotation)
  ];
}
function generateEuclidean(hits, steps, rotation = 0) {
  const base = euclidean(hits, steps);
  return rotatePattern(base, rotation);
}
function patternToSteps(pattern) {
  const steps = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i]) steps.push(i);
  }
  return steps;
}

// src/theory/scales.ts
var SCALE_INTERVALS2 = {
  // Diatonic modes
  "major": [0, 2, 4, 5, 7, 9, 11],
  "ionian": [0, 2, 4, 5, 7, 9, 11],
  "dorian": [0, 2, 3, 5, 7, 9, 10],
  "phrygian": [0, 1, 3, 5, 7, 8, 10],
  "lydian": [0, 2, 4, 6, 7, 9, 11],
  "mixolydian": [0, 2, 4, 5, 7, 9, 10],
  "minor": [0, 2, 3, 5, 7, 8, 10],
  "aeolian": [0, 2, 3, 5, 7, 8, 10],
  "locrian": [0, 1, 3, 5, 6, 8, 10],
  // Harmonic and melodic minor
  "harmonic_minor": [0, 2, 3, 5, 7, 8, 11],
  "melodic_minor": [0, 2, 3, 5, 7, 9, 11],
  // Pentatonic scales
  "pentatonic_major": [0, 2, 4, 7, 9],
  "pentatonic_minor": [0, 3, 5, 7, 10],
  // Blues scales
  "blues": [0, 3, 5, 6, 7, 10],
  "blues_major": [0, 2, 3, 4, 7, 9],
  // Other common scales
  "whole_tone": [0, 2, 4, 6, 8, 10],
  "diminished": [0, 2, 3, 5, 6, 8, 9, 11],
  "diminished_half_whole": [0, 1, 3, 4, 6, 7, 9, 10],
  "chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  // Jazz scales
  "bebop_dominant": [0, 2, 4, 5, 7, 9, 10, 11],
  "bebop_major": [0, 2, 4, 5, 7, 8, 9, 11],
  "altered": [0, 1, 3, 4, 6, 8, 10]
};
var SCALE_ALIASES = {
  "nat_minor": "minor",
  "natural_minor": "minor",
  "min": "minor",
  "maj": "major",
  "pent": "pentatonic_major",
  "pent_major": "pentatonic_major",
  "pent_minor": "pentatonic_minor",
  "harm_minor": "harmonic_minor",
  "mel_minor": "melodic_minor"
};
function getScaleIntervals(scaleName) {
  const normalized = scaleName.toLowerCase().replace(/\s+/g, "_");
  const name = SCALE_ALIASES[normalized] || normalized;
  const intervals = SCALE_INTERVALS2[name];
  if (!intervals) {
    throw new Error(`Unknown scale: "${scaleName}". Available scales: ${Object.keys(SCALE_INTERVALS2).join(", ")}`);
  }
  return [...intervals];
}
function getScaleNotes(root, scaleName, octave = 4) {
  const intervals = getScaleIntervals(scaleName);
  const rootPitch = `${root}${octave}`;
  const rootMidi = pitchToMidi(rootPitch);
  return intervals.map((interval) => midiToPitch(rootMidi + interval));
}
function getScaleDegree(root, scaleName, degree, octave = 4) {
  const intervals = getScaleIntervals(scaleName);
  const scaleLength = intervals.length;
  const octaveOffset = Math.floor((degree - 1) / scaleLength);
  const normalizedDegree = (degree - 1) % scaleLength;
  const interval = intervals[normalizedDegree];
  const rootPitch = `${root}${octave}`;
  const rootMidi = pitchToMidi(rootPitch);
  return midiToPitch(rootMidi + interval + octaveOffset * 12);
}
function isNoteInScale(note, root, scaleName) {
  const noteMidi = pitchToMidi(note) % 12;
  const rootMidi = pitchToMidi(`${root}4`) % 12;
  const intervals = getScaleIntervals(scaleName);
  const relativeInterval = (noteMidi - rootMidi + 12) % 12;
  return intervals.includes(relativeInterval);
}
function snapToScale(note, root, scaleName) {
  const noteMidi = pitchToMidi(note);
  const noteClass = noteMidi % 12;
  const octave = Math.floor(noteMidi / 12);
  const rootMidi = pitchToMidi(`${root}4`) % 12;
  const intervals = getScaleIntervals(scaleName);
  let minDistance = Infinity;
  let closestInterval = 0;
  for (const interval of intervals) {
    const scaleNoteClass = (rootMidi + interval) % 12;
    const distance = Math.min(
      Math.abs(noteClass - scaleNoteClass),
      12 - Math.abs(noteClass - scaleNoteClass)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestInterval = interval;
    }
  }
  const targetNoteClass = (rootMidi + closestInterval) % 12;
  return midiToPitch(octave * 12 + targetNoteClass);
}
function getRelativeKey(root, mode) {
  const rootMidi = pitchToMidi(`${root}4`) % 12;
  if (mode === "minor") {
    const majorRoot = midiToPitch(48 + (rootMidi + 3) % 12);
    return { root: majorRoot.replace(/\d+$/, ""), mode: "major" };
  } else {
    const minorRoot = midiToPitch(48 + (rootMidi - 3 + 12) % 12);
    return { root: minorRoot.replace(/\d+$/, ""), mode: "minor" };
  }
}
function getParallelKey(root, mode) {
  return { root, mode: mode === "major" ? "minor" : "major" };
}
function parseKey(keyString) {
  const match = keyString.match(/^([A-G][#b]?)\s*(.*)$/i);
  if (!match) {
    throw new Error(`Invalid key: "${keyString}"`);
  }
  const [, root, modeRaw] = match;
  const mode = modeRaw.trim().toLowerCase() || "major";
  const modeNormalized = SCALE_ALIASES[mode] || mode;
  return { root, mode: modeNormalized };
}
function getAvailableScales() {
  return Object.keys(SCALE_INTERVALS2);
}

// src/theory/transformations.ts
var BEATS_TO_DURATION = {
  4: "w",
  2: "h",
  1: "q",
  0.5: "8",
  0.25: "16",
  0.125: "32"
};
function beatsToDuration(beats) {
  if (BEATS_TO_DURATION[beats]) {
    return BEATS_TO_DURATION[beats];
  }
  const undottedBeats = beats / 1.5;
  if (BEATS_TO_DURATION[undottedBeats]) {
    return BEATS_TO_DURATION[undottedBeats] + ".";
  }
  const sortedBeats = Object.keys(BEATS_TO_DURATION).map(Number).sort((a, b) => b - a);
  for (const dur of sortedBeats) {
    if (beats >= dur) {
      return BEATS_TO_DURATION[dur];
    }
  }
  return "32";
}
function parseNoteComponents(noteStr) {
  const trimmed = noteStr.trim();
  if (trimmed.startsWith("r:")) {
    const durationPart2 = trimmed.slice(2);
    const dotted2 = durationPart2.endsWith(".");
    const duration2 = dotted2 ? durationPart2.slice(0, -1) : durationPart2;
    return { pitch: null, duration: duration2, dotted: dotted2, isRest: true };
  }
  const colonIndex = trimmed.lastIndexOf(":");
  if (colonIndex === -1) {
    throw new Error(`Invalid note format: "${noteStr}"`);
  }
  const pitch = trimmed.slice(0, colonIndex);
  const durationPart = trimmed.slice(colonIndex + 1);
  const dotted = durationPart.endsWith(".");
  const duration = dotted ? durationPart.slice(0, -1) : durationPart;
  return { pitch, duration, dotted, isRest: false };
}
function reconstructNote(pitch, duration, dotted, isRest3) {
  const durationStr = dotted ? duration + "." : duration;
  if (isRest3) {
    return `r:${durationStr}`;
  }
  return `${pitch}:${durationStr}`;
}
function invertPattern(pattern, axisPitch) {
  let axis;
  if (axisPitch) {
    axis = pitchToMidi(axisPitch);
  } else {
    const firstNote = pattern.find((n) => !n.startsWith("r:"));
    if (!firstNote) {
      return [...pattern];
    }
    const { pitch } = parseNoteComponents(firstNote);
    axis = pitchToMidi(pitch);
  }
  return pattern.map((noteStr) => {
    const { pitch, duration, dotted, isRest: isRestNote } = parseNoteComponents(noteStr);
    if (isRestNote) {
      return noteStr;
    }
    const midi = pitchToMidi(pitch);
    const interval = midi - axis;
    const invertedMidi = axis - interval;
    const invertedPitch = midiToPitch(invertedMidi);
    return reconstructNote(invertedPitch, duration, dotted, false);
  });
}
function retrogradePattern(pattern) {
  return [...pattern].reverse();
}
function augmentPattern(pattern, factor) {
  return pattern.map((noteStr) => {
    const { pitch, duration, dotted, isRest: isRestNote } = parseNoteComponents(noteStr);
    const baseDuration = DURATION_MAP[duration];
    if (baseDuration === void 0) {
      throw new Error(`Unknown duration: "${duration}"`);
    }
    const originalBeats = dotted ? baseDuration * 1.5 : baseDuration;
    const newBeats = originalBeats * factor;
    const newDuration = beatsToDuration(newBeats);
    const isDotted = newDuration.endsWith(".");
    const cleanDuration = isDotted ? newDuration.slice(0, -1) : newDuration;
    return reconstructNote(pitch, cleanDuration, isDotted, isRestNote);
  });
}
function transposePattern(pattern, semitones) {
  return pattern.map((noteStr) => {
    const { pitch, duration, dotted, isRest: isRestNote } = parseNoteComponents(noteStr);
    if (isRestNote) {
      return noteStr;
    }
    const midi = pitchToMidi(pitch);
    const transposedMidi = midi + semitones;
    const transposedPitch = midiToPitch(transposedMidi);
    return reconstructNote(transposedPitch, duration, dotted, false);
  });
}
function shiftOctave(pattern, octaves) {
  return transposePattern(pattern, octaves * 12);
}

// src/parser/pattern-expander.ts
function generateVelocityPreset(preset, noteCount, baseVelocity) {
  if (noteCount === 0) return [];
  if (noteCount === 1) return [baseVelocity];
  const velocities = [];
  const minVel = Math.max(0.1, baseVelocity * VELOCITY_ENVELOPE.MIN_VELOCITY);
  const maxVel = Math.min(VELOCITY_ENVELOPE.MAX_VELOCITY, baseVelocity * VELOCITY_ENVELOPE.SWELL_PEAK);
  switch (preset) {
    case "crescendo":
      for (let i = 0; i < noteCount; i++) {
        const t = i / (noteCount - 1);
        velocities.push(minVel + t * (maxVel - minVel));
      }
      break;
    case "diminuendo":
      for (let i = 0; i < noteCount; i++) {
        const t = i / (noteCount - 1);
        velocities.push(maxVel - t * (maxVel - minVel));
      }
      break;
    case "swell":
      for (let i = 0; i < noteCount; i++) {
        const t = i / (noteCount - 1);
        const factor = Math.sin(t * Math.PI);
        velocities.push(minVel + factor * (maxVel - minVel));
      }
      break;
    case "accent_first":
      for (let i = 0; i < noteCount; i++) {
        velocities.push(i === 0 ? maxVel : baseVelocity);
      }
      break;
    case "accent_downbeats":
      for (let i = 0; i < noteCount; i++) {
        velocities.push(i % 2 === 0 ? maxVel : baseVelocity * 0.7);
      }
      break;
    default:
      for (let i = 0; i < noteCount; i++) {
        velocities.push(baseVelocity);
      }
  }
  return velocities;
}
function applyVelocityEnvelope(notes, envelope, baseVelocity) {
  if (notes.length === 0) return;
  let velocities;
  if (typeof envelope.velocity === "string") {
    velocities = generateVelocityPreset(envelope.velocity, notes.length, baseVelocity);
  } else {
    const customVels = envelope.velocity;
    if (customVels.length === 0) return;
    velocities = [];
    for (let i = 0; i < notes.length; i++) {
      const t = notes.length === 1 ? 0 : i / (notes.length - 1);
      const arrayPos = t * (customVels.length - 1);
      const lowerIdx = Math.floor(arrayPos);
      const upperIdx = Math.min(lowerIdx + 1, customVels.length - 1);
      const frac = arrayPos - lowerIdx;
      const interpolated = customVels[lowerIdx] * (1 - frac) + customVels[upperIdx] * frac;
      velocities.push(Math.max(0, Math.min(1, interpolated)));
    }
  }
  for (let i = 0; i < notes.length; i++) {
    notes[i].velocity = velocities[i];
  }
}
function applyTransform(sourceNotes, transform) {
  const { operation, params } = transform;
  switch (operation) {
    case "invert":
      return invertPattern(sourceNotes, params?.axis);
    case "retrograde":
      return retrogradePattern(sourceNotes);
    case "augment":
      return augmentPattern(sourceNotes, params?.factor ?? 2);
    case "diminish":
      return augmentPattern(sourceNotes, params?.factor ?? 0.5);
    case "transpose":
      return transposePattern(sourceNotes, params?.semitones ?? 0);
    case "octave":
      return shiftOctave(sourceNotes, params?.octaves ?? 1);
    default:
      return sourceNotes;
  }
}
function resolvePattern(pattern, allPatterns) {
  if (!pattern.transform || !allPatterns) {
    return pattern;
  }
  const { source, operation, params } = pattern.transform;
  const sourcePattern = allPatterns[source];
  if (!sourcePattern) {
    console.warn(`Transform source pattern "${source}" not found`);
    return pattern;
  }
  const resolvedSource = resolvePattern(sourcePattern, allPatterns);
  if (resolvedSource.notes) {
    const transformedNotes = applyTransform(resolvedSource.notes, pattern.transform);
    return {
      ...pattern,
      notes: transformedNotes,
      transform: void 0
      // Remove transform since it's been applied
    };
  }
  console.warn(`Transform on pattern with no notes array - transforms only work on notes`);
  return pattern;
}
function expandPattern(pattern, context) {
  const velocity = context.velocity ?? VELOCITY_ENVELOPE.DEFAULT_VELOCITY;
  const octaveOffset = context.octaveOffset ?? 0;
  const transpose = context.transpose ?? 0;
  const resolvedPattern = pattern.transform ? resolvePattern(pattern, context.allPatterns) : pattern;
  let notes = [];
  let currentBeat = 0;
  if (resolvedPattern.notes) {
    for (const noteStr of resolvedPattern.notes) {
      if (isRest(noteStr)) {
        currentBeat += parseRest(noteStr);
      } else {
        const parsed = parseNote(noteStr);
        const adjustedOctave = parsed.octave + octaveOffset;
        const adjustedPitch = applyTranspose(`${parsed.noteName}${parsed.accidental}${adjustedOctave}`, transpose);
        const articulationMods = getArticulationModifiers(parsed.articulation);
        const baseVel = parsed.velocity !== void 0 ? parsed.velocity : velocity;
        const noteVelocity = Math.min(1, baseVel + articulationMods.velocityBoost);
        const noteDuration = parsed.durationBeats * articulationMods.gate;
        const noteData = {
          pitch: adjustedPitch,
          startBeat: currentBeat,
          durationBeats: noteDuration,
          velocity: noteVelocity
        };
        if (parsed.timingOffset !== void 0) noteData.timingOffset = parsed.timingOffset;
        if (parsed.probability !== void 0) noteData.probability = parsed.probability;
        if (parsed.portamento) noteData.portamento = true;
        notes.push(noteData);
        currentBeat += parsed.durationBeats;
      }
    }
  }
  if (resolvedPattern.chords) {
    for (const chordStr of resolvedPattern.chords) {
      const parsed = parseChord(chordStr);
      const articulationMods = getArticulationModifiers(parsed.articulation);
      const chordVelocity = Math.min(1, velocity + articulationMods.velocityBoost);
      const chordDuration = parsed.durationBeats * articulationMods.gate;
      for (const pitch of parsed.notes) {
        const adjustedPitch = applyTranspose(adjustOctave(pitch, octaveOffset), transpose);
        notes.push({
          pitch: adjustedPitch,
          startBeat: currentBeat,
          durationBeats: chordDuration,
          velocity: chordVelocity
        });
      }
      currentBeat += parsed.durationBeats;
    }
  }
  if (resolvedPattern.degrees && context.key) {
    const rhythm = resolvedPattern.rhythm || ["q"];
    let rhythmIndex = 0;
    for (const degree of resolvedPattern.degrees) {
      const parsed = parseEnhancedDegree(degree);
      const durationStr = parsed.duration || rhythm[rhythmIndex % rhythm.length];
      const durationBeats = parseDurationString(durationStr);
      if (typeof degree === "number" || !isRest(`r:${degree}`)) {
        const pitch = scaleDegreeToNote(degree, context.key, 4 + octaveOffset);
        const adjustedPitch = applyTranspose(pitch, transpose);
        notes.push({
          pitch: adjustedPitch,
          startBeat: currentBeat,
          durationBeats,
          velocity
        });
      }
      currentBeat += durationBeats;
      if (!parsed.duration) {
        rhythmIndex++;
      }
    }
  }
  if (resolvedPattern.arpeggio) {
    const expanded = expandArpeggio(resolvedPattern.arpeggio, octaveOffset, transpose, velocity);
    for (const note of expanded.notes) {
      notes.push({
        ...note,
        startBeat: currentBeat + note.startBeat
      });
    }
    currentBeat += expanded.totalBeats;
  }
  if (resolvedPattern.drums) {
    const expanded = expandDrumPattern(resolvedPattern.drums, velocity);
    for (const note of expanded.notes) {
      notes.push({
        ...note,
        startBeat: currentBeat + note.startBeat
      });
    }
    currentBeat += expanded.totalBeats;
  }
  if (resolvedPattern.euclidean) {
    const expanded = expandEuclidean(resolvedPattern.euclidean, octaveOffset, transpose, velocity);
    for (const note of expanded.notes) {
      notes.push({
        ...note,
        startBeat: currentBeat + note.startBeat
      });
    }
    currentBeat += expanded.totalBeats;
  }
  if (resolvedPattern.rest) {
    currentBeat += parseRest(resolvedPattern.rest);
  }
  if (resolvedPattern.envelope) {
    applyVelocityEnvelope(notes, resolvedPattern.envelope, velocity);
  }
  if (resolvedPattern.constrainToScale && context.key) {
    const { root, mode } = parseKey(context.key);
    notes = notes.map((note) => {
      if (note.pitch.startsWith("drum:")) {
        return note;
      }
      return {
        ...note,
        pitch: snapToScale(note.pitch, root, mode)
      };
    });
  }
  return {
    notes,
    totalBeats: currentBeat
  };
}
function parseDurationString(str) {
  const isDotted = str.endsWith(".");
  const code = isDotted ? str.slice(0, -1) : str;
  const base = DURATIONS[code];
  if (base === void 0) {
    throw new Error(`Invalid duration: ${str}`);
  }
  return isDotted ? base * DOTTED_MULTIPLIER : base;
}
function parseEnhancedDegree(degree) {
  if (typeof degree === "number") {
    return { degreeNum: degree, accidentalOffset: 0, octaveShift: 0 };
  }
  const match = degree.match(/^(\d+)([#b]?)([+-]?)(?::(\d+|[whq])(\.?))?$/);
  if (!match) {
    const legacyMatch = degree.match(/^([#b]?)(\d+)$/);
    if (legacyMatch) {
      return {
        degreeNum: parseInt(legacyMatch[2], 10),
        accidentalOffset: legacyMatch[1] === "#" ? 1 : legacyMatch[1] === "b" ? -1 : 0,
        octaveShift: 0
      };
    }
    throw new Error(`Invalid degree: ${degree}`);
  }
  const [, degNum, accidental, octaveMod, durCode, dotted] = match;
  return {
    degreeNum: parseInt(degNum, 10),
    accidentalOffset: accidental === "#" ? 1 : accidental === "b" ? -1 : 0,
    octaveShift: octaveMod === "+" ? 1 : octaveMod === "-" ? -1 : 0,
    duration: durCode ? durCode + (dotted || "") : void 0
  };
}
function scaleDegreeToNote(degree, key, octave) {
  const keyMatch = key.match(/^([A-G][#b]?)\s*(major|minor|maj|min|m|M|dorian|phrygian|lydian|mixolydian|aeolian|locrian)?$/i);
  if (!keyMatch) {
    throw new Error(`Invalid key: ${key}`);
  }
  const [, root, mode] = keyMatch;
  const normalizedMode = normalizeMode(mode || "major");
  const intervals = SCALE_INTERVALS[normalizedMode] || SCALE_INTERVALS["major"];
  const parsed = parseEnhancedDegree(degree);
  const { degreeNum, accidentalOffset, octaveShift } = parsed;
  const octaveAdd = Math.floor((degreeNum - 1) / 7);
  const normalizedDegree = (degreeNum - 1) % 7 + 1;
  const interval = intervals[normalizedDegree - 1] + accidentalOffset;
  const rootMidi = noteNameToMidi(root, octave);
  const noteMidi = rootMidi + interval + octaveAdd * 12 + octaveShift * 12;
  return midiToPitchName(noteMidi);
}
function normalizeMode(mode) {
  const modeMap = {
    "major": "major",
    "maj": "major",
    "M": "major",
    "minor": "minor",
    "min": "minor",
    "m": "minor",
    "dorian": "dorian",
    "phrygian": "phrygian",
    "lydian": "lydian",
    "mixolydian": "mixolydian",
    "aeolian": "aeolian",
    "locrian": "locrian"
  };
  return modeMap[mode.toLowerCase()] || "major";
}
function noteNameToMidi(noteName, octave) {
  const match = noteName.match(/^([A-G])([#b]?)$/);
  if (!match) throw new Error(`Invalid note name: ${noteName}`);
  const [, note, accidental] = match;
  let value = NOTE_VALUES[note];
  if (accidental === "#") value += 1;
  if (accidental === "b") value -= 1;
  return (octave + 1) * MIDI.SEMITONES_PER_OCTAVE + value;
}
function midiToPitchName(midi) {
  const octave = Math.floor(midi / MIDI.SEMITONES_PER_OCTAVE) - 1;
  const noteIndex = midi % MIDI.SEMITONES_PER_OCTAVE;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}
function adjustOctave(pitch, octaveOffset) {
  const match = pitch.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return pitch;
  const [, note, oct] = match;
  return `${note}${parseInt(oct, 10) + octaveOffset}`;
}
function adjustOctaveByMidi(pitch, octaves) {
  const match = pitch.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return pitch;
  const [, note, oct] = match;
  return `${note}${parseInt(oct, 10) + octaves}`;
}
function applyTranspose(pitch, semitones) {
  if (semitones === 0) return pitch;
  const match = pitch.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return pitch;
  const midi = noteNameToMidi(match[1], parseInt(match[2], 10));
  return midiToPitchName(midi + semitones);
}
function generateArpPattern(chordNotes, mode, octaves, steps) {
  const numNotes = chordNotes.length;
  const totalNotes = numNotes * octaves;
  const indices = [];
  for (let oct = 0; oct < octaves; oct++) {
    for (let i = 0; i < numNotes; i++) {
      indices.push(oct * numNotes + i + 1);
    }
  }
  let pattern = [];
  switch (mode) {
    case "up":
      pattern = [...indices];
      break;
    case "down":
      pattern = [...indices].reverse();
      break;
    case "updown":
      pattern = [...indices, ...indices.slice(1, -1).reverse()];
      break;
    case "downup":
      pattern = [...indices.reverse(), ...indices.slice(1, -1).reverse()];
      break;
    case "random":
      const len = steps || totalNotes;
      for (let i = 0; i < len; i++) {
        pattern.push(indices[Math.floor(Math.random() * indices.length)]);
      }
      break;
  }
  if (steps && mode !== "random") {
    const result = [];
    for (let i = 0; i < steps; i++) {
      result.push(pattern[i % pattern.length]);
    }
    return result;
  }
  return pattern;
}
function expandArpeggio(arpeggio, octaveOffset, transpose, velocity) {
  const { chord, duration, mode, octaves = ARPEGGIATOR.DEFAULT_OCTAVES, gate = ARPEGGIATOR.DEFAULT_GATE, steps } = arpeggio;
  const chordNotes = getChordNotes(chord, 3 + octaveOffset);
  const durationBeats = parseDurationString(duration);
  let arpPattern;
  if (arpeggio.pattern) {
    arpPattern = arpeggio.pattern;
  } else if (mode) {
    arpPattern = generateArpPattern(chordNotes, mode, octaves, steps);
  } else {
    arpPattern = chordNotes.map((_, i) => i + 1);
  }
  const notes = [];
  let currentBeat = 0;
  for (const noteIndex of arpPattern) {
    const octaveAdd = Math.floor((noteIndex - 1) / chordNotes.length) * 12;
    const noteIdx = (noteIndex - 1) % chordNotes.length;
    const basePitch = chordNotes[noteIdx];
    const adjustedPitch = applyTranspose(adjustOctaveByMidi(basePitch, octaveAdd / 12), transpose);
    notes.push({
      pitch: adjustedPitch,
      startBeat: currentBeat,
      durationBeats: durationBeats * gate,
      velocity
    });
    currentBeat += durationBeats;
  }
  return {
    notes,
    totalBeats: currentBeat
  };
}
function parseDrumTime(timeStr) {
  const DRUM_DURATION_MAP = {
    ...DURATIONS,
    "0": 0
  };
  const parts = timeStr.split("+");
  let total = 0;
  for (const part of parts) {
    const trimmed = part.trim();
    if (DRUM_DURATION_MAP[trimmed] !== void 0) {
      total += DRUM_DURATION_MAP[trimmed];
    } else {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        total += num;
      }
    }
  }
  return total;
}
function expandDrumPattern(drums, velocity) {
  const notes = [];
  const kit = drums.kit || "909";
  const stepDuration = parseDurationString(drums.stepDuration || DRUM_SEQUENCER.DEFAULT_STEP_DURATION);
  if (drums.steps) {
    const pattern = drums.steps;
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      if (char === "x" || char === "X") {
        notes.push({
          pitch: `drum:kick@${kit}`,
          // Default to kick for steps pattern
          startBeat: i * stepDuration,
          durationBeats: stepDuration,
          velocity: velocity * DRUM_SEQUENCER.DEFAULT_VELOCITY
        });
      } else if (char === ">") {
        notes.push({
          pitch: `drum:kick@${kit}`,
          startBeat: i * stepDuration,
          durationBeats: stepDuration,
          velocity: DRUM_SEQUENCER.ACCENT_VELOCITY
        });
      }
    }
  }
  if (drums.hits) {
    for (const hit of drums.hits) {
      const time = parseDrumTime(hit.time);
      const vel = hit.velocity ?? velocity;
      notes.push({
        pitch: `drum:${hit.drum}@${kit}`,
        startBeat: time,
        durationBeats: stepDuration,
        // Drums don't really use duration, but needed for timing
        velocity: vel
      });
    }
  }
  let totalBeats = 0;
  if (drums.steps) {
    totalBeats = drums.steps.length * stepDuration;
  }
  if (drums.hits && drums.hits.length > 0) {
    const maxTime = Math.max(...drums.hits.map((h) => parseDrumTime(h.time)));
    totalBeats = Math.max(totalBeats, maxTime + stepDuration);
  }
  return {
    notes,
    totalBeats
  };
}
function expandEuclidean(config, octaveOffset, transpose, velocity) {
  const { hits, steps, rotation = 0, duration, pitch, drum } = config;
  const pattern = generateEuclidean(hits, steps, rotation);
  const stepIndices = patternToSteps(pattern);
  const durationBeats = parseDurationString(duration);
  const notes = [];
  for (const stepIndex of stepIndices) {
    let notePitch;
    if (drum) {
      notePitch = `drum:${drum}@909`;
    } else if (pitch) {
      const adjustedPitch = applyTranspose(adjustOctave(pitch, octaveOffset), transpose);
      notePitch = adjustedPitch;
    } else {
      notePitch = applyTranspose(`C${4 + octaveOffset}`, transpose);
    }
    notes.push({
      pitch: notePitch,
      startBeat: stepIndex * durationBeats,
      durationBeats,
      velocity
    });
  }
  return {
    notes,
    totalBeats: steps * durationBeats
  };
}

// src/theory/chords.ts
var CHORD_INTERVALS2 = {
  // Triads
  "maj": [0, 4, 7],
  "min": [0, 3, 7],
  "m": [0, 3, 7],
  "dim": [0, 3, 6],
  "aug": [0, 4, 8],
  "sus2": [0, 2, 7],
  "sus4": [0, 5, 7],
  "sus": [0, 5, 7],
  // Seventh chords
  "maj7": [0, 4, 7, 11],
  "7": [0, 4, 7, 10],
  "min7": [0, 3, 7, 10],
  "m7": [0, 3, 7, 10],
  "dim7": [0, 3, 6, 9],
  "m7b5": [0, 3, 6, 10],
  "aug7": [0, 4, 8, 10],
  "minmaj7": [0, 3, 7, 11],
  "mM7": [0, 3, 7, 11],
  // Extended chords
  "9": [0, 4, 7, 10, 14],
  "maj9": [0, 4, 7, 11, 14],
  "min9": [0, 3, 7, 10, 14],
  "m9": [0, 3, 7, 10, 14],
  "11": [0, 4, 7, 10, 14, 17],
  "maj11": [0, 4, 7, 11, 14, 17],
  "min11": [0, 3, 7, 10, 14, 17],
  "m11": [0, 3, 7, 10, 14, 17],
  "13": [0, 4, 7, 10, 14, 17, 21],
  "maj13": [0, 4, 7, 11, 14, 17, 21],
  "min13": [0, 3, 7, 10, 14, 17, 21],
  "m13": [0, 3, 7, 10, 14, 17, 21],
  // Add chords
  "add9": [0, 4, 7, 14],
  "add11": [0, 4, 7, 17],
  "madd9": [0, 3, 7, 14],
  "6": [0, 4, 7, 9],
  "m6": [0, 3, 7, 9],
  "6/9": [0, 4, 7, 9, 14],
  // Altered chords
  "7b5": [0, 4, 6, 10],
  "7#5": [0, 4, 8, 10],
  "7b9": [0, 4, 7, 10, 13],
  "7#9": [0, 4, 7, 10, 15],
  "7b5b9": [0, 4, 6, 10, 13],
  "7#5#9": [0, 4, 8, 10, 15],
  "7alt": [0, 4, 6, 10, 13],
  // Power chord
  "5": [0, 7],
  "power": [0, 7]
};
var VOICINGS = {
  "maj7": {
    "close": { name: "Close", intervals: [0, 4, 7, 11], description: "Standard close voicing" },
    "drop2": { name: "Drop 2", intervals: [0, 7, 11, 16], description: "Second voice dropped an octave" },
    "drop3": { name: "Drop 3", intervals: [0, 11, 16, 19], description: "Third voice dropped an octave" },
    "shell": { name: "Shell", intervals: [0, 11, 16], description: "Root, 7th, 3rd (no 5th)" }
  },
  "m7": {
    "close": { name: "Close", intervals: [0, 3, 7, 10], description: "Standard close voicing" },
    "drop2": { name: "Drop 2", intervals: [0, 7, 10, 15], description: "Second voice dropped an octave" },
    "rootless_a": { name: "Rootless A", intervals: [3, 7, 10, 14], description: "Bill Evans style, no root" }
  },
  "7": {
    "close": { name: "Close", intervals: [0, 4, 7, 10], description: "Standard close voicing" },
    "drop2": { name: "Drop 2", intervals: [0, 7, 10, 16], description: "Second voice dropped an octave" },
    "shell": { name: "Shell", intervals: [0, 10, 16], description: "Root, 7th, 3rd (no 5th)" },
    "tritone_sub": { name: "Tritone Sub", intervals: [6, 10, 13, 16], description: "Tritone substitution" }
  }
};
function getChordIntervals2(quality) {
  const intervals = CHORD_INTERVALS2[quality];
  if (!intervals) {
    throw new Error(`Unknown chord quality: "${quality}"`);
  }
  return [...intervals];
}
function buildChord(root, quality, octave = 3) {
  const intervals = getChordIntervals2(quality);
  const rootPitch = `${root}${octave}`;
  const rootMidi = pitchToMidi(rootPitch);
  return intervals.map((interval) => midiToPitch(rootMidi + interval));
}
function getVoicing(root, quality, voicingName, octave = 3) {
  const qualityVoicings = VOICINGS[quality];
  if (!qualityVoicings) {
    return buildChord(root, quality, octave);
  }
  const voicing = qualityVoicings[voicingName];
  if (!voicing) {
    return buildChord(root, quality, octave);
  }
  const rootPitch = `${root}${octave}`;
  const rootMidi = pitchToMidi(rootPitch);
  return voicing.intervals.map((interval) => midiToPitch(rootMidi + interval));
}
function invertChord(notes, inversion) {
  const result = [...notes];
  const inversionCount = inversion % notes.length;
  for (let i = 0; i < inversionCount; i++) {
    const bottomNote = result.shift();
    const midi = pitchToMidi(bottomNote);
    result.push(midiToPitch(midi + 12));
  }
  return result;
}
function getDiatonicChord(key, degree, seventh = false) {
  const { root, mode } = parseKey(key);
  const majorQualities = seventh ? ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"] : ["maj", "min", "min", "maj", "maj", "min", "dim"];
  const minorQualities = seventh ? ["m7", "m7b5", "maj7", "m7", "m7", "maj7", "7"] : ["min", "dim", "maj", "min", "min", "maj", "maj"];
  const qualities = mode === "minor" ? minorQualities : majorQualities;
  const intervals = getScaleIntervals(mode);
  const rootMidi = pitchToMidi(`${root}4`) % 12;
  const degreeIndex = (degree - 1) % 7;
  const chordRootMidi = (rootMidi + intervals[degreeIndex]) % 12;
  const chordRoot = midiToPitch(48 + chordRootMidi).replace(/\d+$/, "");
  return `${chordRoot}${qualities[degreeIndex]}`;
}
function analyzeChordFunction(chordRoot, key) {
  const { root: keyRoot, mode } = parseKey(key);
  const keyRootMidi = pitchToMidi(`${keyRoot}4`) % 12;
  const chordRootMidi = pitchToMidi(`${chordRoot}4`) % 12;
  const interval = (chordRootMidi - keyRootMidi + 12) % 12;
  if (mode === "major") {
    if (interval === 0 || interval === 4 || interval === 9) return "tonic";
    if (interval === 5 || interval === 2) return "subdominant";
    if (interval === 7 || interval === 11) return "dominant";
  } else {
    if (interval === 0 || interval === 3 || interval === 8) return "tonic";
    if (interval === 5 || interval === 2) return "subdominant";
    if (interval === 7 || interval === 11) return "dominant";
  }
  return "unknown";
}
function getProgression(name, key) {
  const progressions = {
    "I-IV-V": [1, 4, 5],
    "I-V-vi-IV": [1, 5, 6, 4],
    "ii-V-I": [2, 5, 1],
    "I-vi-IV-V": [1, 6, 4, 5],
    "I-IV-vi-V": [1, 4, 6, 5],
    "vi-IV-I-V": [6, 4, 1, 5],
    "12-bar-blues": [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5]
  };
  const degrees = progressions[name];
  if (!degrees) {
    throw new Error(`Unknown progression: "${name}"`);
  }
  return degrees.map((degree) => getDiatonicChord(key, degree));
}
function getAvailableQualities() {
  return Object.keys(CHORD_INTERVALS2);
}

// src/theory/rhythm.ts
function applySwing(beat, swingAmount, division = 0.5) {
  if (swingAmount === 0) return beat;
  const beatInDivision = beat % division;
  const divisionNumber = Math.floor(beat % 1 / division);
  if (divisionNumber % 2 === 1) {
    const maxOffset = division / 3;
    const offset = maxOffset * swingAmount;
    return beat + offset;
  }
  return beat;
}
function humanizeTiming(beat, amount, maxDeviation = HUMANIZE.MAX_TIMING_VARIANCE_BEATS) {
  if (amount === 0) return beat;
  const deviation = (Math.random() * 2 - 1) * maxDeviation * amount;
  return Math.max(0, beat + deviation);
}
function humanizeVelocity(velocity, amount, maxDeviation = HUMANIZE.MAX_VELOCITY_VARIANCE) {
  if (amount === 0) return velocity;
  const deviation = (Math.random() * 2 - 1) * maxDeviation * amount;
  return Math.min(1, Math.max(0, velocity + deviation));
}
function humanizeDuration(duration, amount, maxDeviation = HUMANIZE.MAX_DURATION_VARIANCE) {
  if (amount === 0) return duration;
  const deviation = (Math.random() * 2 - 1) * maxDeviation * amount;
  return Math.max(0.01, duration * (1 + deviation));
}
var GROOVE_TEMPLATES2 = GROOVE_TEMPLATES;
function applyGroove(beat, velocity, groove) {
  const template = typeof groove === "string" ? GROOVE_TEMPLATES2[groove] : groove;
  if (!template) {
    return { beat, velocity };
  }
  const sixteenthInBeat = Math.floor(beat % 1 * 4) % 4;
  const timingOffset = template.timingOffsets[sixteenthInBeat] || 0;
  const velocityMultiplier = template.velocityMultipliers[sixteenthInBeat] || 1;
  return {
    beat: beat + timingOffset,
    velocity: velocity * velocityMultiplier
  };
}
function parseRhythmPattern(pattern, division = 0.5) {
  const result = [];
  let currentBeat = 0;
  for (const char of pattern) {
    if (char === "x" || char === "X") {
      result.push({ beat: currentBeat, accent: false });
      currentBeat += division;
    } else if (char === ">" || char === "!") {
      result.push({ beat: currentBeat, accent: true });
      currentBeat += division;
    } else if (char === "." || char === "-") {
      currentBeat += division;
    } else if (char === " ") {
    }
  }
  return result;
}
function calculateDensity(notes, totalBeats) {
  if (totalBeats === 0) return 0;
  return notes.length / totalBeats;
}
function parseTimeSignature(signature) {
  const match = signature.match(/^(\d+)\/(\d+)$/);
  if (!match) {
    throw new Error(`Invalid time signature: "${signature}"`);
  }
  const numerator = parseInt(match[1], 10);
  const denominator = parseInt(match[2], 10);
  const beatValue = 4 / denominator;
  const beatsPerBar = numerator * beatValue;
  return {
    numerator,
    denominator,
    beatsPerBar,
    beatValue
  };
}
function getBarPosition(beat, timeSignature) {
  const ts = typeof timeSignature === "string" ? parseTimeSignature(timeSignature) : timeSignature;
  const bar = Math.floor(beat / ts.beatsPerBar) + 1;
  const beatInBar = beat % ts.beatsPerBar + 1;
  return { bar, beatInBar };
}
function getAvailableGrooves() {
  return Object.keys(GROOVE_TEMPLATES2);
}

// src/engine/timeline.ts
var TimelineBuilder = class {
  events = [];
  instruments = /* @__PURE__ */ new Set();
  settings;
  currentTempo;
  constructor(settings) {
    this.settings = settings;
    this.currentTempo = settings.tempo;
  }
  /**
   * Add a note event
   * v0.4: Supports optional expression fields via options parameter
   */
  addNote(pitch, startBeat, durationBeats, velocity, instrument, options) {
    this.instruments.add(instrument);
    const timeSeconds = this.beatsToTime(startBeat);
    const durationSeconds = beatsToSeconds(durationBeats, this.currentTempo);
    const event = {
      type: "note",
      time: startBeat,
      timeSeconds,
      pitch,
      duration: durationBeats,
      durationSeconds,
      velocity,
      instrument
    };
    if (options) {
      if (options.timingOffset !== void 0) event.timingOffset = options.timingOffset;
      if (options.probability !== void 0) event.probability = options.probability;
      if (options.portamento !== void 0) event.portamento = options.portamento;
      if (options.humanize !== void 0) event.humanize = options.humanize;
    }
    this.events.push(event);
    return this;
  }
  /**
   * Add multiple notes as a chord
   */
  addChord(pitches, startBeat, durationBeats, velocity, instrument) {
    this.instruments.add(instrument);
    const timeSeconds = this.beatsToTime(startBeat);
    const durationSeconds = beatsToSeconds(durationBeats, this.currentTempo);
    const notes = pitches.map((pitch) => ({
      type: "note",
      time: startBeat,
      timeSeconds,
      pitch,
      duration: durationBeats,
      durationSeconds,
      velocity,
      instrument
    }));
    const event = {
      type: "chord",
      time: startBeat,
      timeSeconds,
      notes
    };
    this.events.push(event);
    return this;
  }
  /**
   * Add a tempo change
   */
  addTempoChange(beat, tempo) {
    const event = {
      type: "tempo",
      time: beat,
      timeSeconds: this.beatsToTime(beat),
      tempo
    };
    this.events.push(event);
    this.currentTempo = tempo;
    return this;
  }
  /**
   * Add a key change
   */
  addKeyChange(beat, key) {
    const event = {
      type: "key",
      time: beat,
      timeSeconds: this.beatsToTime(beat),
      key
    };
    this.events.push(event);
    return this;
  }
  /**
   * Convert beats to seconds considering tempo
   */
  beatsToTime(beats) {
    return beatsToSeconds(beats, this.currentTempo);
  }
  /**
   * Build the final timeline
   */
  build() {
    const sortedEvents = [...this.events].sort((a, b) => a.time - b.time);
    let totalBeats = 0;
    for (const event of sortedEvents) {
      if (event.type === "note") {
        totalBeats = Math.max(totalBeats, event.time + event.duration);
      } else if (event.type === "chord") {
        for (const note of event.notes) {
          totalBeats = Math.max(totalBeats, note.time + note.duration);
        }
      }
    }
    const processedEvents = this.recalculateTimes(sortedEvents);
    const totalSeconds = this.calculateTotalSeconds(processedEvents, totalBeats);
    return {
      events: processedEvents,
      totalBeats,
      totalSeconds,
      instruments: Array.from(this.instruments),
      settings: this.settings
    };
  }
  /**
   * Recalculate times considering tempo changes
   */
  recalculateTimes(events) {
    let currentTempo = this.settings.tempo;
    let currentBeat = 0;
    let currentTime = 0;
    const tempoEvents = events.filter((e) => e.type === "tempo").sort((a, b) => a.time - b.time);
    return events.map((event) => {
      for (const tempoEvent of tempoEvents) {
        if (tempoEvent.time <= event.time && tempoEvent.time > currentBeat) {
          currentTime += beatsToSeconds(tempoEvent.time - currentBeat, currentTempo);
          currentBeat = tempoEvent.time;
          currentTempo = tempoEvent.tempo;
        }
      }
      const beatsSinceLastChange = event.time - currentBeat;
      const timeSeconds = currentTime + beatsToSeconds(beatsSinceLastChange, currentTempo);
      const updated = { ...event, timeSeconds };
      if (event.type === "note") {
        updated.durationSeconds = beatsToSeconds(event.duration, currentTempo);
      } else if (event.type === "chord") {
        updated.notes = event.notes.map((note) => ({
          ...note,
          timeSeconds,
          durationSeconds: beatsToSeconds(note.duration, currentTempo)
        }));
      }
      return updated;
    });
  }
  /**
   * Calculate total seconds for the timeline
   */
  calculateTotalSeconds(events, totalBeats) {
    let maxTime = 0;
    for (const event of events) {
      if (event.type === "note") {
        maxTime = Math.max(maxTime, event.timeSeconds + event.durationSeconds);
      } else if (event.type === "chord") {
        for (const note of event.notes) {
          maxTime = Math.max(maxTime, note.timeSeconds + note.durationSeconds);
        }
      }
    }
    return maxTime;
  }
};
function getAllNotes(timeline) {
  const notes = [];
  for (const event of timeline.events) {
    if (event.type === "note") {
      notes.push(event);
    } else if (event.type === "chord") {
      notes.push(...event.notes);
    }
  }
  return notes.sort((a, b) => a.time - b.time);
}
function filterByInstrument(timeline, instrument) {
  return timeline.events.filter((event) => {
    if (event.type === "note") {
      return event.instrument === instrument;
    }
    if (event.type === "chord") {
      return event.notes.some((note) => note.instrument === instrument);
    }
    return true;
  });
}
function mergeTimelines(timelines) {
  if (timelines.length === 0) {
    throw new Error("Cannot merge empty array of timelines");
  }
  const allEvents = [];
  const allInstruments = /* @__PURE__ */ new Set();
  let maxBeats = 0;
  let maxSeconds = 0;
  for (const timeline of timelines) {
    allEvents.push(...timeline.events);
    timeline.instruments.forEach((i) => allInstruments.add(i));
    maxBeats = Math.max(maxBeats, timeline.totalBeats);
    maxSeconds = Math.max(maxSeconds, timeline.totalSeconds);
  }
  return {
    events: allEvents.sort((a, b) => a.time - b.time),
    totalBeats: maxBeats,
    totalSeconds: maxSeconds,
    instruments: Array.from(allInstruments),
    settings: timelines[0].settings
  };
}
function offsetTimeline(timeline, beatOffset) {
  const offsetEvents = timeline.events.map((event) => {
    const newEvent = { ...event, time: event.time + beatOffset };
    if (event.type === "chord") {
      newEvent.notes = event.notes.map((note) => ({
        ...note,
        time: note.time + beatOffset
      }));
    }
    return newEvent;
  });
  return {
    ...timeline,
    events: offsetEvents,
    totalBeats: timeline.totalBeats + beatOffset
  };
}

// src/engine/pattern-resolver.ts
function resolveTrack(track, ctx) {
  if (track.mute) {
    return [];
  }
  const patternNames = track.patterns || (track.pattern ? [track.pattern] : []);
  if (patternNames.length === 0) {
    return [];
  }
  const results = [];
  let currentBeat = 0;
  const repeatCount = track.repeat || 1;
  for (let r = 0; r < repeatCount; r++) {
    for (const patternName of patternNames) {
      const pattern = ctx.patterns[patternName];
      if (!pattern) {
        console.warn(`Pattern not found: ${patternName}`);
        continue;
      }
      const patternCtx = {
        key: ctx.sectionKey || ctx.settings.key,
        tempo: ctx.sectionTempo || ctx.settings.tempo,
        velocity: track.velocity,
        octaveOffset: track.octave,
        transpose: track.transpose
      };
      const expanded = expandPattern(pattern, patternCtx);
      const processedNotes = processExpandedNotes(
        expanded,
        currentBeat,
        track.humanize || 0,
        ctx.settings.swing || 0
      );
      results.push(...processedNotes);
      currentBeat += expanded.totalBeats;
    }
  }
  return results;
}
function processExpandedNotes(expanded, beatOffset, humanize, swing) {
  return expanded.notes.map((note) => {
    let startBeat = note.startBeat + beatOffset;
    let velocity = note.velocity;
    let durationBeats = note.durationBeats;
    if (swing > 0) {
      startBeat = applySwing(startBeat, swing);
    }
    if (humanize > 0) {
      startBeat = humanizeTiming(startBeat, humanize);
      velocity = humanizeVelocity(velocity, humanize);
      durationBeats = humanizeDuration(durationBeats, humanize);
    }
    const result = {
      pitch: note.pitch,
      startBeat: Math.max(0, startBeat),
      durationBeats,
      velocity: Math.min(1, Math.max(0, velocity))
    };
    if (note.timingOffset !== void 0) result.timingOffset = note.timingOffset;
    if (note.probability !== void 0) result.probability = note.probability;
    if (note.portamento !== void 0) result.portamento = note.portamento;
    if (humanize > 0) result.humanize = humanize;
    return result;
  });
}
function resolveSection(tracks, bars, ctx) {
  const result = /* @__PURE__ */ new Map();
  const beatsPerBar = getBeatsPerBar(ctx.settings.timeSignature || "4/4");
  const sectionBeats = bars * beatsPerBar;
  for (const [instrumentName, track] of Object.entries(tracks)) {
    const notes = resolveTrack(track, ctx);
    const filledNotes = fillToLength(notes, sectionBeats);
    result.set(instrumentName, filledNotes);
  }
  return result;
}
function getBeatsPerBar(timeSignature) {
  const match = timeSignature.match(/^(\d+)\/(\d+)$/);
  if (!match) return 4;
  const numerator = parseInt(match[1], 10);
  const denominator = parseInt(match[2], 10);
  return numerator * (4 / denominator);
}
function fillToLength(notes, targetBeats) {
  if (notes.length === 0) return [];
  const patternLength = Math.max(...notes.map((n) => n.startBeat + n.durationBeats), 1);
  if (patternLength >= targetBeats) {
    return notes.filter((n) => n.startBeat < targetBeats);
  }
  const result = [];
  let offset = 0;
  while (offset < targetBeats) {
    for (const note of notes) {
      const newStart = note.startBeat + offset;
      if (newStart >= targetBeats) break;
      result.push({
        ...note,
        startBeat: newStart
      });
    }
    offset += patternLength;
  }
  return result;
}
function quantizeNotes(notes, gridSize, strength = 1) {
  return notes.map((note) => {
    const quantizedStart = Math.round(note.startBeat / gridSize) * gridSize;
    const diff = quantizedStart - note.startBeat;
    return {
      ...note,
      startBeat: note.startBeat + diff * strength
    };
  });
}
function transposeNotes(notes, semitones) {
  if (semitones === 0) return notes;
  return notes.map((note) => {
    const match = note.pitch.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!match) return note;
    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const noteOrder = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const flatToSharp = {
      "Db": "C#",
      "Eb": "D#",
      "Fb": "E",
      "Gb": "F#",
      "Ab": "G#",
      "Bb": "A#",
      "Cb": "B"
    };
    const normalizedNote = flatToSharp[noteName] || noteName;
    const currentIndex = noteOrder.indexOf(normalizedNote);
    if (currentIndex === -1) return note;
    const newIndex = (currentIndex + semitones % 12 + 12) % 12;
    const octaveChange = Math.floor((currentIndex + semitones) / 12);
    const newNote = noteOrder[newIndex];
    const newOctave = octave + octaveChange;
    return {
      ...note,
      pitch: `${newNote}${newOctave}`
    };
  });
}

// src/engine/compiler.ts
function compile(score, options = {}) {
  const warnings = [];
  for (const sectionName of score.arrangement) {
    if (!score.sections[sectionName]) {
      warnings.push(`Section "${sectionName}" in arrangement not found`);
    }
  }
  const sectionsToCompile = getSectionsToCompile(score, options);
  const settings = {
    ...score.settings,
    tempo: options.tempo || score.settings.tempo,
    key: options.key || score.settings.key
  };
  const builder = new TimelineBuilder(settings);
  const timeSignature = settings.timeSignature || "4/4";
  const ts = parseTimeSignature(timeSignature);
  const beatsPerBar = ts.beatsPerBar;
  let currentBeat = 0;
  let totalBars = 0;
  let totalNotes = 0;
  for (const sectionName of sectionsToCompile) {
    const section = score.sections[sectionName];
    if (!section) {
      continue;
    }
    const sectionTempo = section.tempo || settings.tempo;
    const sectionKey = section.key || settings.key;
    if (section.tempo && section.tempo !== settings.tempo) {
      builder.addTempoChange(currentBeat, section.tempo);
    }
    if (section.key && section.key !== settings.key) {
      builder.addKeyChange(currentBeat, section.key);
    }
    const ctx = {
      patterns: score.patterns,
      settings,
      sectionKey,
      sectionTempo
    };
    const resolvedTracks = resolveSection(section.tracks, section.bars, ctx);
    for (const [instrumentName, notes] of resolvedTracks) {
      for (const note of notes) {
        const options2 = note.timingOffset !== void 0 || note.probability !== void 0 || note.portamento !== void 0 || note.humanize !== void 0 ? {
          timingOffset: note.timingOffset,
          probability: note.probability,
          portamento: note.portamento,
          humanize: note.humanize
        } : void 0;
        builder.addNote(
          note.pitch,
          currentBeat + note.startBeat,
          note.durationBeats,
          note.velocity,
          instrumentName,
          options2
        );
        totalNotes++;
      }
    }
    currentBeat += section.bars * beatsPerBar;
    totalBars += section.bars;
  }
  const timeline = builder.build();
  const stats = {
    totalSections: sectionsToCompile.length,
    totalBars,
    totalNotes,
    instruments: timeline.instruments,
    durationSeconds: timeline.totalSeconds
  };
  return { timeline, warnings, stats };
}
function getSectionsToCompile(score, options) {
  const arrangement = score.arrangement;
  let startIndex = 0;
  let endIndex = arrangement.length;
  if (options.startSection) {
    const idx = arrangement.indexOf(options.startSection);
    if (idx !== -1) {
      startIndex = idx;
    }
  }
  if (options.endSection) {
    const idx = arrangement.indexOf(options.endSection);
    if (idx !== -1) {
      endIndex = idx + 1;
    }
  }
  return arrangement.slice(startIndex, endIndex);
}
function analyze(score) {
  const timeSignature = score.settings.timeSignature || "4/4";
  const ts = parseTimeSignature(timeSignature);
  let totalBars = 0;
  const sections = [];
  const allInstruments = /* @__PURE__ */ new Set();
  for (const sectionName of score.arrangement) {
    const section = score.sections[sectionName];
    if (section) {
      totalBars += section.bars;
      const instruments = Object.keys(section.tracks);
      instruments.forEach((i) => allInstruments.add(i));
      sections.push({
        name: sectionName,
        bars: section.bars,
        instruments
      });
    }
  }
  const totalBeats = totalBars * ts.beatsPerBar;
  const durationSeconds = totalBeats / score.settings.tempo * 60;
  return {
    totalSections: score.arrangement.length,
    totalBars,
    totalNotes: 0,
    // Would need full compilation
    instruments: Array.from(allInstruments),
    durationSeconds,
    sections,
    patterns: Object.keys(score.patterns)
  };
}
function validateScore(score) {
  const errors = [];
  for (const sectionName of score.arrangement) {
    if (!score.sections[sectionName]) {
      errors.push(`Arrangement references unknown section: "${sectionName}"`);
    }
  }
  for (const [sectionName, section] of Object.entries(score.sections)) {
    for (const [trackName, track] of Object.entries(section.tracks)) {
      if (track.pattern && !score.patterns[track.pattern]) {
        errors.push(`Section "${sectionName}" track "${trackName}" references unknown pattern: "${track.pattern}"`);
      }
      if (track.patterns) {
        for (const patternName of track.patterns) {
          if (!score.patterns[patternName]) {
            errors.push(`Section "${sectionName}" track "${trackName}" references unknown pattern: "${patternName}"`);
          }
        }
      }
    }
  }
  if (score.instruments) {
    const instrumentNames = new Set(Object.keys(score.instruments));
    for (const [sectionName, section] of Object.entries(score.sections)) {
      for (const trackName of Object.keys(section.tracks)) {
        if (!instrumentNames.has(trackName)) {
          errors.push(`Section "${sectionName}" has track "${trackName}" with no matching instrument`);
        }
      }
    }
  }
  return errors;
}
function createSimpleScore(patterns, bars = 4, tempo = 120, key = "C major") {
  const etherPatterns = {};
  const tracks = {};
  let i = 0;
  for (const [name, notes] of Object.entries(patterns)) {
    const patternName = name || `pattern_${i}`;
    etherPatterns[patternName] = { notes };
    tracks[patternName] = { pattern: patternName };
    i++;
  }
  return {
    settings: { tempo, key },
    patterns: etherPatterns,
    sections: {
      main: { bars, tracks }
    },
    arrangement: ["main"]
  };
}

// src/synthesis/drum-kits.ts
var KIT_808 = {
  name: "808",
  description: "Classic Roland TR-808 sounds - deep kicks, snappy snares",
  drums: {
    kick: {
      type: "membrane",
      pitch: "C2",
      pitchDecay: 5e-3,
      octaves: 14,
      decay: 0.8,
      attack: 5e-4,
      sustain: 0,
      release: 0.3,
      volume: 6
    },
    snare: {
      type: "noise",
      noiseType: "white",
      decay: 0.25,
      attack: 1e-3,
      sustain: 0,
      release: 0.1,
      volume: 0
    },
    clap: {
      type: "noise",
      noiseType: "white",
      decay: 0.18,
      attack: 1e-3,
      sustain: 0,
      release: 0.08,
      volume: 0
    },
    hihat: {
      type: "metal",
      frequency: 6e3,
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4e3,
      decay: 0.03,
      attack: 1e-3,
      sustain: 0,
      release: 0.01,
      volume: -6
    },
    hihat_open: {
      type: "metal",
      frequency: 6e3,
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4e3,
      decay: 0.25,
      attack: 1e-3,
      sustain: 0.08,
      release: 0.1,
      volume: -6
    },
    tom_hi: {
      type: "membrane",
      pitch: "G2",
      pitchDecay: 8e-3,
      octaves: 8,
      decay: 0.3,
      attack: 1e-3,
      sustain: 0,
      release: 0.1,
      volume: 0
    },
    tom_mid: {
      type: "membrane",
      pitch: "D2",
      pitchDecay: 8e-3,
      octaves: 8,
      decay: 0.35,
      attack: 1e-3,
      sustain: 0,
      release: 0.1,
      volume: 0
    },
    tom_lo: {
      type: "membrane",
      pitch: "A1",
      pitchDecay: 8e-3,
      octaves: 8,
      decay: 0.4,
      attack: 1e-3,
      sustain: 0,
      release: 0.1,
      volume: 0
    },
    cowbell: {
      type: "metal",
      frequency: 800,
      harmonicity: 1.5,
      modulationIndex: 2,
      resonance: 2e3,
      decay: 0.15,
      attack: 1e-3,
      sustain: 0,
      release: 0.1,
      volume: -6
    },
    rim: {
      type: "noise",
      noiseType: "white",
      decay: 0.04,
      attack: 1e-3,
      sustain: 0,
      release: 0.02,
      volume: 0
    },
    crash: {
      type: "metal",
      frequency: 4e3,
      harmonicity: 8,
      modulationIndex: 40,
      resonance: 5e3,
      decay: 1.5,
      attack: 1e-3,
      sustain: 0.1,
      release: 0.5,
      volume: -6
    },
    ride: {
      type: "metal",
      frequency: 5e3,
      harmonicity: 7,
      modulationIndex: 20,
      resonance: 3e3,
      decay: 0.8,
      attack: 1e-3,
      sustain: 0.05,
      release: 0.3,
      volume: -9
    },
    shaker: {
      type: "noise",
      noiseType: "white",
      decay: 0.06,
      attack: 1e-3,
      sustain: 0,
      release: 0.03,
      volume: -6
    }
  }
};
var KIT_909 = {
  name: "909",
  description: "Classic Roland TR-909 sounds - punchy kicks, snappy snares",
  drums: {
    kick: {
      type: "membrane",
      pitch: "D2",
      pitchDecay: 8e-3,
      octaves: 12,
      decay: 0.25,
      attack: 5e-4,
      sustain: 0,
      release: 0.08,
      volume: 6
    },
    snare: {
      type: "noise",
      noiseType: "pink",
      decay: 0.12,
      attack: 1e-3,
      sustain: 0,
      release: 0.04,
      volume: 0
    },
    clap: {
      type: "noise",
      noiseType: "white",
      decay: 0.1,
      attack: 1e-3,
      sustain: 0,
      release: 0.04,
      volume: 0
    },
    hihat: {
      type: "metal",
      frequency: 8e3,
      harmonicity: 5.1,
      modulationIndex: 40,
      resonance: 6e3,
      decay: 0.04,
      attack: 1e-3,
      sustain: 0,
      release: 0.01,
      volume: -6
    },
    hihat_open: {
      type: "metal",
      frequency: 8e3,
      harmonicity: 5.1,
      modulationIndex: 40,
      resonance: 6e3,
      decay: 0.18,
      attack: 1e-3,
      sustain: 0.04,
      release: 0.08,
      volume: -6
    },
    tom_hi: {
      type: "membrane",
      pitch: "A2",
      pitchDecay: 6e-3,
      octaves: 10,
      decay: 0.18,
      attack: 1e-3,
      sustain: 0,
      release: 0.08,
      volume: 0
    },
    tom_mid: {
      type: "membrane",
      pitch: "E2",
      pitchDecay: 6e-3,
      octaves: 10,
      decay: 0.22,
      attack: 1e-3,
      sustain: 0,
      release: 0.08,
      volume: 0
    },
    tom_lo: {
      type: "membrane",
      pitch: "B1",
      pitchDecay: 6e-3,
      octaves: 10,
      decay: 0.26,
      attack: 1e-3,
      sustain: 0,
      release: 0.08,
      volume: 0
    },
    cowbell: {
      type: "metal",
      frequency: 560,
      harmonicity: 1,
      modulationIndex: 2,
      resonance: 1500,
      decay: 0.1,
      attack: 1e-3,
      sustain: 0,
      release: 0.06,
      volume: -6
    },
    rim: {
      type: "noise",
      noiseType: "white",
      decay: 0.04,
      attack: 1e-3,
      sustain: 0,
      release: 0.02,
      volume: 0
    },
    crash: {
      type: "metal",
      frequency: 5e3,
      harmonicity: 9,
      modulationIndex: 45,
      resonance: 6e3,
      decay: 1.8,
      attack: 1e-3,
      sustain: 0.1,
      release: 0.6,
      volume: -6
    },
    ride: {
      type: "metal",
      frequency: 6e3,
      harmonicity: 6,
      modulationIndex: 25,
      resonance: 4e3,
      decay: 0.5,
      attack: 1e-3,
      sustain: 0.04,
      release: 0.2,
      volume: -9
    },
    shaker: {
      type: "noise",
      noiseType: "pink",
      decay: 0.05,
      attack: 1e-3,
      sustain: 0,
      release: 0.025,
      volume: -6
    }
  }
};
var KIT_ACOUSTIC = {
  name: "acoustic",
  description: "Natural acoustic drum sounds",
  drums: {
    kick: {
      type: "membrane",
      pitch: "E2",
      pitchDecay: 0.012,
      octaves: 10,
      decay: 0.35,
      attack: 2e-3,
      sustain: 0,
      release: 0.12,
      volume: 3
    },
    snare: {
      type: "noise",
      noiseType: "pink",
      decay: 0.14,
      attack: 2e-3,
      sustain: 0,
      release: 0.06,
      volume: 0
    },
    clap: {
      type: "noise",
      noiseType: "white",
      decay: 0.1,
      attack: 3e-3,
      sustain: 0,
      release: 0.04,
      volume: 0
    },
    hihat: {
      type: "metal",
      frequency: 9e3,
      harmonicity: 4,
      modulationIndex: 25,
      resonance: 7e3,
      decay: 0.035,
      attack: 2e-3,
      sustain: 0,
      release: 0.015,
      volume: -9
    },
    hihat_open: {
      type: "metal",
      frequency: 9e3,
      harmonicity: 4,
      modulationIndex: 25,
      resonance: 7e3,
      decay: 0.3,
      attack: 2e-3,
      sustain: 0.08,
      release: 0.12,
      volume: -9
    },
    tom_hi: {
      type: "membrane",
      pitch: "G2",
      pitchDecay: 0.01,
      octaves: 8,
      decay: 0.25,
      attack: 3e-3,
      sustain: 0,
      release: 0.1,
      volume: 0
    },
    tom_mid: {
      type: "membrane",
      pitch: "D2",
      pitchDecay: 0.01,
      octaves: 8,
      decay: 0.3,
      attack: 3e-3,
      sustain: 0,
      release: 0.1,
      volume: 0
    },
    tom_lo: {
      type: "membrane",
      pitch: "G1",
      pitchDecay: 0.01,
      octaves: 8,
      decay: 0.35,
      attack: 3e-3,
      sustain: 0,
      release: 0.1,
      volume: 0
    },
    cowbell: {
      type: "metal",
      frequency: 700,
      harmonicity: 1.2,
      modulationIndex: 3,
      resonance: 1800,
      decay: 0.18,
      attack: 2e-3,
      sustain: 0,
      release: 0.08,
      volume: -6
    },
    rim: {
      type: "noise",
      noiseType: "white",
      decay: 0.012,
      attack: 1e-3,
      sustain: 0,
      release: 8e-3,
      volume: -3
    },
    crash: {
      type: "metal",
      frequency: 4500,
      harmonicity: 6,
      modulationIndex: 30,
      resonance: 5500,
      decay: 2,
      attack: 3e-3,
      sustain: 0.15,
      release: 0.8,
      volume: -6
    },
    ride: {
      type: "metal",
      frequency: 5500,
      harmonicity: 5,
      modulationIndex: 18,
      resonance: 4500,
      decay: 0.9,
      attack: 2e-3,
      sustain: 0.06,
      release: 0.35,
      volume: -9
    },
    shaker: {
      type: "noise",
      noiseType: "brown",
      decay: 0.06,
      attack: 3e-3,
      sustain: 0,
      release: 0.03,
      volume: -6
    }
  }
};
var KIT_LOFI = {
  name: "lofi",
  description: "Lo-fi, vintage, dusty drum sounds",
  drums: {
    kick: {
      type: "membrane",
      pitch: "D2",
      pitchDecay: 0.015,
      octaves: 9,
      decay: 0.45,
      attack: 5e-3,
      sustain: 0,
      release: 0.12,
      volume: 3
    },
    snare: {
      type: "noise",
      noiseType: "brown",
      decay: 0.18,
      attack: 4e-3,
      sustain: 0,
      release: 0.08,
      volume: 0
    },
    clap: {
      type: "noise",
      noiseType: "pink",
      decay: 0.14,
      attack: 6e-3,
      sustain: 0,
      release: 0.05,
      volume: 0
    },
    hihat: {
      type: "metal",
      frequency: 5e3,
      harmonicity: 4.5,
      modulationIndex: 20,
      resonance: 3500,
      decay: 0.05,
      attack: 4e-3,
      sustain: 0,
      release: 0.025,
      volume: -9
    },
    hihat_open: {
      type: "metal",
      frequency: 5e3,
      harmonicity: 4.5,
      modulationIndex: 20,
      resonance: 3500,
      decay: 0.28,
      attack: 4e-3,
      sustain: 0.06,
      release: 0.1,
      volume: -9
    },
    tom_hi: {
      type: "membrane",
      pitch: "F2",
      pitchDecay: 0.012,
      octaves: 7,
      decay: 0.3,
      attack: 6e-3,
      sustain: 0,
      release: 0.1,
      volume: 0
    },
    tom_mid: {
      type: "membrane",
      pitch: "C2",
      pitchDecay: 0.012,
      octaves: 7,
      decay: 0.35,
      attack: 6e-3,
      sustain: 0,
      release: 0.1,
      volume: 0
    },
    tom_lo: {
      type: "membrane",
      pitch: "F1",
      pitchDecay: 0.012,
      octaves: 7,
      decay: 0.4,
      attack: 6e-3,
      sustain: 0,
      release: 0.1,
      volume: 0
    },
    cowbell: {
      type: "metal",
      frequency: 650,
      harmonicity: 1.3,
      modulationIndex: 2.5,
      resonance: 1400,
      decay: 0.22,
      attack: 4e-3,
      sustain: 0,
      release: 0.1,
      volume: -6
    },
    rim: {
      type: "noise",
      noiseType: "pink",
      decay: 0.05,
      attack: 1e-3,
      sustain: 0,
      release: 0.02,
      volume: 0
    },
    crash: {
      type: "metal",
      frequency: 3500,
      harmonicity: 5,
      modulationIndex: 25,
      resonance: 4e3,
      decay: 1.6,
      attack: 6e-3,
      sustain: 0.08,
      release: 0.5,
      volume: -6
    },
    ride: {
      type: "metal",
      frequency: 4500,
      harmonicity: 4.5,
      modulationIndex: 15,
      resonance: 3e3,
      decay: 0.8,
      attack: 4e-3,
      sustain: 0.05,
      release: 0.3,
      volume: -9
    },
    shaker: {
      type: "noise",
      noiseType: "brown",
      decay: 0.07,
      attack: 5e-3,
      sustain: 0,
      release: 0.04,
      volume: -6
    }
  }
};
var DRUM_KITS = {
  "808": KIT_808,
  "909": KIT_909,
  "acoustic": KIT_ACOUSTIC,
  "lofi": KIT_LOFI
};
function getDrumParams(kit, drum) {
  return DRUM_KITS[kit]?.drums[drum];
}
function getAvailableDrums() {
  return [
    "kick",
    "snare",
    "clap",
    "hihat",
    "hihat_open",
    "tom_hi",
    "tom_mid",
    "tom_lo",
    "crash",
    "ride",
    "rim",
    "cowbell",
    "shaker"
  ];
}
function getAvailableKits() {
  return ["808", "909", "acoustic", "lofi"];
}
function parseStepPattern(pattern, defaultVelocity = 0.8) {
  const hits = [];
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === "x" || char === "X") {
      hits.push({ step: i, velocity: defaultVelocity });
    } else if (char === ">") {
      hits.push({ step: i, velocity: 1 });
    }
  }
  return hits;
}

// src/browser/index.ts
var VERSION = "0.45.0";
export {
  ARPEGGIATOR,
  ARTICULATION,
  AUDIO,
  CHORD_INTERVALS2 as CHORD_INTERVALS,
  DEFAULT_SETTINGS,
  DOTTED_MULTIPLIER,
  DRUM_KITS,
  DRUM_SEQUENCER,
  DURATIONS,
  DURATION_MAP,
  EFFECT_DEFAULTS,
  ENVELOPE_PRESETS,
  GROOVE_TEMPLATES,
  HUMANIZE,
  KIT_808,
  KIT_909,
  KIT_ACOUSTIC,
  KIT_LOFI,
  MIDI,
  NOTE_NAMES,
  NOTE_VALUES,
  PORTAMENTO,
  SCALE_INTERVALS,
  TimelineBuilder,
  VELOCITY_ENVELOPE,
  VERSION,
  analyze,
  analyzeChordFunction,
  applyGroove,
  applySwing,
  augmentPattern,
  beatsToSeconds,
  buildChord,
  calculateDensity,
  compile,
  createSimpleScore,
  expandDrumPattern,
  expandEuclidean,
  expandPattern,
  filterByInstrument,
  generateEuclidean,
  getAllNotes,
  getArticulationModifiers,
  getAvailableDrums,
  getAvailableGrooves,
  getAvailableKits,
  getAvailableQualities,
  getAvailableScales,
  getBarPosition,
  getChordIntervals2 as getChordIntervals,
  getChordNotes,
  getDiatonicChord,
  getDrumParams,
  getParallelKey,
  getProgression,
  getRelativeKey,
  getScaleDegree,
  getScaleIntervals,
  getScaleNotes,
  getSupportedChordQualities,
  getVoicing,
  humanizeDuration,
  humanizeTiming,
  humanizeVelocity,
  invertChord,
  invertPattern,
  isNoteInScale,
  isRest,
  mergeTimelines,
  midiToPitch,
  offsetTimeline,
  parseChord,
  parseChords,
  parseDuration,
  parseKey,
  parseNote,
  parseNotes,
  parseRest,
  parseRhythmPattern,
  parseStepPattern,
  parseTimeSignature,
  patternToSteps,
  pitchToMidi,
  quantizeNotes,
  resolvePattern,
  resolveSection,
  resolveTrack,
  retrogradePattern,
  rotatePattern,
  shiftOctave,
  snapToScale,
  transposeNotes,
  transposePattern,
  transposePitch,
  validateScore
};
