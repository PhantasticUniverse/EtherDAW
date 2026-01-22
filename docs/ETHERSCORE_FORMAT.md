# EtherScore Format Specification

EtherScore is a JSON-based music composition format designed for both humans and LLMs to create music programmatically. This document provides the complete specification.

## Document Structure

An EtherScore document has the following top-level structure:

```json
{
  "meta": { ... },
  "settings": { ... },
  "instruments": { ... },
  "patterns": { ... },
  "sections": { ... },
  "arrangement": [ ... ]
}
```

## Meta (Optional)

Metadata about the composition:

```json
{
  "meta": {
    "title": "My Composition",
    "composer": "Artist Name",
    "mood": "Energetic, Uplifting",
    "genre": "Electronic",
    "description": "A brief description of the piece",
    "tags": ["electronic", "dance", "synth"]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Name of the composition |
| `composer` | string | Creator's name |
| `mood` | string | Emotional character |
| `genre` | string | Musical genre |
| `description` | string | Brief description |
| `tags` | string[] | Searchable tags |

## Settings (Required)

Global playback settings:

```json
{
  "settings": {
    "tempo": 120,
    "key": "C major",
    "timeSignature": "4/4",
    "swing": 0
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tempo` | number | **required** | BPM (beats per minute) |
| `key` | string | "C major" | Key signature (e.g., "G minor", "F# major") |
| `timeSignature` | string | "4/4" | Time signature |
| `swing` | number | 0 | Swing amount (0-1) |

### Key Formats
- Major: `"C major"`, `"F# major"`, `"Bb major"`
- Minor: `"A minor"`, `"C# minor"`, `"Eb minor"`
- Modes: `"D dorian"`, `"E phrygian"`, `"F lydian"`, `"G mixolydian"`, `"A locrian"`

## Instruments

Define the instruments used in your composition:

```json
{
  "instruments": {
    "lead": {
      "preset": "fm_epiano",
      "volume": -3,
      "pan": 0,
      "effects": [
        { "type": "reverb", "wet": 0.3, "options": { "decay": 2 } }
      ]
    },
    "bass": {
      "preset": "synth_bass",
      "volume": 0
    },
    "drums": {
      "preset": "drums:909",
      "volume": -2
    }
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `preset` | string | **required** | Instrument preset name (see [PRESETS.md](PRESETS.md)) |
| `volume` | number | 0 | Volume in dB (-60 to +6) |
| `pan` | number | 0 | Stereo pan (-1 = left, +1 = right) |
| `effects` | Effect[] | [] | Effects chain (see [EFFECTS.md](EFFECTS.md)) |
| `options` | object | {} | Preset-specific options |

### Drum Kit Presets
For drums, use the format `drums:KITNAME`:
- `drums:808` - TR-808 style (deep, boomy)
- `drums:909` - TR-909 style (punchy, aggressive)
- `drums:acoustic` - Natural acoustic drums
- `drums:lofi` - Vintage, dusty character

## Patterns

Patterns are reusable musical phrases. Each pattern can contain notes, chords, arpeggios, drums, or rests.

### Note Patterns

```json
{
  "patterns": {
    "melody": {
      "notes": ["C4:q", "E4:8", "G4:8", "C5:h"]
    }
  }
}
```

#### Note Syntax
`<pitch><octave>:<duration>[.]`

- **Pitch**: C, D, E, F, G, A, B with optional accidentals (#, b)
- **Octave**: 0-8 (4 = middle C)
- **Duration**: See duration codes below
- **Dot**: Add `.` for dotted notes (1.5x duration)

| Code | Name | Beats |
|------|------|-------|
| `w` | Whole | 4 |
| `h` | Half | 2 |
| `q` | Quarter | 1 |
| `8` | Eighth | 0.5 |
| `16` | Sixteenth | 0.25 |
| `32` | Thirty-second | 0.125 |

Examples:
- `C4:q` - Middle C, quarter note
- `F#5:8.` - F# in octave 5, dotted eighth
- `Bb3:h` - Bb below middle C, half note

#### Articulation (v0.3)
Add articulation markers after duration:
- `*` - Staccato (30% gate, short detached)
- `~` - Legato (110% gate, connected)
- `>` - Accent (+0.2 velocity)
- `^` - Marcato (staccato + accent)

Examples: `C4:q*` (staccato), `D4:h~` (legato), `E4:8>` (accent)

#### Expression Modifiers (v0.4)
Fine-grained per-note control:
- `@0.8` - Velocity (0.0-1.0)
- `?0.7` - Probability (70% chance to play)
- `+10ms` / `-5ms` - Timing offset
- `~>` - Portamento (glide to next note)

Examples: `C4:q@0.8` (80% velocity), `D4:8?0.5` (50% chance), `E4:q*@0.9?0.5-5ms` (combined)

#### Rests
Use `r` for rests: `"r:q"` (quarter rest), `"r:h"` (half rest)

### Chord Patterns

```json
{
  "patterns": {
    "progression": {
      "chords": ["Cmaj7:w", "Am7:h", "Dm7:h", "G7:w"]
    }
  }
}
```

#### Chord Syntax
`<root>[quality][/bass]:<duration>`

**Qualities:**
- Major: `C`, `Cmaj`, `CM`
- Minor: `Cm`, `Cmin`, `C-`
- Seventh: `C7`, `Cmaj7`, `Cm7`, `Cdim7`
- Extended: `C9`, `C11`, `C13`, `Cmaj9`
- Altered: `C7b9`, `C7#11`, `Calt`
- Suspended: `Csus2`, `Csus4`
- Added tones: `Cadd9`, `C6`
- Slash chords: `C/E`, `Am7/G`

### Arpeggio Patterns

```json
{
  "patterns": {
    "arp": {
      "arpeggio": {
        "chord": "Cmaj7",
        "duration": "16",
        "mode": "updown",
        "octaves": 2,
        "gate": 0.8
      }
    }
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `chord` | string | **required** | Chord to arpeggiate |
| `duration` | string | **required** | Note duration |
| `mode` | string | "up" | Arpeggio direction |
| `octaves` | number | 1 | Octave span |
| `gate` | number | 0.8 | Note length ratio (0.1-1.0) |
| `steps` | number | auto | Total steps to generate |

**Modes:** `up`, `down`, `updown`, `downup`, `random`

### Drum Patterns

Two syntaxes available:

#### Step Notation
```json
{
  "patterns": {
    "beat": {
      "drums": {
        "kit": "909",
        "steps": "x...x...x...x...",
        "stepDuration": "16"
      }
    }
  }
}
```

- `x` = hit
- `.` = rest
- `>` = accent (louder hit)

#### Hit Array
```json
{
  "patterns": {
    "beat": {
      "drums": {
        "kit": "909",
        "hits": [
          { "drum": "kick", "time": "0" },
          { "drum": "snare", "time": "q", "velocity": 0.8 },
          { "drum": "hihat", "time": "8", "velocity": 0.5 }
        ]
      }
    }
  }
}
```

**Available drums:** `kick`, `snare`, `clap`, `hihat`, `hihat_open`, `tom_hi`, `tom_mid`, `tom_lo`, `crash`, `ride`, `rim`, `cowbell`, `shaker`

**Time notation:**
- `"0"` - Beat 1
- `"8"` - After eighth note
- `"q"` - Beat 2 (quarter)
- `"h"` - Beat 3 (half)
- `"q+8"` - Beat 2 + eighth
- `"h+q"` - Beat 4

### Euclidean Rhythms

Generate algorithmic patterns:

```json
{
  "patterns": {
    "clave": {
      "euclidean": {
        "hits": 3,
        "steps": 8,
        "rotation": 0,
        "duration": "8",
        "drum": "rim"
      }
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `hits` | number | Number of hits to distribute |
| `steps` | number | Total steps in pattern |
| `rotation` | number | Rotate pattern start |
| `duration` | string | Step duration |
| `drum` | string | Drum sound (for drum patterns) |
| `pitch` | string | Pitch (for melodic patterns) |

Common euclidean patterns:
- 3 hits in 8 steps = Tresillo
- 5 hits in 8 steps = Cinquillo
- 7 hits in 12 steps = West African bell

### Scale Degree Patterns

Reference notes by scale degree:

```json
{
  "patterns": {
    "scale_melody": {
      "degrees": [1, 3, 5, 8, 5, 3, 1],
      "rhythm": ["q", "q", "q", "h", "q", "q", "w"]
    }
  }
}
```

Degrees are 1-indexed relative to the current key:
- In C major: 1=C, 2=D, 3=E, 4=F, 5=G, 6=A, 7=B
- In A minor: 1=A, 2=B, 3=C, 4=D, 5=E, 6=F, 7=G

#### Enhanced Degrees (v0.3)
Use inline duration and modifiers: `<degree>[#|b][+|-]:<duration>`
- `7#:q` - Raised 7th (leading tone), quarter
- `3b:8` - Lowered 3rd, eighth
- `3+:h` - 3rd, octave up
- `5-:q` - 5th, octave down

```json
{
  "patterns": {
    "chromatic": {
      "degrees": ["1:q", "7#:8", "1+:8", "5:h"]
    }
  }
}
```

### Scale Constraint (v0.3)

Automatically snap out-of-key notes to the nearest scale tone:

```json
{
  "patterns": {
    "melody": {
      "notes": ["C4:q", "D4:q", "F#4:q", "G4:q"],
      "constrainToScale": true
    }
  }
}
```
With key "C major", the F#4 would snap to F4 or G4.

### Velocity Envelopes (v0.4)

Apply dynamic curves across patterns:

```json
{
  "patterns": {
    "crescendo_line": {
      "notes": ["C4:q", "D4:q", "E4:q", "F4:q"],
      "velocityEnvelope": "crescendo"
    }
  }
}
```

**Presets:** `crescendo`, `diminuendo`, `swell`, `accent_first`, `accent_downbeats`

**Custom arrays:** `"velocityEnvelope": [0.5, 0.7, 0.9, 1.0]`

### Pattern Transforms (v0.3)

Generate new patterns by transforming existing ones:

```json
{
  "patterns": {
    "theme": {
      "notes": ["C4:q", "E4:q", "G4:h"]
    },
    "theme_inverted": {
      "transform": {
        "source": "theme",
        "operation": "invert",
        "params": { "axis": "E4" }
      }
    }
  }
}
```

**Operations:**
| Operation | Description | Parameters |
|-----------|-------------|------------|
| `invert` | Flip melodic contour | `axis`: pitch to invert around |
| `retrograde` | Reverse note order | - |
| `augment` | Stretch rhythms | `factor`: multiplier (default: 2) |
| `diminish` | Compress rhythms | `factor`: multiplier (default: 0.5) |
| `transpose` | Shift pitches | `semitones`: +/- semitones |
| `octave` | Shift by octaves | `octaves`: +/- octaves |

## Sections

Sections combine patterns into musical passages:

```json
{
  "sections": {
    "verse": {
      "bars": 8,
      "tracks": {
        "lead": { "pattern": "melody", "repeat": 2 },
        "bass": { "pattern": "bassline", "repeat": 8 },
        "drums": { "pattern": "beat", "repeat": 8 }
      },
      "tempo": 110,
      "key": "A minor"
    }
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bars` | number | **required** | Length in bars |
| `tracks` | object | **required** | Track assignments |
| `tempo` | number | inherited | Override tempo |
| `key` | number | inherited | Override key |

### Track Options

```json
{
  "tracks": {
    "instrument_name": {
      "pattern": "pattern_name",
      "patterns": ["pat1", "pat2"],
      "repeat": 4,
      "velocity": 0.8,
      "octave": 1,
      "transpose": -2,
      "humanize": 0.02,
      "mute": false
    }
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pattern` | string | - | Single pattern to use |
| `patterns` | string[] | - | Pattern sequence |
| `repeat` | number | 1 | Times to repeat |
| `velocity` | number | 0.8 | Note velocity (0-1) |
| `octave` | number | 0 | Octave shift |
| `transpose` | number | 0 | Semitone transposition |
| `humanize` | number | 0 | Timing randomization |
| `mute` | boolean | false | Mute this track |

## Arrangement

The arrangement is an ordered list of section names:

```json
{
  "arrangement": [
    "intro",
    "verse",
    "chorus",
    "verse",
    "chorus",
    "bridge",
    "chorus",
    "outro"
  ]
}
```

Sections play in order. Repeat sections by listing them multiple times.

## Complete Example

```json
{
  "meta": {
    "title": "Simple Loop",
    "genre": "Electronic"
  },
  "settings": {
    "tempo": 120,
    "key": "C major"
  },
  "instruments": {
    "synth": { "preset": "fm_epiano", "volume": -3 },
    "bass": { "preset": "fm_bass", "volume": 0 },
    "drums": { "preset": "drums:909", "volume": -2 }
  },
  "patterns": {
    "chords": { "chords": ["Cmaj7:h", "Am7:h", "Fmaj7:h", "G7:h"] },
    "bass": { "notes": ["C2:q", "r:q", "C2:8", "C2:8", "G2:q"] },
    "beat": {
      "drums": {
        "kit": "909",
        "hits": [
          { "drum": "kick", "time": "0" },
          { "drum": "snare", "time": "q" },
          { "drum": "kick", "time": "h" },
          { "drum": "snare", "time": "h+q" }
        ]
      }
    }
  },
  "sections": {
    "main": {
      "bars": 4,
      "tracks": {
        "synth": { "pattern": "chords", "repeat": 2 },
        "bass": { "pattern": "bass", "repeat": 4 },
        "drums": { "pattern": "beat", "repeat": 4 }
      }
    }
  },
  "arrangement": ["main", "main"]
}
```

## See Also

- [PRESETS.md](PRESETS.md) - Available instrument presets
- [PATTERNS.md](PATTERNS.md) - Pattern syntax details
- [EFFECTS.md](EFFECTS.md) - Audio effects reference
- [THEORY.md](THEORY.md) - Music theory helpers
- [QUICKSTART.md](QUICKSTART.md) - Getting started guide
- [EXAMPLES.md](EXAMPLES.md) - Example compositions
