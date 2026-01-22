# EtherDAW

A DAW (Digital Audio Workstation) designed for LLMs to compose music using the **EtherScore** format - a pattern-based, declarative JSON notation that's easy to reason about and generate.

## Quick Start

Here's a minimal composition:

```json
{
  "meta": { "title": "Hello EtherScore" },
  "settings": { "tempo": 120, "key": "C major" },
  "instruments": {
    "piano": { "preset": "electric_piano" }
  },
  "patterns": {
    "melody": { "notes": ["C4:q", "E4:q", "G4:q", "C5:q"] }
  },
  "sections": {
    "main": {
      "bars": 4,
      "tracks": {
        "piano": { "pattern": "melody", "repeat": 4 }
      }
    }
  },
  "arrangement": ["main"]
}
```

## Installation

```bash
npm install
npm run build
```

## CLI Usage

```bash
# Validate an EtherScore file
npx etherdaw validate song.etherscore.json

# Show composition info
npx etherdaw info song.etherscore.json

# Compile and show stats
npx etherdaw compile song.etherscore.json -v

# Export to MIDI
npx etherdaw export song.etherscore.json -f midi

# Export to ABC notation
npx etherdaw export song.etherscore.json -f abc

# Create from template
npx etherdaw new -t ambient -o my-song.etherscore.json

# List available resources
npx etherdaw list presets
npx etherdaw list scales
npx etherdaw list chords
```

## Browser Playback

Serve the project directory and open `player.html`:

```bash
python3 -m http.server 8000
# Open http://localhost:8000/player.html
```

### WAV Export

The browser player includes WAV audio export functionality:

1. Load any composition in the player
2. Click the "Export WAV" button
3. Wait for offline rendering (typically a few seconds)
4. The browser will download a WAV file (44.1kHz, 16-bit stereo)

**Technical notes:**
- Uses Tone.Offline() for offline rendering
- Includes 2-second tail for reverb/delay tails
- File size is approximately 10MB per minute of audio
- Export timing matches real-time playback

## Architecture (v0.5)

EtherDAW v0.5 features a unified codebase between Node.js and browser with bundled Tone.js:

```
src/
├── config/
│   └── constants.ts        # Single source of truth for all magic numbers
├── browser/
│   ├── index.ts            # Browser bundle entry point
│   └── player.ts           # Player class API (v0.5)
├── parser/                 # Note, chord, pattern parsing
│   └── json-preprocessor.ts # Comment stripping (v0.5)
├── engine/                 # Compilation and timeline building
│   └── automation.ts       # Parameter automation (v0.5)
├── theory/                 # Music theory (scales, chords, rhythm)
├── synthesis/              # Tone.js instruments and effects
│   ├── presets.ts          # Declarative preset definitions (v0.5)
│   ├── semantic-params.ts  # Semantic parameter mappings (v0.5)
│   └── instrument-factory.ts # Synth creation from definitions (v0.5)
└── output/                 # MIDI, WAV, ABC export

dist/
├── *.js                    # Node.js compiled output
├── etherdaw-browser.js     # Browser bundle (~850KB, includes Tone.js)
└── manifest.json           # Auto-generated composition list (v0.5)
```

### Development Workflow

```bash
# Build everything (TypeScript + browser bundle + manifest)
npm run build:all

# Build TypeScript for Node.js
npm run build

# Build browser bundle (includes Tone.js)
npm run build:browser

# Generate composition manifest from examples/
npm run build:manifest

# Run tests
npm run test:run

# Open player in browser
open player.html
```

### Constants

All magic numbers are centralized in `src/config/constants.ts`:

```typescript
import { DURATIONS, ARTICULATION, EFFECT_DEFAULTS } from './config/constants.js';

// Duration values
DURATIONS.q  // 1 (quarter note = 1 beat)
DURATIONS.h  // 2 (half note)

// Articulation modifiers
ARTICULATION.staccato  // { gate: 0.3, velocityBoost: 0 }
ARTICULATION.accent    // { gate: 1.0, velocityBoost: 0.2 }

// Effect defaults
EFFECT_DEFAULTS.reverb.decay  // 2
EFFECT_DEFAULTS.delay.feedback  // 0.3
```

---

# EtherScore Format Reference

## Document Structure

```json
{
  "meta": { },         // Optional metadata
  "settings": { },     // Required: tempo, key, time signature
  "instruments": { },  // Optional: instrument definitions
  "patterns": { },     // Required: reusable musical patterns
  "sections": { },     // Required: composition sections
  "arrangement": [ ]   // Required: section play order
}
```

## Meta (Optional)

