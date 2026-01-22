# Pattern Syntax Reference

Patterns are the building blocks of EtherScore compositions. This document provides detailed syntax for all pattern types.

## Pattern Types

| Type | Use Case |
|------|----------|
| `notes` | Single-note melodies and bass lines |
| `chords` | Chord progressions |
| `arpeggio` | Arpeggiated chord patterns |
| `drums` | Drum/percussion patterns |
| `euclidean` | Algorithmic rhythm generation |
| `degrees` | Scale-degree based melodies |
| `transform` | Generate from another pattern (v0.3) |
| `constrainToScale` | Auto-correct out-of-key notes (v0.3) |

---

## Note Patterns

### Basic Syntax
```
<pitch><octave>:<duration>[.][articulation]
```

### Pitch
| Component | Values | Examples |
|-----------|--------|----------|
| Note name | C, D, E, F, G, A, B | `C`, `F`, `A` |
| Accidental | # (sharp), b (flat) | `C#`, `Bb`, `F#` |
| Octave | 0-8 (4 = middle C) | `C4`, `A3`, `G5` |

### Duration Codes
| Code | Name | Beats (at 4/4) |
|------|------|----------------|
| `w` | Whole note | 4 |
| `h` | Half note | 2 |
| `q` | Quarter note | 1 |
| `8` | Eighth note | 0.5 |
| `16` | Sixteenth note | 0.25 |
| `32` | Thirty-second note | 0.125 |

### Dotted Notes
Add `.` after duration for 1.5x length:
- `q.` = dotted quarter (1.5 beats)
- `h.` = dotted half (3 beats)
- `8.` = dotted eighth (0.75 beats)

### Articulation (v0.3)
Add articulation marker after duration (and dot if present):

| Symbol | Name | Effect |
|--------|------|--------|
| `*` | Staccato | 30% gate (short, detached) |
| `~` | Legato | 110% gate (connected, smooth) |
| `>` | Accent | +0.2 velocity boost (louder) |
| `^` | Marcato | Staccato + accent (short, loud) |

**Examples:**
- `C4:q*` - Staccato quarter note (plays for 0.3 beats, advances 1 beat)
- `D4:h~` - Legato half note (plays for 2.2 beats, slightly overlapping)
- `E4:8>` - Accented eighth note (louder attack)
- `F#3:q^` - Marcato quarter note (short and accented)
- `A4:h.*` - Dotted half, staccato (3 beats duration, plays 0.9 beats)

### Expression Modifiers (v0.4)
Add expression modifiers after articulation for fine-grained control:

| Modifier | Syntax | Description |
|----------|--------|-------------|
| Velocity | `@0.8` | Per-note velocity (0.0-1.0) |
| Probability | `?0.7` | Chance to play (0.0-1.0) |
| Timing offset | `+10ms` / `-5ms` | Shift timing forward/backward |
| Portamento | `~>` | Glide to next note |

**Examples:**
- `C4:q@0.8` - Quarter note at 80% velocity
- `D4:8?0.5` - 50% chance to play this eighth note
- `E4:q+10ms` - Slightly late (10ms after beat)
- `F4:q-5ms` - Slightly early (5ms before beat)
- `G4:h~>` - Glide from this note to the next
- `C4:q*@0.9?0.5-5ms` - Combined: staccato, 90% velocity, 50% probability, 5ms early

**Combining modifiers:** Apply in order after duration/articulation:
```
<pitch><octave>:<duration>[.][articulation][@velocity][?probability][±timing][~>]
```

### Rests
Use `r` as the pitch for rests:
- `r:q` - Quarter rest
- `r:h` - Half rest
- `r:8` - Eighth rest

### Examples
```json
{
  "patterns": {
    "melody": {
      "notes": [
        "C4:q",     // Middle C, quarter note
        "E4:8",     // E above middle C, eighth
        "G4:8",     // G, eighth
        "C5:h.",    // C octave up, dotted half
        "r:q",      // Quarter rest
        "B4:q",     // B, quarter
        "A4:h"      // A, half note
      ]
    },
    "staccato_melody": {
      "notes": ["C4:8*", "D4:8*", "E4:8*", "F4:8*", "G4:q>"]
    },
    "bass": {
      "notes": ["C2:8", "C2:8", "r:8", "G2:8", "r:q", "E2:8", "F2:8"]
    }
  }
}
```

