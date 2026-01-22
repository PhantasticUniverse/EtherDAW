# EtherDAW Architecture

A comprehensive technical architecture document for EtherDAW - a Digital Audio Workstation designed for LLMs to compose music.

---

## Overview

EtherDAW is built around the **EtherScore** JSON format - a declarative notation system that describes musical intent rather than low-level audio operations. The system operates across three environments: Node.js CLI, browser, and interactive REPL.

### Design Philosophy

- **Declarative, not imperative**: Music is defined as structure describing intent, not sequences of commands
- **LLM-friendly**: Semantic parameters (0-1 scale), human-readable syntax, no state mutations required
- **Pattern-based**: Patterns are reusable, composable units with transformation capabilities
- **Two-layer validation**: JSON Schema (structural) + Custom validator (semantic)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                             │
├─────────────────────────────────────────────────────────────────────┤
│  CLI (Commander.js)  │  REPL (readline)  │  Browser (player.html)  │
└──────────┬───────────┴────────┬──────────┴───────────┬──────────────┘
           │                    │                      │
           ▼                    ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CORE ENGINE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Validator  │───▶│   Compiler   │───▶│   Renderer   │          │
│  │  (2-layer)   │    │  (Timeline)  │    │  (Tone.js)   │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│          │                   │                   │                  │
│          ▼                   ▼                   ▼                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │    Parser    │    │   Theory     │    │  Synthesis   │          │
│  │  (notes,     │    │  (scales,    │    │  (presets,   │          │
│  │   chords)    │    │   chords)    │    │   effects)   │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
           │                    │                      │
           ▼                    ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           OUTPUT                                    │
├─────────────────────────────────────────────────────────────────────┤
│     WAV Audio     │     MIDI File     │     Real-time Playback     │
└───────────────────┴───────────────────┴─────────────────────────────┘
```

---

## Directory Structure

```
src/
├── schema/                 # Type definitions and validation
│   ├── types.ts           # Core TypeScript interfaces
│   ├── etherscore.schema.json  # JSON Schema
│   └── validator.ts       # Semantic validator
│
├── config/
│   └── constants.ts       # Single source of truth for constants
│
├── parser/                # Text parsing layer
│   ├── note-parser.ts     # Parse "C4:q@0.8" syntax
│   ├── chord-parser.ts    # Parse "Am7:h" notation
│   ├── pattern-expander.ts # Expand patterns to note lists
│   └── json-preprocessor.ts # Handle comment keys
│
├── engine/                # Compilation and execution
│   ├── compiler.ts        # EtherScore → Timeline
│   ├── pattern-resolver.ts # Resolve patterns with humanization
│   ├── timeline.ts        # Timeline building
│   ├── articulation.ts    # Jazz articulations/ornaments
│   └── automation.ts      # Automation curves
│
├── theory/                # Music theory algorithms
│   ├── scales.ts          # Scale management
│   ├── chords.ts          # Chord building/analysis
│   ├── rhythm.ts          # Swing, grooves, humanization
│   ├── euclidean.ts       # Euclidean rhythms
│   ├── transformations.ts # Pattern transforms
│   └── voice-leading.ts   # Voice-led progressions
│
├── generative/            # Generative composition
│   ├── markov.ts          # Markov chain generation
│   ├── markov-presets.ts  # Preset transition matrices
│   ├── continuation.ts    # Melodic development
│   ├── density.ts         # Note density curves
│   └── tension.ts         # Tension mapping
│
├── synthesis/             # Audio synthesis
│   ├── instruments.ts     # 62 instrument presets
│   ├── presets.ts         # Detailed configurations
│   ├── instrument-factory.ts # Create from specs
│   ├── tone-renderer.ts   # Render via Tone.js
│   ├── drum-kits.ts       # Drum kit definitions
│   ├── layer-synth.ts     # Multi-layer instruments
│   ├── lfo.ts             # LFO modulation
│   └── semantic-params.ts # Semantic → Tone.js mapping
│
├── output/                # Export formats
│   ├── midi-export.ts     # MIDI generation
│   ├── wav-export.ts      # WAV export
│   └── abc-export.ts      # ABC notation
│
├── analysis/              # Audio analysis
│   ├── benchmark-verifier.ts # Quality verification
│   ├── spectrogram.ts     # Visual analysis
│   └── fft.ts             # FFT implementation
│
├── cli/                   # Command-line interface
│   ├── cli.ts             # CLI entry point
│   └── repl/
│       ├── repl.ts        # Interactive REPL
│       ├── state.ts       # Session management
│       └── commands.ts    # Command implementations
│
├── node/                  # Node.js specific
│   ├── player.ts          # Offline playback
│   └── audio-context.ts   # System audio output
│
├── browser/               # Browser bundle
│   ├── index.ts           # Browser entry
│   └── player.ts          # Browser Player API
│
├── transforms/            # Pattern transformations
│   ├── transpose.ts
│   ├── stretch.ts
│   └── velocity.ts
│
└── index.ts               # Public API exports
```

---

## Data Flow Pipeline

### Stage 1: Load & Validate

```
EtherScore JSON File
        │
        ▼