```json
"meta": {
  "title": "My Song",
  "composer": "Claude",
  "mood": "contemplative",
  "genre": "ambient electronic",
  "description": "A brief description of the piece",
  "tags": ["ambient", "electronic", "experimental"]
}
```

## Settings (Required)

```json
"settings": {
  "tempo": 120,           // BPM (20-400)
  "key": "C major",       // Key signature
  "timeSignature": "4/4", // Time signature (default: 4/4)
  "swing": 0              // Swing amount 0-1 (default: 0)
}
```

### Key Signatures

Format: `{root} {mode}` where root is A-G with optional # or b

**Modes:**
- `major` / `ionian` - Major scale
- `minor` / `aeolian` - Natural minor
- `dorian` - Minor with raised 6th
- `phrygian` - Minor with lowered 2nd
- `lydian` - Major with raised 4th
- `mixolydian` - Major with lowered 7th
- `locrian` - Diminished scale

**Examples:** `C major`, `F# minor`, `Bb dorian`, `E phrygian`

## Instruments

Define instruments with presets and optional effects:

```json
"instruments": {
  "lead": {
    "preset": "soft_lead",    // Instrument preset name
    "volume": -6,             // Volume in dB (-60 to 6)
    "pan": 0,                 // Stereo pan (-1 to 1)
    "effects": [
      { "type": "reverb", "wet": 0.5, "options": { "decay": 2 } },
      { "type": "delay", "wet": 0.3, "options": { "time": "8n", "feedback": 0.4 } }
    ]
  }
}
```

### Available Presets

**Synths:**
- `synth` - Simple triangle wave synth
- `sine` - Pure sine wave
- `square` - Retro square wave
- `sawtooth` - Bright sawtooth wave

**Bass:**
- `synth_bass` - Classic synth bass
- `sub_bass` - Deep sub bass
- `pluck_bass` - Plucky bass sound

**Pads:**
- `warm_pad` - Warm, slow-attack pad
- `string_pad` - String-like pad
- `ambient_pad` - Ethereal ambient pad

**Leads:**
- `lead` - Classic lead sound
- `soft_lead` - Soft, mellow lead

**Keys:**
- `electric_piano` - Rhodes-like electric piano
- `organ` - Simple organ sound

**Plucks:**
- `pluck` - Basic pluck sound
- `bell` - Bell-like tone
- `marimba` - Marimba-like sound

**FM Synths - DX7-inspired (v0.3):**
- `fm_epiano` - DX7-style electric piano (Rhodes-like with bell attack)
- `fm_bass` - Punchy FM bass with defined attack
- `fm_brass` - FM brass stabs
- `fm_church_bell` - Large resonant church bell
- `fm_tubular_bell` - Classic DX7 chime/tubular bell
- `fm_glass` - Crystal/glass tones
- `fm_vibraphone` - FM vibraphone/mallets
- `fm_organ` - FM organ with sustained brightness

**Legacy FM Synths (Synthwave):**
- `synthwave_bass` - Warm, punchy 80s FM bass
- `synthwave_lead` - Bright, cutting lead
- `synthwave_stab` - Punchy FM chord stabs
- `synthwave_pad` - Lush, evolving 80s pad (sawtooth)
- `arp_synth` - Bright arpeggiated synth

**Drum Kits (v0.2):**
- `drums:808` - Roland TR-808 style (deep, boomy)
- `drums:909` - Roland TR-909 style (punchy, aggressive)
- `drums:acoustic` - Natural acoustic drums
- `drums:lofi` - Lo-fi, vintage, dusty character

**Legacy Drums (909-style):**
- `kick_909` - Classic 909 kick drum
- `kick_deep` - Deep house kick with longer decay
- `hihat_closed` - Tight closed hi-hat
- `hihat_open` - Open hi-hat with sustain
- `clap_909` - Classic 909 clap
- `snare_house` - House-style snare

### Available Effects

All effects support a `wet` parameter (0-1) for dry/wet mix.

**Reverb** - Spatial reverb effect
```json
{ "type": "reverb", "wet": 0.5, "options": { "decay": 2 } }
```
- `decay`: Reverb decay time in seconds (default: 2)

**Delay** - Echo/delay effect
```json
{ "type": "delay", "wet": 0.3, "options": { "time": "8n", "feedback": 0.4 } }
```
- `time`: Delay time - note value ("8n", "4n") or seconds (default: "8n")
- `feedback`: Amount of signal fed back 0-1 (default: 0.3)