---

## Chord Patterns

### Basic Syntax
```
<root>[quality][extensions][/bass]:<duration>[.][articulation]
```

Articulation markers (`*`, `~`, `>`, `^`) work the same as with notes.

### Root Notes
Any pitch name with optional accidental:
`C`, `C#`, `Db`, `D`, `D#`, `Eb`, `E`, `F`, `F#`, `Gb`, `G`, `G#`, `Ab`, `A`, `A#`, `Bb`, `B`

### Chord Qualities

#### Triads
| Symbol | Name | Intervals |
|--------|------|-----------|
| (none) or `maj` | Major | 1-3-5 |
| `m` or `min` | Minor | 1-b3-5 |
| `dim` | Diminished | 1-b3-b5 |
| `aug` or `+` | Augmented | 1-3-#5 |

#### Seventh Chords
| Symbol | Name | Intervals |
|--------|------|-----------|
| `7` | Dominant 7th | 1-3-5-b7 |
| `maj7` or `M7` | Major 7th | 1-3-5-7 |
| `m7` or `min7` | Minor 7th | 1-b3-5-b7 |
| `dim7` | Diminished 7th | 1-b3-b5-bb7 |
| `m7b5` | Half-diminished | 1-b3-b5-b7 |
| `mMaj7` | Minor-major 7th | 1-b3-5-7 |

#### Extended Chords
| Symbol | Name |
|--------|------|
| `9` | Dominant 9th |
| `maj9` | Major 9th |
| `m9` | Minor 9th |
| `11` | Dominant 11th |
| `13` | Dominant 13th |
| `add9` | Add 9 (no 7th) |
| `6` | Major 6th |
| `m6` | Minor 6th |

#### Suspended Chords
| Symbol | Name | Intervals |
|--------|------|-----------|
| `sus2` | Suspended 2nd | 1-2-5 |
| `sus4` | Suspended 4th | 1-4-5 |
| `7sus4` | 7th sus4 | 1-4-5-b7 |

#### Altered Chords
| Symbol | Name |
|--------|------|
| `7b9` | 7th flat 9 |
| `7#9` | 7th sharp 9 |
| `7#11` | 7th sharp 11 |
| `7b13` | 7th flat 13 |
| `alt` | Altered dominant |

### Slash Chords (Inversions)
Add `/bass` for a specific bass note:
- `C/E` - C major with E in bass (1st inversion)
- `Am7/G` - A minor 7 with G in bass
- `F/C` - F major with C in bass (2nd inversion)

### Examples
```json
{
  "patterns": {
    "jazz_progression": {
      "chords": ["Dm7:h", "G7:h", "Cmaj7:h", "Am7:h"]
    },
    "pop_progression": {
      "chords": ["C:w", "Am:w", "F:w", "G:w"]
    },
    "complex_jazz": {
      "chords": ["Dm9:q", "G7#11:q", "Cmaj9:h", "Fm7:q", "Bb7:q", "Ebmaj7:h"]
    },
    "slash_chords": {
      "chords": ["C/E:h", "F/A:h", "G/B:h", "C:h"]
    },
    "staccato_stabs": {
      "chords": ["Dm7:8*", "r:8", "Dm7:8*", "r:8", "G7:q>", "r:q"]
    }
  }
}
```

---

## Arpeggio Patterns

Automatically break chords into note sequences.

### Configuration
```json
{
  "arpeggio": {
    "chord": "Cmaj7",
    "duration": "16",
    "mode": "updown",
    "octaves": 2,
    "gate": 0.8,
    "steps": 16
  }
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chord` | string | required | Chord to arpeggiate |
| `duration` | string | required | Note duration ("16", "8", "q") |
| `mode` | string | "up" | Pattern direction |
| `octaves` | number | 1 | Octave span (1-3) |
| `gate` | number | 0.8 | Note length ratio (0.1-1.0) |
| `steps` | number | auto | Total steps to generate |

### Modes

| Mode | Description | Example (C-E-G) |
|------|-------------|-----------------|
| `up` | Ascending | C-E-G-C-E-G... |
| `down` | Descending | G-E-C-G-E-C... |
| `updown` | Up then down | C-E-G-E-C-E-G... |
| `downup` | Down then up | G-E-C-E-G-E-C... |
| `random` | Random order | E-G-C-E-C-G... |

