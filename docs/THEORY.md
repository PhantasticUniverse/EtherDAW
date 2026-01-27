# Music Theory Reference

EtherDAW includes built-in music theory support. This document covers scales, chords, and how to use them effectively.

## Scales

### Setting the Key

The key is set in `settings`:

```json
{
  "settings": {
    "key": "C major",
    "tempo": 120
  }
}
```

### Key Format
```
<root> <mode>
```

Examples: `"C major"`, `"A minor"`, `"G mixolydian"`, `"F# dorian"`

### Available Modes

| Mode | Character | Scale Degrees | Example (from C) |
|------|-----------|---------------|------------------|
| major | Bright, happy | 1-2-3-4-5-6-7 | C-D-E-F-G-A-B |
| minor | Dark, sad | 1-2-b3-4-5-b6-b7 | C-D-Eb-F-G-Ab-Bb |
| dorian | Minor with bright 6th | 1-2-b3-4-5-6-b7 | C-D-Eb-F-G-A-Bb |
| phrygian | Spanish, dark | 1-b2-b3-4-5-b6-b7 | C-Db-Eb-F-G-Ab-Bb |
| lydian | Dreamy, bright | 1-2-3-#4-5-6-7 | C-D-E-F#-G-A-B |
| mixolydian | Bluesy major | 1-2-3-4-5-6-b7 | C-D-E-F-G-A-Bb |
| locrian | Diminished, unstable | 1-b2-b3-4-b5-b6-b7 | C-Db-Eb-F-Gb-Ab-Bb |
| harmonic_minor | Classical minor | 1-2-b3-4-5-b6-7 | C-D-Eb-F-G-Ab-B |
| melodic_minor | Jazz minor | 1-2-b3-4-5-6-7 | C-D-Eb-F-G-A-B |
| pentatonic | Five-note major | 1-2-3-5-6 | C-D-E-G-A |
| minor_pentatonic | Five-note minor | 1-b3-4-5-b7 | C-Eb-F-G-Bb |
| blues | Blues scale | 1-b3-4-b5-5-b7 | C-Eb-F-Gb-G-Bb |

### Mode Selection Guide

| Mood/Genre | Recommended Modes |
|------------|-------------------|
| Happy, uplifting | major, lydian |
| Sad, melancholy | minor, harmonic_minor |
| Jazz | dorian, mixolydian, melodic_minor |
| Blues/Rock | blues, minor_pentatonic, mixolydian |
| Spanish/Flamenco | phrygian, harmonic_minor |
| Ambient/Ethereal | lydian, major |
| Dark/Tense | locrian, phrygian |

---

## Scale Degrees

When using the `degrees` pattern type, notes are referenced by their position in the current scale.

### Degree Numbers

| Degree | Name | Function |
|--------|------|----------|
| 1 | Tonic | Home, resolution |
| 2 | Supertonic | Passing, tension |
| 3 | Mediant | Color, mode character |
| 4 | Subdominant | Pre-dominant |
| 5 | Dominant | Strong tension |
| 6 | Submediant | Color, relative minor/major |
| 7 | Leading tone | Strong pull to 1 |
| 8 | Octave | Same as 1, higher |

### Examples by Key

**C major:**
- 1=C, 2=D, 3=E, 4=F, 5=G, 6=A, 7=B

**A minor:**
- 1=A, 2=B, 3=C, 4=D, 5=E, 6=F, 7=G

