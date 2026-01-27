# LLM Composer Guide for EtherDAW

A practical guide for AI composers using EtherDAW to create music.

## Quick Start

1. **Read the format**: `docs/ETHERSCORE_FORMAT.md` for full specification
2. **Study benchmarks**: `examples/benchmark-*.etherscore.json` for feature examples
3. **Listen first**: Open `player.html` to hear compositions before modifying

## Core Concepts

### Structure Hierarchy

```
EtherScore
├── settings (tempo, key, time signature)
├── instruments (synth presets, effects)
├── patterns (reusable musical phrases)
├── sections (organized parts of the song)
└── arrangement (order of sections)
```

### Note Syntax

```
<pitch><octave>:<duration>[modifiers]

Examples:
C4:q          Quarter note middle C
C4:8          Eighth note
C4:w          Whole note
C4:q.         Dotted quarter (1.5x length)
C4:q*         Staccato (short)
C4:q~         Legato (connected)
C4:q>         Accent (emphasized)
C4:q@mf       At mezzo-forte dynamics
C4:q?0.7      70% probability of playing
r:q           Quarter rest
```

### Duration Values

| Code | Name | Beats (4/4) |
|------|------|-------------|
| w | whole | 4 |
| h | half | 2 |
| q | quarter | 1 |
| 8 | eighth | 0.5 |
| 16 | sixteenth | 0.25 |
| 32 | thirty-second | 0.125 |

## Composition Workflow

### Step 1: Define Settings

```json
{
  "settings": {
    "tempo": 120,
    "key": "C major",
    "timeSignature": "4/4"
  }
}
```

### Step 2: Create Instruments

```json
{
  "instruments": {
    "piano": {
      "preset": "fm_epiano",
      "volume": -6,
      "effects": [{ "type": "reverb", "wet": 0.2 }]
    }
  }
}
```

### Step 3: Write Patterns

```json
{
  "patterns": {
    "melody": {
      "notes": ["C4:q", "E4:q", "G4:q", "E4:q", "C4:h"]
    },
    "bass": {
      "notes": ["C2:h", "G2:h"]
    }
  }
}
```

### Step 4: Organize Sections

```json
{
  "sections": {
    "intro": {
      "bars": 4,
      "tracks": {
        "piano": { "patterns": ["melody", "melody", "melody", "melody"], "velocity": 0.8 }
      }
    }
  }
}
```

**Note:** The `patterns` array should have one pattern per bar. Track options include:
- `velocity` - 0-1 velocity scaling
- `humanize` - 0-0.05 timing variation
- `groove` - Groove preset name

### Step 5: Arrange

```json
{
  "arrangement": ["intro", "verse", "chorus", "verse", "chorus", "outro"]
}
```

## Using Generative Features

### Markov Chains

Generate melodic patterns probabilistically:

```json
{
  "markov_melody": {
    "markov": {
      "states": ["1", "2", "3", "4", "5"],
      "preset": "melody_stepwise",
      "steps": 16,
      "duration": "q",
      "octave": 4,
      "seed": 42
    }
  }
}
```

**Presets**:
- `uniform` - Equal probability transitions
- `neighbor_weighted` - Prefers adjacent scale degrees
- `walking_bass` - Bass line patterns
- `melody_stepwise` - Stepwise melodic motion
- `root_heavy` - Returns to root frequently

### Euclidean Rhythms

Generate mathematically-balanced rhythms:

```json
{
  "tresillo": {
    "euclidean": {
      "hits": 3,
      "steps": 8,
      "duration": "8",
      "drum": "rim"
    }
  }
}
```

Common patterns:
- E(3,8) = Tresillo (Cuban)
- E(5,8) = Cinquillo (Caribbean)
- E(7,16) = Brazilian samba

### Density Curves

Control note probability over time:

```json
{
  "buildup": {
    "bars": 8,
    "density": {
      "start": 0.2,
      "end": 1.0,
      "curve": "exponential"
    },
    "tracks": { ... }
  }
}
```