┌───────────────────┐
│   JSON Parser     │  Strip comments, parse JSON
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Schema Validator │  Structural validation (Ajv)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Semantic Validator│  References, ranges, note syntax
└─────────┬─────────┘
          │
          ▼
   Validated EtherScore
```

### Stage 2: Compile to Timeline

```
Validated EtherScore
        │
        ▼
┌───────────────────────────────────────┐
│              Compiler                  │
│                                        │
│  For each section in arrangement:      │
│    ┌─────────────────────────────┐    │
│    │    Pattern Resolver         │    │
│    │  - Handle parallel patterns │    │
│    │  - Apply humanization       │    │
│    │  - Apply swing/groove       │    │
│    │  - Calculate density        │    │
│    └────────────┬────────────────┘    │
│                 │                      │
│                 ▼                      │
│    ┌─────────────────────────────┐    │
│    │    Timeline Builder         │    │
│    │  - Add notes at positions   │    │
│    │  - Track tempo changes      │    │
│    │  - Calculate timing         │    │
│    └────────────┬────────────────┘    │
│                 │                      │
└─────────────────┼──────────────────────┘
                  │
                  ▼
           Timeline Object
    (all notes with absolute timing)
```

### Stage 3: Synthesis & Rendering

```
Timeline Object
        │
        ▼
┌───────────────────────────────────────┐
│           Tone Renderer               │
│                                        │
│  ┌────────────────────────────────┐   │
│  │    Instrument Creation         │   │
│  │  - Resolve preset              │   │
│  │  - Apply semantic params       │   │
│  │  - Build effect chain          │   │
│  │  - Setup LFO, EQ, compression  │   │
│  └────────────────────────────────┘   │
│                                        │
│  ┌────────────────────────────────┐   │
│  │    Note Scheduling             │   │
│  │  - Resolve pitch/frequency     │   │
│  │  - Apply timing offset         │   │
│  │  - Handle probability          │   │
│  │  - Schedule attack/release     │   │
│  │  - Apply articulations         │   │
│  └────────────────────────────────┘   │
│                                        │
└─────────────────┬─────────────────────┘
                  │
                  ▼
           Audio Output
   (Browser: Web Audio API)
   (Node: Offline → WAV file)
```

---

## Core Data Structures

### EtherScore (Input Document)

```typescript
interface EtherScore {
  meta?: {
    title?: string;
    composer?: string;
    description?: string;
  };

  settings: {
    tempo: number;           // 20-300 BPM
    key?: string;            // "C major", "A minor"
    timeSignature?: string;  // "4/4", "3/4"
    swing?: number;          // 0-1
  };

  instruments?: Record<string, Instrument>;
  patterns: Record<string, Pattern>;
  sections: Record<string, Section>;
  arrangement: string[];     // Section order
}
```

### Instrument Definition

```typescript
interface Instrument {
  preset?: string;           // "fm_epiano", "warm_pad"

  // Semantic parameters (LLM-friendly, 0-1 scale)
  params?: {
    brightness?: number;     // Filter cutoff
    warmth?: number;         // Sustain, resonance
    richness?: number;       // Detuning, harmonics
    attack?: number;         // ADSR attack
    decay?: number;          // ADSR decay
    sustain?: number;        // ADSR sustain
    release?: number;        // ADSR release
    punch?: number;          // Transient emphasis
    movement?: number;       // Modulation depth
    space?: number;          // Reverb/delay
  };

  volume?: number;           // dB
  pan?: number;              // -1 to 1
  effects?: Effect[];

  // Advanced features
  layers?: InstrumentLayer[];  // Multi-layer
  lfo?: LFOConfig;             // Modulation
  eq?: EQConfig;               // Parametric EQ
  compression?: CompressionConfig;
}
```

### Pattern Types

```typescript
interface Pattern {
  // Simple patterns
  notes?: string[];          // ["C4:q", "E4:q", "G4:h"]
  chords?: string[];         // ["Am7:h", "Dm7:h"]
  degrees?: number[];        // [1, 3, 5] (scale degrees)

  // Rhythmic patterns
  arpeggio?: ArpeggioConfig;
  drums?: DrumPattern;
  euclidean?: EuclideanConfig;

  // Generative patterns
  markov?: MarkovConfig;
  continuation?: ContinuationConfig;
  voiceLead?: VoiceLeadConfig;