**Chorus** - Adds richness and movement
```json
{ "type": "chorus", "wet": 0.5, "options": { "frequency": 1.5, "delayTime": 3.5, "depth": 0.7 } }
```
- `frequency`: LFO frequency in Hz (default: 1.5)
- `delayTime`: Delay in ms (default: 3.5)
- `depth`: Modulation depth 0-1 (default: 0.7)

**Distortion** - Adds grit and harmonics
```json
{ "type": "distortion", "wet": 0.3, "options": { "amount": 0.4 } }
```
- `amount`: Distortion intensity 0-1 (default: 0.4)

**Filter** - Frequency shaping
```json
{ "type": "filter", "options": { "frequency": 2000, "type": "lowpass", "Q": 1 } }
```
- `frequency`: Cutoff frequency in Hz (default: 1000)
- `type`: Filter type - "lowpass", "highpass", "bandpass" (default: "lowpass")
- `Q`: Resonance/quality factor (default: 1)

**Compressor** - Dynamic range compression
```json
{ "type": "compressor", "options": { "threshold": -24, "ratio": 4, "attack": 0.003, "release": 0.25 } }
```
- `threshold`: Level in dB where compression starts (default: -24)
- `ratio`: Compression ratio (default: 4)
- `attack`: Attack time in seconds (default: 0.003)
- `release`: Release time in seconds (default: 0.25)

**EQ** - Three-band equalizer
```json
{ "type": "eq", "options": { "low": 0, "mid": 0, "high": 0 } }
```
- `low`: Low band gain in dB (default: 0)
- `mid`: Mid band gain in dB (default: 0)
- `high`: High band gain in dB (default: 0)

**Phaser** - Shimmering, sweeping modulation effect
```json
{ "type": "phaser", "wet": 0.5, "options": { "frequency": 0.5, "octaves": 3, "baseFrequency": 350 } }
```
- `frequency`: LFO speed in Hz (default: 0.5)
- `octaves`: Number of octaves the effect sweeps (default: 3)
- `baseFrequency`: Base frequency in Hz (default: 350)

**Vibrato** - Tape-like pitch wobble
```json
{ "type": "vibrato", "wet": 0.5, "options": { "frequency": 5, "depth": 0.1 } }
```
- `frequency`: Vibrato rate in Hz (default: 5)
- `depth`: Pitch variation depth 0-1 (default: 0.1)

**Bitcrusher** - Lo-fi bit reduction effect
```json
{ "type": "bitcrusher", "wet": 0.5, "options": { "bits": 8 } }
```
- `bits`: Bit depth 1-16, lower = more distorted (default: 8)

## Patterns

Patterns are reusable musical phrases. There are several ways to define them:

### Notes Pattern

Individual notes in `pitch:duration` format:

```json
"melody": {
  "notes": ["C4:q", "E4:q", "G4:h", "r:q", "A4:8", "G4:8", "E4:q"]
}
```

**Pitch format:** `{note}{accidental?}{octave}` - e.g., `C4`, `F#3`, `Bb5`

**Duration codes:**
- `w` - Whole note (4 beats)
- `h` - Half note (2 beats)
- `q` - Quarter note (1 beat)
- `8` - Eighth note (0.5 beats)
- `16` - Sixteenth note (0.25 beats)
- `32` - Thirty-second note (0.125 beats)

**Dotted notes:** Add `.` after duration for 1.5x length: `C4:q.` = dotted quarter

**Rests:** Use `r:duration` - e.g., `r:q` for quarter rest, `r:h` for half rest

**Articulation (v0.3):** Add markers after duration:
- `*` - Staccato (30% gate, short detached)
- `~` - Legato (110% gate, connected)
- `>` - Accent (+0.2 velocity boost)
- `^` - Marcato (staccato + accent)

Examples: `C4:q*` (staccato), `D4:h~` (legato), `E4:8>` (accent)

### Chords Pattern

Chord symbols with durations:

```json
"progression": {
  "chords": ["Cmaj7:w", "Dm7:h", "G7:h", "Am:w"]
}
```

**Chord format:** `{root}{quality}:{duration}`

**Available chord qualities:**
- Triads: `maj`, `min`/`m`, `dim`, `aug`, `sus2`, `sus4`
- Sevenths: `maj7`, `7`, `min7`/`m7`, `dim7`, `m7b5`
- Extended: `9`, `maj9`, `m9`, `11`, `13`
- Add: `add9`, `6`, `m6`, `6/9`
- Altered: `7b5`, `7#5`, `7b9`, `7#9`

**Slash chords:** `C/G:h` for C chord with G bass

**Chord Voicings (House/Jazz):**

For jazzy house music, you can specify voicings using the `@voicing` suffix:

```json
"progression": {
  "chords": ["Am9@drop2:w", "Dm7@drop2:w", "Fmaj7@drop2:w", "Em7@drop2:w"]
}
```

**Available voicings:**
- `@close` - Standard close voicing (default)
- `@drop2` - Drop 2 voicing: 2nd-from-top voice dropped an octave (open, airy - classic house piano)
- `@shell` - Shell voicing: root + 3rd + 7th only (no 5th - cleaner, more modern)
- `@open` - Wide voicing spanning multiple octaves

Supported chord qualities with voicings: `m7`, `m9`, `maj7`, `maj9`, `7`, `9`

This enables "chord planing" - moving the same voicing shape in parallel motion for that smooth, gliding jazz-house sound

### Arpeggio Pattern

Arpeggiate a chord in a specific pattern:

```json
"arp_pattern": {
  "arpeggio": {
    "chord": "Am7",
    "pattern": [1, 3, 5, 7, 5, 3],  // Chord tones to play
    "duration": "16",               // Duration of each note
    "octaveSpan": 2                 // Octaves to span (optional)
  }
}
```

The `pattern` array uses chord tone numbers (1=root, 3=third, 5=fifth, 7=seventh).

**Enhanced Arpeggiator (v0.2):**

Instead of explicit patterns, use mode-based generation:

```json
"trance_arp": {
  "arpeggio": {
    "chord": "Am",
    "mode": "updown",      // up, down, updown, downup, random
    "octaves": 2,          // Octaves to span (1-4)
    "duration": "16",
    "gate": 0.5,           // Note length ratio (0.1-1.0)
    "steps": 16            // Total steps (for random mode)
  }
}
```

**Available modes:**
- `up` - Ascending through chord tones
- `down` - Descending through chord tones
- `updown` - Ascending then descending (excluding ends)
- `downup` - Descending then ascending
- `random` - Random chord tones (use `steps` to control length)

### Drum Pattern (v0.2)

Semantic drum patterns with named drum sounds:

```json
"house_beat": {
  "drums": {
    "kit": "909",          // 808, 909, acoustic, lofi
    "hits": [
      { "drum": "kick", "time": "0" },
      { "drum": "hihat", "time": "8" },
      { "drum": "clap", "time": "q" },
      { "drum": "kick", "time": "h" },
      { "drum": "clap", "time": "h+q" }
    ]
  }
}
```

**Time notation:** `"0"`, `"q"` (quarter), `"h"` (half), `"8"` (eighth), `"h+8"` (half + eighth), etc.

**Available drum types:**
- `kick`, `snare`, `clap`, `hihat`, `hihat_open`
- `tom_hi`, `tom_mid`, `tom_lo`
- `crash`, `ride`, `rim`, `cowbell`, `shaker`

**Step sequencer syntax:**
```json
"four_on_floor": {
  "drums": {
    "kit": "909",
    "steps": "x...x...x...x...",  // x=hit, .=rest, >=accent
    "stepDuration": "16"          // Duration per step
  }
}
```

### Euclidean Rhythm (v0.2)

Generate Euclidean rhythms using Bjorklund's algorithm:

```json
"tresillo": {
  "euclidean": {
    "hits": 3,           // Pulses to distribute
    "steps": 8,          // Total steps
    "rotation": 0,       // Rotate pattern
    "duration": "8",     // Step duration
    "drum": "hihat"      // For drum patterns
  }
}
```

For melodic patterns, use `pitch` instead of `drum`:
```json
"bass_rhythm": {
  "euclidean": {
    "hits": 5,
    "steps": 16,
    "duration": "16",
    "pitch": "E2"
  }
}
```

**Classic Euclidean patterns:**
- E(3,8) = Tresillo (Cuban/Latin "3-3-2")
- E(5,8) = Cinquillo (Cuban habanera)
- E(5,16) = Bossa Nova
- E(7,12) = Bembé (Afro-Cuban 12/8)
- E(9,16) = Aksak (Turkish/Balkan)

### Pattern Transforms (v0.3)

Generate new patterns by transforming existing ones:

```json
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
```

**Available operations:**

| Operation | Description | Parameters |
|-----------|-------------|------------|
| `invert` | Flip melodic contour | `axis`: pivot pitch (e.g., "E4") |
| `retrograde` | Reverse note order | - |
| `augment` | Stretch rhythms | `factor`: multiplier (default: 2) |
| `diminish` | Compress rhythms | `factor`: multiplier (default: 0.5) |
| `transpose` | Shift pitches | `semitones`: +/- semitones |
| `octave` | Shift by octaves | `octaves`: +/- octaves |

### Scale Degrees Pattern