### Tension Curves

Control multiple parameters with a single "tension" value:

```json
{
  "climax": {
    "bars": 8,
    "tension": {
      "start": 0.1,
      "end": 1.0,
      "curve": "exponential",
      "mappings": {
        "density": [0.2, 1.0],
        "brightness": [0.2, 0.9],
        "velocity": [0.4, 1.0]
      }
    }
  }
}
```

## Pattern Techniques

### Arpeggios

```json
{
  "arp_Cmaj7": {
    "arpeggio": {
      "chord": "Cmaj7",
      "mode": "updown",
      "duration": "16",
      "octaves": 2
    }
  }
}
```

### Voice Leading

```json
{
  "jazz_progression": {
    "voiceLead": {
      "progression": ["Dm7", "G7", "Cmaj7"],
      "voices": 4,
      "style": "jazz"
    }
  }
}
```

### Pattern Transforms

```json
{
  "melody_inverted": {
    "transform": {
      "source": "melody",
      "operation": "invert",
      "params": { "axis": "G4" }
    }
  }
}
```

Operations: `invert`, `retrograde`, `augment`, `diminish`, `transpose`, `octave`

### Continuation

```json
{
  "developed_theme": {
    "continuation": {
      "source": "motif",
      "technique": "ascending_sequence",
      "steps": 4,
      "interval": 2
    }
  }
}
```

Techniques: `ascending_sequence`, `descending_sequence`, `extension`, `fragmentation`, `development`

## Synthesis & Effects

### Available Presets

**FM Synths**: `fm_epiano`, `fm_bass`, `fm_brass`, `fm_bell`, `fm_glass`

**Pads**: `warm_pad`, `ambient_pad`, `string_pad`

**Bass**: `sub_bass`, `synth_bass`, `pluck_bass`

**Leads**: `soft_lead`, `bright_lead`, `analog_mono`

**Other**: `pluck`, `bell`, `kalimba`, `lofi_keys`

**Drums**: `drums:808`, `drums:909`, `drums:acoustic`, `drums:lofi`

### Effects Chain

```json
{
  "lead": {
    "preset": "soft_lead",
    "effects": [
      { "type": "filter", "options": { "frequency": 2000, "type": "lowpass" } },
      { "type": "delay", "wet": 0.2, "options": { "time": "8n", "feedback": 0.3 } },
      { "type": "reverb", "wet": 0.3 }
    ]
  }
}
```

### Layering (v0.8)

```json
{
  "thick_pad": {
    "layers": [
      { "preset": "saw", "detune": -5 },
      { "preset": "saw", "detune": 0 },
      { "preset": "saw", "detune": 5 }
    ]
  }
}
```

### LFO Modulation (v0.8)

```json
{
  "wobble_bass": {
    "preset": "synth_bass",
    "lfo": {
      "rate": "8n",
      "target": "filterCutoff",
      "depth": 0.5
    }
  }
}
```

## Music Theory Helpers (v0.9.7)

The theory engine provides programmatic access to scales, chords, and intervals.

### Scales

```typescript
import { scales } from 'etherdaw/theory';

scales.notes('C', 'major');           // ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
scales.degree('C', 'major', 5);       // 'G4' (fifth degree)
scales.inKey('F#', 'C', 'major');     // false
```

### Chord Identification

```typescript
import { chords } from 'etherdaw/theory';

chords.identify(['C4', 'E4', 'G4']);         // 'C'
chords.identify(['A4', 'C5', 'E5']);         // 'Am'
chords.quality(['C4', 'E4', 'G4', 'B4']);    // 'major seventh'
```

### Intervals

```typescript
import { intervals } from 'etherdaw/theory';

intervals.between('C4', 'G4');        // 'P5' (perfect fifth)
intervals.transpose('C4', 'P5');      // 'G4'
intervals.invert('P5');               // 'P4'
```