### Examples
```json
{
  "patterns": {
    "simple_arp": {
      "arpeggio": {
        "chord": "Am7",
        "duration": "8",
        "mode": "up"
      }
    },
    "wide_arp": {
      "arpeggio": {
        "chord": "Cmaj9",
        "duration": "16",
        "mode": "updown",
        "octaves": 2,
        "gate": 0.5
      }
    },
    "random_arp": {
      "arpeggio": {
        "chord": "Dm7",
        "duration": "16",
        "mode": "random",
        "steps": 32
      }
    }
  }
}
```

---

## Velocity Envelopes (v0.4)

Apply dynamic velocity curves across an entire pattern:

### Presets
```json
{
  "patterns": {
    "crescendo_melody": {
      "notes": ["C4:q", "D4:q", "E4:q", "F4:q", "G4:q", "A4:q", "B4:q", "C5:q"],
      "velocityEnvelope": "crescendo"
    }
  }
}
```

| Preset | Effect |
|--------|--------|
| `crescendo` | Gradually increase velocity (soft to loud) |
| `diminuendo` | Gradually decrease velocity (loud to soft) |
| `swell` | Increase then decrease (< shape) |
| `accent_first` | First note accented, others normal |
| `accent_downbeats` | Accent on downbeats (1, 3 in 4/4) |

### Custom Arrays
Define exact velocity for each note:

```json
{
  "patterns": {
    "custom_dynamics": {
      "notes": ["C4:q", "E4:q", "G4:q", "C5:q"],
      "velocityEnvelope": [0.5, 0.6, 0.8, 1.0]
    }
  }
}
```

The array length should match the number of notes. Values are multiplied with track velocity.

---

## Drum Patterns

Two syntax options: step notation or hit arrays.

### Step Notation
Quick pattern entry using characters:

```json
{
  "drums": {
    "kit": "909",
    "steps": "x...x...x...x...",
    "stepDuration": "16"
  }
}
```

| Character | Meaning |
|-----------|---------|
| `x` | Hit (normal velocity) |
| `.` | Rest |
| `>` | Accent (louder) |
| `o` | Ghost note (softer) |

### Multi-Line Step Notation (v0.5)

Write full drum beats visually with the `lines` property - each drum type on its own line:

```json
{
  "drums": {
    "kit": "909",
    "lines": {
      "kick":  "x...x...x...x...",
      "hihat": "..x...x...x...x.",
      "clap":  "....x.......x..."
    }
  }
}
```

All lines must be the same length. Each line plays its drum on the same grid. This is cleaner than hit arrays for complex beats.

**Example - 909 house beat:**
```json
{
  "house_full": {
    "drums": {
      "kit": "909",
      "lines": {
        "kick":       "x...x...x...x...",
        "clap":       "....x.......x...",
        "hihat":      "..x...x...x...x.",
        "hihat_open": "..............x."
      }
    }
  }
}
```

### Hit Array
Precise timing and velocity control:

```json
{
  "drums": {
    "kit": "909",
    "hits": [
      { "drum": "kick", "time": "0", "velocity": 1.0 },
      { "drum": "hihat", "time": "0", "velocity": 0.6 },
      { "drum": "hihat", "time": "8", "velocity": 0.4 },
      { "drum": "snare", "time": "q", "velocity": 0.9 },
      { "drum": "hihat", "time": "q", "velocity": 0.6 }
    ]
  }
}
```

### Time Notation
| Notation | Beat Position |
|----------|---------------|
| `"0"` | Beat 1 |
| `"8"` | After 1 eighth note |
| `"q"` | Beat 2 (quarter) |
| `"q+8"` | Beat 2 + eighth |
| `"h"` | Beat 3 (half) |
| `"h+8"` | Beat 3 + eighth |
| `"h+q"` | Beat 4 |
| `"h+q+8"` | Beat 4 + eighth |

### Available Drums
| Name | Description |
|------|-------------|
| `kick` | Bass drum |
| `snare` | Snare drum |
| `clap` | Handclap |
| `hihat` | Closed hi-hat |
| `hihat_open` | Open hi-hat |
| `tom_hi` | High tom |
| `tom_mid` | Mid tom |
| `tom_lo` | Low tom |
| `crash` | Crash cymbal |
| `ride` | Ride cymbal |
| `rim` | Rim shot |
| `cowbell` | Cowbell |
| `shaker` | Shaker |