**G mixolydian:**
- 1=G, 2=A, 3=B, 4=C, 5=D, 6=E, 7=F (note: F natural, not F#)

### Using Degrees

```json
{
  "settings": { "key": "C major" },
  "patterns": {
    "scale_run": {
      "degrees": [1, 2, 3, 4, 5, 4, 3, 2, 1],
      "rhythm": ["8", "8", "8", "8", "q", "8", "8", "8", "h"]
    }
  }
}
```

---

## Chord Theory

### Triads

| Type | Symbol | Intervals | Sound |
|------|--------|-----------|-------|
| Major | C, Cmaj | 1-3-5 | Bright, stable |
| Minor | Cm, Cmin | 1-b3-5 | Dark, sad |
| Diminished | Cdim | 1-b3-b5 | Tense, unstable |
| Augmented | Caug, C+ | 1-3-#5 | Mysterious, unstable |

### Seventh Chords

| Type | Symbol | Intervals | Sound |
|------|--------|-----------|-------|
| Major 7 | Cmaj7 | 1-3-5-7 | Jazzy, sophisticated |
| Dominant 7 | C7 | 1-3-5-b7 | Bluesy, tension |
| Minor 7 | Cm7 | 1-b3-5-b7 | Smooth, mellow |
| Half-diminished | Cm7b5 | 1-b3-b5-b7 | Jazz minor ii |
| Diminished 7 | Cdim7 | 1-b3-b5-bb7 | Very tense, transitional |
| Minor-major 7 | CmMaj7 | 1-b3-5-7 | Mysterious, film noir |

### Extended Chords

| Type | Symbol | Intervals | Character |
|------|--------|-----------|-----------|
| 9th | C9 | 1-3-5-b7-9 | Full, soulful |
| Major 9 | Cmaj9 | 1-3-5-7-9 | Lush, dreamy |
| Minor 9 | Cm9 | 1-b3-5-b7-9 | Smooth jazz |
| 11th | C11 | 1-3-5-b7-9-11 | Suspended feel |
| 13th | C13 | 1-3-5-b7-9-11-13 | Very full, jazzy |

### Suspended Chords

| Type | Symbol | Intervals | Character |
|------|--------|-----------|-----------|
| Sus2 | Csus2 | 1-2-5 | Open, ambiguous |
| Sus4 | Csus4 | 1-4-5 | Tension, wants to resolve |

---

## Common Chord Progressions

### By Genre

**Pop/Rock:**
- I-V-vi-IV: `["C", "G", "Am", "F"]`
- I-IV-V-I: `["C", "F", "G", "C"]`
- vi-IV-I-V: `["Am", "F", "C", "G"]`

**Jazz:**
- ii-V-I: `["Dm7", "G7", "Cmaj7"]`
- I-vi-ii-V: `["Cmaj7", "Am7", "Dm7", "G7"]`
- iii-vi-ii-V: `["Em7", "Am7", "Dm7", "G7"]`

**Blues:**
- 12-bar: `["C7", "C7", "C7", "C7", "F7", "F7", "C7", "C7", "G7", "F7", "C7", "G7"]`

**Neo-Soul:**
- `["Dm9", "G13", "Cmaj9", "Am9"]`
- `["Fmaj7", "Em7", "Dm7", "Cmaj7"]`

**Ambient:**
- `["Cmaj7", "Am9", "Fmaj7#11", "Gsus4"]`

### Progression Patterns in EtherScore

```json
{
  "patterns": {
    "pop_progression": {
      "chords": ["C:w", "G:w", "Am:w", "F:w"]
    },
    "jazz_ii_v_i": {
      "chords": ["Dm7:h", "G7:h", "Cmaj7:w"]
    },
    "neo_soul": {
      "chords": ["Dm9:h", "G13:h", "Cmaj9:h", "Am7:h"]
    }
  }
}
```

---

## Diatonic Chords

Chords built from scale degrees (in major):

| Degree | Chord | Function |
|--------|-------|----------|
| I | Major | Tonic (home) |
| ii | Minor | Pre-dominant |
| iii | Minor | Tonic substitute |
| IV | Major | Subdominant |
| V | Major (often V7) | Dominant |
| vi | Minor | Relative minor |
| vii° | Diminished | Leading tone |

**In C major:**
- I = C, ii = Dm, iii = Em, IV = F, V = G, vi = Am, vii° = Bdim

**In A minor:**
- i = Am, ii° = Bdim, III = C, iv = Dm, v = Em (or V = E for harmonic), VI = F, VII = G

---

## Melody Writing Tips

### Consonance and Dissonance

**Strong beats (beats 1 and 3):**
- Prefer chord tones (1, 3, 5)
- Creates stability

**Weak beats (beats 2 and 4):**
- Can use passing tones
- Non-chord tones are acceptable

### Melodic Motion

| Type | Description | Example |
|------|-------------|---------|
| Step | Adjacent scale degrees | C to D |
| Skip | Third interval | C to E |
| Leap | Fourth or larger | C to G |

**Guidelines:**
- Balance steps and skips
- After a leap, often move by step in opposite direction
- Avoid multiple large leaps in same direction

### Using Scale Degrees for Melody

```json
{
  "settings": { "key": "C major" },
  "patterns": {
    "balanced_melody": {
      "degrees": [1, 2, 3, 5, 4, 3, 2, 1],
      "rhythm": ["q", "8", "8", "h", "q", "8", "8", "w"]
    }
  }
}
```

---

## Key Changes

Change keys between sections:

```json
{
  "settings": { "key": "C major" },
  "sections": {
    "verse": {
      "bars": 8,
      "key": "C major",
      "tracks": { ... }
    },
    "chorus": {
      "bars": 8,
      "key": "G major",
      "tracks": { ... }
    },
    "bridge": {
      "bars": 4,
      "key": "A minor",
      "tracks": { ... }
    }
  }
}
```

### Common Modulations

| From | To | Relationship |
|------|-----|--------------|
| C major | G major | Up a fifth (bright) |
| C major | F major | Up a fourth (warmer) |
| C major | A minor | Relative minor |
| A minor | C major | Relative major |
| C major | Db major | Half-step up (dramatic) |
| C major | E major | Up a major third (uplifting) |

---

## Rhythm and Time

### Time Signatures

| Signature | Feel | Common Genres |
|-----------|------|---------------|
| 4/4 | Standard, driving | Pop, rock, electronic |
| 3/4 | Waltz, flowing | Classical, folk |
| 6/8 | Compound, rolling | Ballads, folk, rock |
| 12/8 | Blues shuffle | Blues, slow jams |
| 5/4 | Odd, progressive | Jazz, prog rock |
| 7/8 | Asymmetric | World, prog |

### Rhythmic Feel

**Straight:** Equal divisions
```json
{ "notes": ["C4:8", "D4:8", "E4:8", "F4:8"] }
```

**Swing:** Triplet-based shuffle
```json
{
  "settings": { "swing": 0.5 }
}
```

---

## Theory Engine API (v0.9.7)

EtherDAW provides a programmatic theory engine for LLMs and tools. Import from `etherdaw/theory`.

### Quick Start

```typescript
import { scales, chords, intervals, progressions, validate } from 'etherdaw/theory';

// Scales
scales.notes('C', 'major');           // ['C4', 'D4', 'E4', ...]
scales.degree('C', 'major', 5);       // 'G4'
scales.inKey('F#', 'C', 'major');     // false

// Chords
chords.identify(['C4', 'E4', 'G4']);  // 'C'
chords.quality(['C4', 'E4', 'G4']);   // 'major'
chords.build('A', 'min7', 3);         // ['A3', 'C4', 'E4', 'G4']

// Intervals
intervals.between('C4', 'G4');        // 'P5'
intervals.transpose('C4', 'P5');      // 'G4'
intervals.invert('P5');               // 'P4'
intervals.semitones('M3');            // 4

// Progressions
progressions.get('ii-V-I', 'C major'); // ['Dmin', 'Gmaj', 'Cmaj']

// Validation
validate.voiceLeading([...]);         // Check for parallel fifths
validate.inKey(['C4', 'F#4'], 'C major'); // [{note: 'F#4', ...}]
```

### Scales API

| Function | Description | Example |
|----------|-------------|---------|
| `scales.notes(root, scale, octave?)` | Get all notes in scale | `scales.notes('C', 'major')` |
| `scales.degree(root, scale, deg, oct?)` | Get scale degree | `scales.degree('C', 'major', 5)` → `'G4'` |
| `scales.inKey(note, root, scale)` | Check if note in scale | `scales.inKey('F#', 'C', 'major')` → `false` |
| `scales.snap(note, root, scale)` | Snap to nearest scale note | `scales.snap('F#4', 'C', 'major')` |
| `scales.relative(root, mode)` | Get relative key | `scales.relative('A', 'minor')` → `{root: 'C', mode: 'major'}` |
| `scales.parallel(root, mode)` | Get parallel key | `scales.parallel('C', 'major')` → `{root: 'C', mode: 'minor'}` |

### Chord Identification API

| Function | Description | Example |
|----------|-------------|---------|
| `chords.identify(notes)` | Identify chord from notes | `chords.identify(['C4','E4','G4'])` → `'C'` |
| `chords.quality(notes)` | Get quality description | `chords.quality(['A4','C5','E5'])` → `'minor'` |
| `chords.analyze(notes)` | Detailed analysis | Returns `{root, third, fifth, seventh, extensions}` |
| `chords.build(root, quality, oct?)` | Build chord | `chords.build('G', '7', 3)` → `['G3','B3','D4','F4']` |
| `chords.suggest(notes)` | Suggest interpretations | Returns array of possible chord symbols |

### Intervals API

| Function | Description | Example |
|----------|-------------|---------|
| `intervals.between(p1, p2)` | Interval between pitches | `intervals.between('C4', 'G4')` → `'P5'` |
| `intervals.transpose(pitch, int)` | Transpose by interval | `intervals.transpose('C4', 'M3')` → `'E4'` |
| `intervals.semitones(interval)` | Get semitone count | `intervals.semitones('P5')` → `7` |
| `intervals.invert(interval)` | Invert interval | `intervals.invert('M3')` → `'m6'` |
| `intervals.name(interval)` | Full name | `intervals.name('P5')` → `'perfect fifth'` |
| `intervals.isConsonant(interval)` | Check consonance | `intervals.isConsonant('TT')` → `false` |

**Interval Names:** P1, m2, M2, m3, M3, P4, A4/TT/d5, P5, m6, M6, m7, M7, P8, m9, M9, etc.

### Validation API

```typescript
// Voice leading validation
const issues = validate.voiceLeading([
  { beat: 0, voices: ['C4', 'E4', 'G4', 'C5'] },
  { beat: 4, voices: ['D4', 'F4', 'A4', 'D5'] }
]);
// Returns issues: parallel-fifths, parallel-octaves, voice-crossing, etc.

// Key validation
validate.inKey(['C4', 'E4', 'F#4'], 'C major');
// Returns: [{type: 'out-of-key', message: 'F# is not in C major', ...}]

// Quick parallel check
validate.hasParallels(voices1, voices2);  // true/false

// Summary
validate.summarize(issues);  // {errors: 0, warnings: 2, info: 1, byType: {...}}
```

**Issue Types:** `parallel-fifths`, `parallel-octaves`, `voice-crossing`, `excessive-spacing`, `range-low`, `range-high`, `out-of-key`, `doubled-leading-tone`

### Progressions API

```typescript
progressions.get('ii-V-I', 'C major');     // ['Dmin', 'Gmaj', 'Cmaj']
progressions.get('I-V-vi-IV', 'G major');  // ['Gmaj', 'Dmaj', 'Emin', 'Cmaj']
progressions.get('ii-V-I-7', 'C major');   // ['Dm7', 'G7', 'Cmaj7']
progressions.available();                   // List all progression names
```

**Built-in:** I-IV-V, I-V-vi-IV, ii-V-I, 12-bar-blues, rhythm-a, autumn-leaves, ii-V-I-7, neo-soul, gospel-extended, backdoor, tritone-sub, lady-bird, coltrane-cycle

---

## See Also

- [PATTERNS.md](PATTERNS.md) - Pattern syntax
- [ETHERSCORE_FORMAT.md](ETHERSCORE_FORMAT.md) - Complete format specification
- [EXAMPLES.md](EXAMPLES.md) - Example compositions