### Progressions

```typescript
import { progressions } from 'etherdaw/theory';

progressions.get('ii-V-I', 'C major');       // ['Dmin', 'Gmaj', 'Cmaj']
progressions.get('I-V-vi-IV', 'G major');    // ['Gmaj', 'Dmaj', 'Emin', 'Cmaj']
```

### Voice Leading Validation

```typescript
import { validate } from 'etherdaw/theory';

// Check for parallel fifths, octaves, voice crossing
validate.voiceLeading([
  { beat: 0, voices: ['C4', 'E4', 'G4', 'C5'] },
  { beat: 4, voices: ['D4', 'F4', 'A4', 'D5'] }
]);

// Check notes are in key
validate.inKey(['C4', 'E4', 'F#4'], 'C major');
// Returns: [{ type: 'out-of-key', note: 'F#4', ... }]
```

See [docs/THEORY.md](THEORY.md) for complete API reference.

---

## Verification

### Listen to Your Work

```bash
open player.html  # Mac
# Or serve it via HTTP
```

**Player controls (v0.9.5):**
- **Section buttons**: Jump directly to any section - no more replaying from the start
- **Tempo slider**: Slow down to 0.5x to hear complex passages, speed up to 2x for quick reviews
- **Keyboard shortcuts**: Space (play/pause), ←→ (seek ±5s), 1-9 (jump to section), M (mute)

### Validate Structure

```bash
npx tsx src/cli.ts validate mycomposition.etherscore.json
```

### Check Compilation

```bash
npx tsx src/cli.ts compile mycomposition.etherscore.json
```

### Use Spectrograms

See `docs/SPECTROGRAM_WORKFLOW.md` for visual verification.

## Common Mistakes

### 1. Invalid Note Format

Wrong: `"C:4q"`, `"C4 q"`, `"Cq4"`
Right: `"C4:q"`

### 2. Missing Section in Arrangement

```json
// This will error if "bridge" isn't defined in sections
"arrangement": ["intro", "verse", "bridge"]
```

### 3. Pattern Name Typo

```json
"tracks": {
  "piano": { "pattern": "melodi" }  // Should be "melody"
}
```

### 4. Duration Mismatch

If pattern notes don't fill the bars, playback may be unexpected. Calculate:
`bars × beats_per_bar = total_beats`

### 5. Forgetting Instrument Definition

Track names must match instrument names:

```json
"instruments": { "piano": { ... } },
"tracks": { "piano": { ... } }  // Must match
```

### 6. Inline Notes in Pattern Arrays

The patterns array expects **pattern names**, not inline notes:

```json
// WRONG - inline notes don't work
"tracks": {
  "vibes": { "patterns": ["r:w", "C5:w"] }  // Error!
}

// RIGHT - create patterns for single notes
"patterns": {
  "rest_bar": { "notes": ["r:w"] },
  "vibes_c5": { "notes": ["C5:w"] }
},
"tracks": {
  "vibes": { "patterns": ["rest_bar", "vibes_c5"] }
}
```

### 7. Pattern Bar Alignment (Critical!)

**Every track's patterns must sum to the section's bar count.** This is the most common timing bug.

```json
// Section has 8 bars - EVERY track must total 8 bars

"theme_A": {
  "bars": 8,
  "tracks": {
    // WRONG: 2+2+2+1 = 7 bars (1 bar short!)
    "piano": { "patterns": ["chord_2bar", "chord_2bar", "chord_2bar", "rest_1bar"] },

    // WRONG: 2+2 = 4 bars (4 bars short!)
    "vibes": { "patterns": ["melody_2bar", "melody_2bar"] },

    // RIGHT: 2+2+4 = 8 bars
    "bass": { "patterns": ["bass_2bar", "bass_2bar", "walking_4bar"] },

    // RIGHT: 1×8 = 8 bars
    "drums": { "patterns": ["beat", "beat", "beat", "beat", "beat", "beat", "beat", "beat"] }
  }
}
```