### Examples
```json
{
  "patterns": {
    "basic_beat": {
      "drums": {
        "kit": "909",
        "hits": [
          { "drum": "kick", "time": "0" },
          { "drum": "snare", "time": "q" },
          { "drum": "kick", "time": "h" },
          { "drum": "snare", "time": "h+q" }
        ]
      }
    },
    "four_on_floor": {
      "drums": {
        "kit": "909",
        "hits": [
          { "drum": "kick", "time": "0" },
          { "drum": "kick", "time": "q" },
          { "drum": "kick", "time": "h" },
          { "drum": "kick", "time": "h+q" },
          { "drum": "hihat", "time": "8" },
          { "drum": "hihat", "time": "q+8" },
          { "drum": "hihat", "time": "h+8" },
          { "drum": "hihat", "time": "h+q+8" },
          { "drum": "snare", "time": "q" },
          { "drum": "snare", "time": "h+q" }
        ]
      }
    },
    "step_hihat": {
      "drums": {
        "kit": "808",
        "steps": "x.x.x.x.x.x.x.x.",
        "stepDuration": "16"
      }
    }
  }
}
```

---

## Euclidean Rhythms

Generate algorithmically distributed patterns.

### Configuration
```json
{
  "euclidean": {
    "hits": 5,
    "steps": 8,
    "rotation": 0,
    "duration": "8",
    "drum": "rim"
  }
}
```

### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `hits` | number | Pulses to distribute |
| `steps` | number | Total steps |
| `rotation` | number | Rotate pattern (0 = no rotation) |
| `duration` | string | Step duration |
| `drum` | string | Drum sound (for percussion) |
| `pitch` | string | Note pitch (for melodic) |

### Common Euclidean Patterns
| Hits | Steps | Name | Pattern |
|------|-------|------|---------|
| 3 | 8 | Tresillo | x..x..x. |
| 5 | 8 | Cinquillo | x.xx.xx. |
| 5 | 16 | Bossa nova | x..x...x..x...x. |
| 7 | 12 | West African | x.x.x.x.x.x.x. |
| 7 | 16 | Samba | x..x.x.x..x.x.x. |
| 9 | 16 | Afro-Cuban | x.xx.x.xx.x.x.xx |
| 4 | 12 | 12/8 feel | x..x..x..x.. |

### Examples
```json
{
  "patterns": {
    "tresillo": {
      "euclidean": {
        "hits": 3,
        "steps": 8,
        "duration": "8",
        "drum": "rim"
      }
    },
    "bass_pattern": {
      "euclidean": {
        "hits": 5,
        "steps": 16,
        "duration": "16",
        "pitch": "E2"
      }
    },
    "rotated_clave": {
      "euclidean": {
        "hits": 5,
        "steps": 8,
        "rotation": 2,
        "duration": "8",
        "drum": "cowbell"
      }
    }
  }
}
```

---

## Scale Degree Patterns

Reference notes by their position in the scale.

### Basic Usage
```json
{
  "patterns": {
    "scale_run": {
      "degrees": [1, 2, 3, 4, 5, 6, 7, 8],
      "rhythm": ["8", "8", "8", "8", "8", "8", "8", "8"]
    }
  }
}
```

### Degree Numbers
In any key:
- 1 = Root/tonic
- 2 = Second
- 3 = Third
- 4 = Fourth
- 5 = Fifth
- 6 = Sixth
- 7 = Seventh
- 8 = Octave (root, one octave up)

### Enhanced Degree Syntax (v0.3)
Use inline duration and modifiers: `<degree>[#|b][+|-]:<duration>`

| Modifier | Effect |
|----------|--------|
| `#` | Raise by semitone (e.g., `7#` = leading tone) |
| `b` | Lower by semitone (e.g., `3b` = minor third in major key) |
| `+` | Octave up |
| `-` | Octave down |

**Examples:**
- `5:q` - Fifth degree, quarter note
- `7#:8` - Raised 7th (leading tone), eighth note
- `3b:q` - Lowered 3rd, quarter note
- `1+:h` - Root, octave up, half note
- `5-:q` - Fifth, octave down, quarter note

```json
{
  "patterns": {
    "chromatic_approach": {
      "degrees": ["5:q", "7#:8", "1+:8", "3:h"]
    }
  }
}
```