Use scale degrees that resolve based on the current key. This allows writing melodies that automatically transpose to any key:

```json
"scale_melody": {
  "degrees": ["1:q", "2:q", "3:q", "5:h", "r:q", "3:8", "2:8", "1:h"]
}
```

**Format:** `{degree}:{duration}` - e.g., `1:q` for root quarter note, `5:h` for fifth half note

**How degrees work:**
- Degrees 1-7 map to scale tones of the current key
- Degree 8+ wraps to the next octave (8 = root an octave up)
- Rests use `r:duration` format

**Supported modes:** major, minor, natural_minor, harmonic_minor, melodic_minor, dorian, phrygian, lydian, mixolydian, locrian, pentatonic, blues

**Example in different keys:**
```
Key: "C major" -> degrees [1, 3, 5] = C, E, G
Key: "A minor" -> degrees [1, 3, 5] = A, C, E
Key: "F# dorian" -> degrees [1, 3, 5] = F#, A, C#
```

This is powerful for creating melodies that work in any key - simply change the `key` setting or use section key overrides.

**Enhanced Scale Degrees (v0.3):** Add modifiers for more control:

| Modifier | Effect | Example |
|----------|--------|---------|
| `#` | Raise semitone | `7#:q` - Leading tone |
| `b` | Lower semitone | `3b:8` - Minor third |
| `+` | Octave up | `1+:h` - Root up an octave |
| `-` | Octave down | `5-:q` - Fifth down an octave |

Combine modifiers: `7#:q` (raised 7th, quarter note), `3b+:h` (lowered 3rd, octave up, half note)

**Scale Constraint (v0.3):** Automatically snap out-of-key notes:
```json
"melody": {
  "notes": ["C4:q", "D4:q", "F#4:q", "G4:q"],
  "constrainToScale": true
}
```
With key "C major", F#4 snaps to the nearest scale tone (F4 or G4).

## Sections

Sections define what plays together over a duration:

```json
"sections": {
  "verse": {
    "bars": 8,              // Section length in bars
    "tracks": {
      "piano": {
        "pattern": "melody",    // Single pattern reference
        "velocity": 0.7,        // Note velocity 0-1 (default: 0.8)
        "repeat": 2,            // Repeat count (default: fills section)
        "humanize": 0.1,        // Timing randomization 0-1
        "octave": 0,            // Octave offset
        "transpose": 0          // Semitone transposition
      },
      "bass": {
        "patterns": ["bass_a", "bass_b"],  // Multiple patterns in sequence
        "velocity": 0.8
      },
      "drums": {
        "pattern": "beat",
        "mute": false           // Set true to silence
      }
    },
    "tempo": 100,             // Optional tempo override
    "key": "G major"          // Optional key override
  }
}
```

### Track Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `pattern` | string | - | Single pattern reference |
| `patterns` | string[] | - | Multiple patterns in sequence |
| `velocity` | number | 0.8 | Note velocity (0-1) |
| `repeat` | number | fills | Number of pattern repeats |
| `humanize` | number | 0 | Timing randomization (0-1) |
| `octave` | number | 0 | Octave offset |
| `transpose` | number | 0 | Semitone transposition |
| `mute` | boolean | false | Mute this track |

**Pattern filling:** If `repeat` is not specified, patterns repeat to fill the section bars. If specified, patterns play exactly that many times.

## Arrangement

The arrangement array defines the order sections play:

```json
"arrangement": ["intro", "verse", "chorus", "verse", "chorus", "outro"]
```

Sections can repeat by appearing multiple times.

---

# Composition Tips

## Building Tension

1. Start sparse, add instruments gradually
2. Increase velocity over build sections
3. Use longer note durations for calm, shorter for energy
4. Layer arpeggios with pads for fullness

## Creating Variety

1. Define base patterns, then variations
2. Use different pattern sequences per section
3. Transpose patterns for choruses
4. Mute/unmute tracks between sections

## Effective Structures

**Ambient piece:**
```
awakening (sparse) -> emergence (add elements) -> peak -> resolution -> fade
```

**Electronic track:**
```
intro -> buildup -> drop -> breakdown -> build -> drop_b -> outro
```

**Song form:**
```
intro -> verse -> chorus -> verse -> chorus -> bridge -> chorus -> outro
```

## Common Progressions

- **Pop:** I - V - vi - IV (C - G - Am - F)
- **Jazz ii-V-I:** Dm7 - G7 - Cmaj7
- **Ambient:** i - VI - III - VII (Am - F - C - G)
- **Minor drama:** i - iv - V - i (Am - Dm - E - Am)

## Humanization