  // Modulation
  envelope?: VelocityEnvelope; // crescendo, diminuendo
  groove?: GrooveTemplate;     // funk, dilla, dnb
}
```

### Timeline Event

```typescript
interface NoteEvent {
  type: 'note';
  startBeat: number;
  startTime: number;         // Seconds
  pitch: string;             // "C4"
  duration: number;          // Beats
  durationSeconds: number;
  velocity: number;          // 0-1
  instrument: string;

  // Expression
  timingOffset?: number;     // ms
  probability?: number;      // 0-1
  portamento?: boolean;
  humanize?: number;

  // Articulation
  articulation?: 'staccato' | 'legato' | 'accent';
  jazzArticulation?: 'fall' | 'doit' | 'scoop' | 'bend';
  ornament?: 'tr' | 'mord' | 'turn';
}
```

---

## Validation System

EtherDAW uses a two-layer validation approach:

### Layer 1: JSON Schema

**File:** `src/schema/etherscore.schema.json`

- Structural validation using Ajv
- Checks types, required fields, enum values
- Fast, standard JSON Schema validation

### Layer 2: Semantic Validator

**File:** `src/validation/validator.ts`

- Reference validation (patterns exist, instruments defined)
- Note/chord syntax validation via regex
- Range validation (tempo 20-300, velocity 0-1)
- Musical constraint validation (Markov states, voice counts)
- Friendly error messages with suggestions

### When Adding Features

| Feature Type | Schema Update | Validator Update |
|--------------|---------------|------------------|
| New pattern type | Add to pattern.properties | Add validation function |
| New instrument option | Add to instrument.properties | Validate values/ranges |
| New note syntax | N/A | Update NOTE_REGEX |
| New effect type | Add to effect.type.enum | Update VALID_EFFECTS |
| New preset | N/A | Add to VALID_SYNTH_PRESETS |

---

## Synthesis Pipeline

### Instrument Creation

```
Instrument Definition
        │
        ▼
┌─────────────────────────────┐
│   Preset Lookup             │
│   presets.ts → Tone.js      │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Semantic Param Mapping    │
│   0-1 → Tone.js ranges      │
│   brightness → filter       │
│   warmth → sustain          │
│   space → reverb            │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Effect Chain              │
│   reverb, delay, filter,    │
│   distortion, EQ, comp      │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Optional: Layering        │
│   Multiple detuned synths   │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Optional: LFO             │
│   Modulate filter, pan, etc │
└─────────────┬───────────────┘
              │
              ▼
        Tone.js Instrument
```

### Drum Synthesis

EtherDAW uses synth pools for simultaneous hits:

```
Drum Kit (808, 909, acoustic, lofi)
        │
        ▼
┌─────────────────────────────┐
│   Per-drum synth pool (4)   │
│   Round-robin allocation    │
└─────────────────────────────┘
        │
        ├── Membrane Synth (kick, toms)
        │   - Frequency-based pitch
        │   - Pitch decay envelope
        │
        ├── Noise Synth (hats, snare)
        │   - White/pink/brown noise
        │   - Shaped envelope
        │
        └── Metal Synth (cymbals)
            - Harmonicity parameter
            - Modulation index
```

### 62 Instrument Presets

| Category | Presets |
|----------|---------|
| FM Synths | fm_epiano, fm_bass, fm_brass, fm_bell, fm_glass |
| Pads | warm_pad, dark_pad, ambient_pad, string_pad |
| Bass | sub_bass, synth_bass, pluck_bass, 808_bass |
| Leads | soft_lead, saw_lead, square_lead, analog_mono |
| Keys | lofi_keys, kalimba, music_box, electric_piano |
| Basic | sawtooth, sine, square, triangle |

---

## REPL System

### Architecture

```
User Input
    │
    ▼
┌──────────────────┐
│  readline        │
│  interface       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  parseCommand()  │
│  → cmd + args    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  REPLSession     │
│  executeCommand()│
└────────┬─────────┘
         │
         ├── Modify state (load, transpose, etc.)
         ├── Update Player
         └── Return result
         │
         ▼
┌──────────────────┐
│  Dynamic Prompt  │
│  [file *▶]>      │
└──────────────────┘
```

### Session State

```typescript
interface REPLState {
  filePath?: string;           // Current file
  score?: EtherScore;          // Loaded composition
  timeline?: Timeline;         // Compiled timeline
  modified: boolean;           // Unsaved changes
  tempoOverride?: number;      // Live tempo change
  patternMods: Map<string, PatternModification>;
  variables: Map<string, PatternVariable>;
}