### Examples
```json
{
  "settings": { "key": "C major" },
  "patterns": {
    "triad": {
      "degrees": [1, 3, 5],
      "rhythm": ["q", "q", "h"]
    },
    "pentatonic": {
      "degrees": [1, 2, 3, 5, 6, 8],
      "rhythm": ["8", "8", "8", "8", "8", "q"]
    }
  }
}
```

---

## Scale Constraint (v0.3)

Automatically snap out-of-key notes to the nearest scale tone:

```json
{
  "settings": { "key": "C major" },
  "patterns": {
    "melody": {
      "notes": ["C4:q", "D4:q", "F#4:q", "G4:q"],
      "constrainToScale": true
    }
  }
}
```

The `F#4` will be snapped to either `F4` or `G4` (nearest scale tone). Useful for LLM-generated compositions to prevent accidental wrong notes.

---

## Pattern Transforms (v0.3)

Generate new patterns by transforming existing ones. Useful for creating variations, inversions, and developments.

### Syntax
```json
{
  "patterns": {
    "theme": {
      "notes": ["C4:q", "E4:q", "G4:q", "E4:q"]
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

### Operations

| Operation | Description | Parameters |
|-----------|-------------|------------|
| `invert` | Flip melodic contour around axis | `axis`: pitch to invert around (default: first note) |
| `retrograde` | Reverse note order | None |
| `augment` | Stretch rhythms | `factor`: multiplier (default: 2 = double) |
| `diminish` | Compress rhythms | `factor`: multiplier (default: 0.5 = halve) |
| `transpose` | Shift pitches | `semitones`: +/- semitones |
| `octave` | Shift by octaves | `octaves`: +/- octaves |

### Examples

**Inversion (flip melody):**
```json
"theme_inverted": {
  "transform": {
    "source": "theme",
    "operation": "invert",
    "params": { "axis": "D4" }
  }
}
```
Original: C4-D4-E4 becomes C4-Bb3-Ab3 (intervals flip)

**Retrograde (backwards):**
```json
"theme_backwards": {
  "transform": {
    "source": "theme",
    "operation": "retrograde"
  }
}
```

**Augmentation (slower):**
```json
"theme_slow": {
  "transform": {
    "source": "theme",
    "operation": "augment",
    "params": { "factor": 2 }
  }
}
```
Quarter notes become half notes

**Transposition:**
```json
"theme_up_fifth": {
  "transform": {
    "source": "theme",
    "operation": "transpose",
    "params": { "semitones": 7 }
  }
}
```

**Chaining transforms:**
Transforms can reference other transformed patterns:
```json
"theme_retrograde_inverted": {
  "transform": {
    "source": "theme_inverted",
    "operation": "retrograde"
  }
}
```

---

## Combining Patterns in Sections

Patterns are assigned to tracks in sections:

```json
{
  "sections": {
    "verse": {
      "bars": 4,
      "tracks": {
        "lead": {
          "pattern": "melody",
          "velocity": 0.8
        },
        "bass": {
          "pattern": "bassline",
          "repeat": 4
        },
        "drums": {
          "patterns": ["beat_intro", "beat_main", "beat_main", "beat_fill"]
        }
      }
    }
  }
}
```

### Parallel Patterns (v0.5)

Use `parallel` when patterns should play simultaneously, not sequentially:

```json
{
  "sections": {
    "main": {
      "bars": 4,
      "tracks": {
        "drums": {
          "parallel": ["kick_pattern", "hihat_pattern", "clap_pattern"],
          "velocity": 0.9
        }
      }
    }
  }
}
```

This is essential for layered drum patterns where kick, hihat, and clap need to play at the same time. Without `parallel`, `patterns: ["a", "b", "c"]` would play a, then b, then c sequentially.

### Pattern Probability (v0.5)

Create variation with probability-based pattern selection:

```json
{
  "tracks": {
    "drums": {
      "pattern": "fill_variation",
      "probability": 0.3,
      "fallback": "drums_main"
    }
  }
}
```

The fill plays 30% of the time; otherwise, the main pattern plays. Great for generative variation without manually arranging different sections.

## See Also

- [ETHERSCORE_FORMAT.md](ETHERSCORE_FORMAT.md) - Complete format specification
- [THEORY.md](THEORY.md) - Music theory reference
- [PRESETS.md](PRESETS.md) - Available instruments