Add `humanize: 0.05` to `humanize: 0.15` for natural feel:
- 0.05 - Subtle, good for pads
- 0.10 - Natural feel for melodies
- 0.15 - Loose, jazzy feel

---

# Available Scales

The browser player supports these scales for scale degree resolution:

**Diatonic modes:**
- `major` (ionian) - W-W-H-W-W-W-H
- `dorian` - Minor with raised 6th
- `phrygian` - Minor with lowered 2nd
- `lydian` - Major with raised 4th
- `mixolydian` - Major with lowered 7th
- `minor` / `natural_minor` (aeolian) - Natural minor scale
- `locrian` - Diminished scale

**Minor variants:**
- `harmonic_minor` - Natural minor with raised 7th
- `melodic_minor` - Minor with raised 6th and 7th

**Other scales:**
- `pentatonic` - Major pentatonic (5 notes)
- `blues` - Blues scale with blue note

The CLI compiler supports additional scales including whole_tone, diminished, chromatic, and jazz scales (bebop_dominant, bebop_major, altered)

---

# Examples

See the `examples/` directory:

**v0.3 Feature Demos:**
- `fm-showcase.etherscore.json` - Demonstrates all FM synthesis presets (fm_epiano, fm_bass, fm_brass, fm_bells, fm_glass, fm_vibraphone, fm_organ)

**v0.2 Feature Demos:**
- `drum-kit-demo.etherscore.json` - Showcases 808, 909, acoustic, and lofi drum kits with semantic patterns
- `euclidean-demo.etherscore.json` - Euclidean rhythm generator with tresillo, cinquillo, bembé, and polyrhythms
- `arpeggiator-demo.etherscore.json` - Enhanced arpeggiator with up/down/updown/random modes

**Original Examples:**
- `llm-composition.etherscore.json` - Ambient electronic piece
- `reflections-reprise.etherscore.json` - A deeper return to the themes of Reflections in Binary
- `electronic-beat.etherscore.json` - Energetic electronic track
- `jazz-standard.etherscore.json` - Jazz piece with swing
- `ambient-journey.etherscore.json` - Atmospheric ambient
- `fugue-d-minor.etherscore.json` - Extended 4-voice Baroque fugue with exposition, episodes, stretto, and coda
- `house-midnight.etherscore.json` - Chicago-style house track with jazzy drop2 voicings and 4-on-the-floor drums
- `synthwave-neon.etherscore.json` - 80s synthwave track with FM synthesis, DX7-style bells, and driving arpeggios
- `boombap-dusty.etherscore.json` - J Dilla-inspired boom bap with "drunk" timing, locked drums and loose rhodes
- `vaporwave-plaza.etherscore.json` - Dreamy vaporwave with lush electric piano, warm pads, and lo-fi textures

---

# API Usage

```typescript
import { validateFull } from 'etherdaw/schema/validator';
import { compile } from 'etherdaw/engine/compiler';
import { exportToMidiBytes } from 'etherdaw/output/midi-export';

// Load and validate
const score = JSON.parse(fs.readFileSync('song.etherscore.json', 'utf-8'));
const validation = validateFull(score);

if (validation.valid) {
  // Compile to timeline
  const { timeline, stats } = compile(score);

  // Export to MIDI
  const midiBytes = exportToMidiBytes(timeline);
  fs.writeFileSync('song.mid', Buffer.from(midiBytes));
}
```

---

# Documentation

Comprehensive documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](docs/QUICKSTART.md) | Get started creating music quickly |
| [ETHERSCORE_FORMAT.md](docs/ETHERSCORE_FORMAT.md) | Complete format specification |
| [VISION.md](docs/VISION.md) | Long-term architecture and philosophy |
| [PRD.md](docs/PRD.md) | Product requirements for LLM-native DAW |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture and extension points |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Development guide and changelog |
| [SYNTH_PARAMETERS.md](docs/SYNTH_PARAMETERS.md) | Semantic parameter reference for sound shaping (v0.5) |
| [PRESETS.md](docs/PRESETS.md) | All instrument presets with descriptions |
| [PATTERNS.md](docs/PATTERNS.md) | Pattern syntax reference |
| [EFFECTS.md](docs/EFFECTS.md) | Audio effects and parameters |
| [THEORY.md](docs/THEORY.md) | Music theory helpers (scales, chords) |
| [EXAMPLES.md](docs/EXAMPLES.md) | Example compositions index |

---

# Development Status

## v0.83 Features (Latest) - "Pattern Algebra + Album"