interface PatternModification {
  transpose?: number;
  stretch?: number;
  velocity?: number;
  reverse?: boolean;
  invert?: string;
  shuffle?: boolean;
  rotate?: number;
  transformHistory: TransformRecord[];
}
```

### Available Commands

| Command | Description |
|---------|-------------|
| `load <file>` | Load EtherScore file |
| `play [pattern]` | Play composition or pattern |
| `stop` | Stop playback |
| `tempo <bpm>` | Change tempo |
| `transpose <pat> <n>` | Transpose pattern |
| `reverse <pat>` | Reverse pattern |
| `list patterns` | List available patterns |
| `preview <pat>` | ASCII pitch visualization |
| `describe <pat>` | Verbal pattern analysis |
| `spectrum [section]` | Frequency band distribution |
| `timeline` | Time-domain energy visualization |
| `save [file]` | Save composition |
| `export <file>` | Export to WAV/MIDI |

---

## Extension Points

### Adding New Presets

**File:** `src/synthesis/presets.ts`

```typescript
export const PRESETS = {
  'my_preset': {
    name: 'My Synth',
    category: 'synth',
    create: () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 },
    }),
  },
};
```

Then add to `VALID_SYNTH_PRESETS` in `validator.ts`.

### Adding New Pattern Types

1. Define interface in `src/schema/types.ts`
2. Add to Pattern interface
3. Add JSON Schema in `etherscore.schema.json`
4. Implement in `src/parser/pattern-expander.ts`
5. Add validator in `validator.ts`

### Adding New Groove Templates

**File:** `src/theory/rhythm.ts`

```typescript
export const GROOVE_TEMPLATES = {
  my_groove: {
    timingOffsets: [0, 0.05, -0.03, 0.02],
    velocityOffsets: [0, 0.1, -0.05, 0.05],
    durations: [1, 1, 1, 1],
  },
};
```

### Adding New REPL Commands

**File:** `src/cli/repl/commands.ts`

```typescript
{
  name: 'mycommand',
  aliases: ['mc'],
  description: 'Does something',
  usage: 'mycommand <arg>',
  execute: async (session, args) => {
    // Implementation
    return { success: true, message: 'Done' };
  },
},
```

---

## Build System

### Build Commands

```bash
npm run build          # TypeScript → JavaScript
npm run build:browser  # ESBuild bundle for browser
npm run build:all      # Full build + browser + manifest
npm test              # Run tests
```

### Output Structure

```
dist/
├── index.js           # Main entry
├── cli.js             # CLI entry (bin)
├── etherdaw-browser.js # Browser bundle
└── schema/
    └── etherscore.schema.json
```

### Browser Integration

The browser bundle (`etherdaw-browser.js`) exposes:

```javascript
const player = new EtherDAW.Player();
await player.load(etherscoreJson);
await player.play();
player.stop();
await player.exportWav('output.wav');
```

---

## Version History

| Version | Features |
|---------|----------|
| v0.1-0.5 | Core format, basic synthesis |
| v0.6 | Generative primitives (Markov, voice-leading) |
| v0.7 | Density curves, conditional patterns |
| v0.8 | LFO, layering, EQ, compression, articulations |
| v0.81 | Drum aliases, noise presets |
| v0.82 | EtherREPL, Node.js audio playback |
| v0.83 | Pattern algebra, transforms, visualizations |

---

## Key Implementation Patterns

### Factory Pattern
- `createInstrument()` - Tone.js synth from preset
- `createLayerSynth()` - Multi-layer instruments
- `createDrumSynth()` - Drum synths from kit params

### Builder Pattern
- `TimelineBuilder` - Accumulate events, build timeline
- `ToneRenderer` - Initialize instruments, schedule, render

### Strategy Pattern
- Pattern expansion (notes, chords, markov, etc.)
- Humanization (timing, velocity, duration)
- Transformations (transpose, invert, reverse)

### Visitor Pattern
- Validation traversal
- Compilation traversal

---

## Performance Considerations

- **Pattern caching**: Expanded patterns cached during compilation
- **Drum pools**: 4 synths per drum type for simultaneous hits
- **Offline rendering**: Node.js uses Tone.Offline() for faster-than-realtime
- **Lazy loading**: Presets created on demand
- **Timeline optimization**: Events sorted once, iterated in order

---

## Testing Strategy

- **Unit tests**: Pattern expansion, note parsing, transformations
- **Integration tests**: Full compilation pipeline
- **Audio verification**: `benchmark-verifier.ts` for frequency/timing
- **Benchmark compositions**: `examples/benchmark-*.json`

---

## Future Architecture Considerations

1. **Plugin System**: Dynamic preset/pattern loading
2. **Network REPL**: Web-based collaborative composition
3. **ML Integration**: LLM hooks for prompt-based generation
4. **DAW Bridge**: IPC with other DAWs
5. **Distributed Rendering**: Parallel compilation for large works