**How to verify:** For each track, sum the bar lengths of all patterns:
- 2-bar pattern + 2-bar pattern + 1-bar rest = 5 bars (needs 3 more for 8-bar section)

## Tips for Better Compositions

1. **Start with structure** - Define sections before details
2. **Use patterns for repetition** - Don't copy-paste notes
3. **Layer strategically** - Not every track needs to play always
4. **Use dynamics** - Vary velocity for expression
5. **Apply grooves** - `"groove": "dilla"` for swing feel
6. **Seed randomness** - Use `"seed": 42` for reproducible generative content
7. **Listen iteratively** - Verify each section sounds right

## Benchmarks as Templates

The benchmark files demonstrate every feature:

| Benchmark | Features Demonstrated |
|-----------|----------------------|
| `benchmark-generative` | Markov chains, all 5 presets |
| `benchmark-transforms` | Pattern transformations, inheritance |
| `benchmark-voice-leading` | Bach/Jazz/Pop voice leading |
| `benchmark-automation` | Tempo, filter, volume automation |
| `benchmark-density-tension` | Density curves, tension presets |
| `benchmark-euclidean` | Algorithmic rhythms |
| `benchmark-continuation` | Melodic development techniques |
| `benchmark-scale-degrees` | Degree notation, key changes |
| `benchmark-parallel` | Multi-pattern layering |
| `benchmark-mixing` | EQ, pan, compression |

Copy relevant patterns from benchmarks to jumpstart your compositions.

## Case Study: "Emergent Patterns"

A generative ambient composition (`examples/emergent-patterns.etherscore.json`) showcasing v0.8 features.

### Concept

Build from sparse textures through a dense peak, then release into stillness. Use generative features to create organic, evolving music.

### Structure (56 bars, ~3 minutes)

| Section | Bars | Density | Description |
|---------|------|---------|-------------|
| intro | 8 | 0.3→0.5 | Sparse Markov melody, pad, drone |
| build_a | 8 | 0.4→0.7 | Add walking bass, euclidean drums |
| build_b | 8 | 0.6→0.9 | Increase tension, add more percussion |
| peak | 8 | 0.92→0.98 | Maximum density, filter opens to 5kHz |
| release_a | 8 | 0.85→0.5 | Reduce activity, simpler bass |
| release_b | 8 | 0.5→0.25 | Strip to essentials |
| outro | 8 | 0.3→0.05 | Fade to near-silence |

### Features Used

1. **Markov chains** - `melody_stepwise` for melodic contour, `walking_bass` for bass movement
2. **Density curves** - exponential build, logarithmic release
3. **Tension curves** - mapped to brightness and velocity
4. **LFO modulation** - slow filter sweep on pad (1n rate)
5. **Layered instruments** - pad combines `ambient_pad` + `warm_pad` with detune
6. **Euclidean drums** - tresillo (3,8), cinquillo (5,8), dense (7,16)
7. **Probabilistic notes** - bell textures with ?0.3-0.9 probability
8. **Automation** - filter frequency sweeps during peak/outro

### Iteration Based on Spectrogram

After initial composition, spectrogram analysis revealed:
- 54% bass, 46% mid, 0.1% high frequencies
- Bells were too quiet to contribute high frequency sparkle

**Improvements made:**
- Boosted texture (bells) volume from -12dB to -6dB
- Increased bells_climax note probabilities (0.7→0.85 etc.)
- Widened peak filter automation (2500→5000 Hz instead of 2000→4000)

### Verification Workflow

1. `npx tsx src/cli.ts validate examples/emergent-patterns.etherscore.json`
2. `npx tsx src/cli.ts compile examples/emergent-patterns.etherscore.json`
3. Open `player.html`, select composition, play
4. Export WAV, generate spectrogram, analyze frequency balance
5. Iterate based on visual/audio feedback