| Feature | Description |
|---------|-------------|
| **Pattern Transforms** | `reverse`, `invert`, `shuffle`, `slice`, `rotate` transforms in REPL |
| **Combinators** | `every N` and `sometimes` for conditional/probabilistic transforms |
| **Pattern Variables** | `set var = pattern \| transform` with pipe syntax |
| **Debug Tools** | `show`, `explain`, `diff` for inspecting pattern state |
| **LLM Feedback** | `preview`, `describe`, `suggest`, `spectrum`, `timeline` commands |
| **Extended Chords** | `add11`, `m7add11`, `maj7add11` compound chord support |
| **Extended Dynamics** | `@ppp` and `@fff` dynamic markings |
| **Album "Threshold"** | 8-track album demonstrating all DAW capabilities |

## v0.82 Features - "Live Coding Foundation"

| Feature | Description |
|---------|-------------|
| **EtherREPL** | Interactive composition environment with load/play/stop/save commands |
| **Node.js Playback** | Play compositions from CLI without browser |
| **Pattern Transforms** | Transpose, stretch, velocity scaling via REPL |
| **Templates** | Quick-start templates for techno, lofi, ambient genres |

## v0.6 Features - "Generative Primitives"

| Feature | Description |
|---------|-------------|
| **Markov Chain Patterns** | Probabilistic sequence generation with state machines and optional seeding |
| **Density Curves** | Section-level activity control with interpolated density values (linear, exponential, logarithmic, sine) |
| **Melodic Continuation** | Generate continuations from motifs (ascending/descending sequence, extension, fragmentation) |
| **Voice Leading** | Constraint-based chord voicing with style presets (bach, jazz, pop) |
| **LLM Feedback Primer** | Documentation for gathering feedback from other LLMs |
| **Generative Demo** | New example showcasing all v0.6 features |

## v0.5 Features - "The LLM Composer Release"

| Feature | Description |
|---------|-------------|
| **Semantic Synth Parameters** | LLM-friendly 0-1 scale params: `brightness`, `warmth`, `attack`, `decay`, etc. |
| **Multi-Instance Presets** | Same preset on multiple tracks with different params |
| **Direct Tone.js Overrides** | Power user access to raw synth parameters |
| **Parallel Patterns** | `parallel: ["kick", "hihat", "clap"]` - patterns play simultaneously |
| **Multi-Line Step Notation** | `lines: { kick: "x...", hihat: "..x." }` - visual drum programming |
| **Pattern Probability** | `probability: 0.3` + `fallback: "main"` - generative variation |
| **Section Automation** | Filter sweeps, brightness ramps, parameter changes over time |
| **Comment Support** | `"// comment": "..."` keys stripped during parsing |
| **Auto-Discovery** | `dist/manifest.json` - no manual dropdown updates |
| **Browser Architecture** | player.html reduced from 3006 to 589 lines, uses bundled Tone.js |

## v0.45 Features

| Feature | Description |
|---------|-------------|
| **Claude Code Configuration** | `.claude/` directory with CLAUDE.md, settings.json, custom commands |
| **Constants Extraction** | Single source of truth in `src/config/constants.ts` |
| **Browser Bundle** | `dist/etherdaw-browser.js` shares code between Node.js and browser |

## v0.4 Features

| Feature | Description |
|---------|-------------|
| **Per-note Velocity** | `C4:q@0.8` - Individual note velocity (0.0-1.0) |
| **Per-note Probability** | `C4:q?0.7` - 70% chance to play |
| **Timing Offset** | `C4:q+10ms` or `C4:q-5ms` - Micro-timing control |
| **Portamento** | `C4:q~>` - Glide to next note |
| **Velocity Envelopes** | Pattern-level dynamics: `crescendo`, `diminuendo`, `swell`, custom arrays |

## v0.3 Features

| Feature | Description |
|---------|-------------|
| **FM Synthesis Overhaul** | 8 new DX7-inspired presets with proper harmonicity/modulation tuning |
| **Articulation Support** | Staccato (`*`), legato (`~`), accent (`>`), marcato (`^`) on notes and chords |
| **Enhanced Scale Degrees** | Modifiers for raised/lowered tones (`#`, `b`) and octave shifts (`+`, `-`) |
| **Scale Constraint** | `constrainToScale: true` auto-snaps out-of-key notes to nearest scale tone |
| **Pattern Transforms** | Generate variations via invert, retrograde, augment, diminish, transpose |
| **Comprehensive Documentation** | Full docs/ directory with format spec, presets, patterns, effects, theory |
| **FM Showcase Example** | New example demonstrating all FM presets |

## v0.2 Features

| Feature | Description |
|---------|-------------|
| **Drum Kit System** | Semantic drum patterns with 4 kit presets (808, 909, acoustic, lofi) |
| **Euclidean Rhythms** | Bjorklund's algorithm for mathematically elegant rhythm generation |
| **Enhanced Arpeggiator** | Mode-based pattern generation (up, down, updown, downup, random) |

## Browser Player Coverage

The browser player (`player.html`) now supports **100% of the EtherScore format**:

| Feature | Status |
|---------|--------|
| All 7 effects | Reverb, delay, chorus, distortion, filter, compressor, EQ |
| Pan control | Full stereo positioning (-1 to 1) |
| Humanization | Timing jitter and velocity variation |
| Transpose | Semitone transposition per track |
| Time signatures | 4/4, 3/4, 6/8, and all others |
| Scale degrees | 12 modes with automatic key resolution |
| Section overrides | Key, tempo, and time signature per section |
| Swing | Jazz swing feel (0-1) |
| Drum kits (v0.2) | 808, 909, acoustic, lofi with 13 drum types |
| Euclidean rhythms (v0.2) | Automatic rhythm generation via Bjorklund's algorithm |
| Enhanced arpeggios (v0.2) | Mode-based generation with gate/octave control |
| Chord voicings | Drop2, shell, and open voicings for jazz-house |
| Note visualization | Real-time canvas visualization showing active notes per instrument |
| FM synth presets (v0.3) | DX7-inspired: fm_epiano, fm_bass, fm_brass, fm_bells, fm_glass, fm_vibraphone, fm_organ |
| Articulation (v0.3) | Staccato, legato, accent, marcato modifiers on notes and chords |
| Enhanced degrees (v0.3) | Raised/lowered tones and octave modifiers in scale degree patterns |
| Scale constraint (v0.3) | Auto-snap out-of-key notes with `constrainToScale: true` |
| Pattern transforms (v0.3) | Invert, retrograde, augment, diminish, transpose, octave operations |
| WAV audio export | Offline rendering to 44.1kHz 16-bit stereo WAV files |
| Semantic synth params (v0.5) | LLM-friendly instrument customization via `params` |
| Parallel patterns (v0.5) | Simultaneous pattern playback for layered drums |
| Multi-line steps (v0.5) | Visual drum programming with `lines` property |
| Pattern probability (v0.5) | Generative variation with fallback patterns |
| Section automation (v0.5) | Dynamic parameter changes over time |
| Comment stripping (v0.5) | `"// comment"` keys ignored in parsing |
| Auto-discovery (v0.5) | Compositions loaded from `dist/manifest.json` |

---

# Future Directions

## Near-term Enhancements

**Additional Instrument Presets**
- Sampled instruments (piano, strings, brass)
- ✅ Drum kits with pattern-based sequencing (v0.2)
- ✅ FM synth presets (synthwave_bass, synthwave_lead, fm_bell, etc.)

**Pattern Extensions**
- ✅ Euclidean rhythm patterns (v0.2)
- ✅ Pattern transformations with full JSON support (v0.3)
- ✅ Enhanced arpeggiator with modes (v0.2)
- ✅ Articulation markers (staccato, legato, accent, marcato) (v0.3)
- ✅ Scale constraint for auto-correcting out-of-key notes (v0.3)
- Probability-based notes for generative elements

**Export Improvements**
- ✅ WAV export implemented in browser player
- MusicXML export for notation software
- Improved ABC notation with lyrics support

## Medium-term Goals

**Real-time Features**
- Live tempo changes with section-aware timing
- MIDI input for recording
- Live parameter automation

**AI Composition Aids**
- Chord progression suggestions based on key
- Melody harmonization
- Style-aware pattern generation

**DAW Integration**
- VST plugin bridge for professional sounds
- DAW sync via MIDI clock
- Ableton Link support

## Long-term Vision

**Collaborative Features**
- Multi-user composition sessions
- Version control for compositions
- Community pattern/preset library

**Extended Formats**
- Microtuning and custom temperaments
- Extended just intonation support
- Non-Western scale systems

**Visual Tools**
- Piano roll editor
- Arrangement timeline view
- Waveform visualization

---

# Contributing

Contributions are welcome. The codebase is organized as:

```
src/
  cli/           - Command-line interface
  engine/        - Compilation and playback
  output/        - Export formats (MIDI, ABC)
  schema/        - JSON schema and validation
  theory/        - Music theory utilities (scales, chords, rhythm, transformations)
examples/        - Example compositions
player.html      - Browser-based player
```

Run tests with `npm test`. Format specification changes should be reflected in both the JSON schema (`src/schema/etherscore.schema.json`) and this README.

---

# License

MIT
