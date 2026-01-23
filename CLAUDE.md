# EtherDAW

A DAW built for LLMs to compose music. EtherScore is the native JSON notation: patterns, structure, intent.

## Note Syntax (v0.8)

`<pitch><octave>:<duration>[modifiers]`

```
C4:q           Basic note
C4:q.          Dotted (1.5x)
C4:8t3         Triplet
C4:q*          Staccato
C4:q~          Legato
C4:q>          Accent
C4:q~>         Portamento
C4:q.fall      Jazz fall
C4:q.tr        Trill
C4:q@mf        Dynamics (pp,p,mp,mf,f,ff)
C4:q?0.7       70% probability
r:q            Rest
```

**Compact**: `"notes": "C4:q E4:q G4:h | D4:q F4:q A4:h"`

**Chords**: `Am7:h`, `Dm9/F:q`, `G7sus4:w`

## Instruments

```json
{
  "lead": {
    "preset": "fm_epiano",
    "params": { "brightness": 0.7, "warmth": 0.5 },
    "volume": -3,
    "effects": [{ "type": "reverb", "wet": 0.3 }]
  }
}
```

**Layering (v0.8)**: `"layers": [{ "preset": "saw", "detune": -5 }, { "preset": "saw", "detune": 5 }]`

**LFO (v0.8)**: `"lfo": { "rate": "8n", "target": "filterCutoff", "depth": 0.5 }`

## Patterns

- `notes` / `chords` / `degrees` - Melodic content
- `arpeggio` - Auto-arpeggiate chords
- `drums` - Step notation (`x...x...`) or hit arrays
- `euclidean` - Algorithmic rhythms
- `markov` - Generative with presets (`walking_bass`, `melody_stepwise`)
- `voiceLead` - Voice-led progressions
- `velocityEnvelope` - `crescendo`, `diminuendo`, `swell`

**Drums shorthand (v0.81)**: `{ "kit": "909", "kick": "x...", "snare": "...x" }`

**Drum aliases (v0.81)**: `openhat`→`hihat_open`, `closedhat`→`hihat`, `bd`→`kick`

**Noise presets (v0.81)**: `noise`, `pink_noise`, `brown_noise`, `vinyl_crackle`, `noise_sweep`

## Track Options

```json
{ "pattern": "melody", "repeat": 4, "velocity": 0.8, "humanize": 0.02, "groove": "dilla" }
```

**Grooves (14)**: `straight`, `shuffle`, `funk`, `laid_back`, `dilla`, `reggae`, `dnb`, `trap`, `gospel`, `bossa`, `afrobeat`...

## Key Files

| File | Purpose |
|------|---------|
| `docs/ETHERSCORE_FORMAT.md` | Complete format spec |
| `docs/DEVELOPMENT.md` | Dev guide (validation, adding features) |
| `docs/LLM_COMPOSER_GUIDE.md` | Practical guide for AI composers |
| `docs/SPECTROGRAM_WORKFLOW.md` | Visual verification workflow |
| `src/schema/types.ts` | All TypeScript types/interfaces |
| `src/config/constants.ts` | Constants (durations, MIDI, grooves) |
| `src/utils/` | Consolidated utilities (math, time, pitch, format) |
| `src/presets/` | **Preset registry** - single source of truth for all 67 presets |
| `src/presets/index.ts` | Preset query API (getPreset, findPresets, suggestPreset) |
| `src/synthesis/instruments.ts` | Instrument factory (createInstrument) |
| `src/validation/validator.ts` | Two-layer validation |
| `src/analysis/benchmark-verifier.ts` | Audio verification tools |
| `examples/benchmark-*.etherscore.json` | Feature benchmarks (11 files) |
| `examples/archive/*.etherscore.json` | Full compositions |

## Commands

```bash
npm run build:all          # Full build
npm test                   # Tests
npm run generate:benchmarks # MIDI export + analysis
npm run generate:references # Reference signal spectrograms
open player.html           # Listen (browser)
```

## EtherREPL (v0.82)

Interactive composition environment for live coding workflow.

```bash
npx tsx src/cli.ts repl                                    # Start REPL
npx tsx src/cli.ts play examples/techno-signal.json        # Play from CLI
npx tsx src/cli.ts preview file.json --pattern acid_line   # Preview pattern
```

**REPL Commands:**
```
load <file>              Load EtherScore file
play [pattern]           Play all or specific pattern
stop                     Stop playback
tempo <bpm>              Change tempo
transpose <pat> <semi>   Transpose pattern
list patterns            List available patterns
list instruments         List instruments
save [file]              Save current state
quit                     Exit REPL
```

**Pattern Transforms:**
```
transpose <pattern> 5    # Up 5 semitones
stretch <pattern> 0.5    # Half speed
velocity <pattern> 0.8   # Scale velocity to 80%
```

**Live Coding Workflow:**
1. `load` a composition
2. `play` to hear it
3. `transpose`, `stretch`, or modify patterns
4. Hear changes immediately
5. `save` when satisfied

See [docs/VISION.md](docs/VISION.md) for the long-term architecture.

## Perceptual Analysis (v0.9)

Audio analysis that lets LLMs "hear" through visual and textual proxies. Closes the feedback loop: compose → render → analyze → understand → adjust.

**REPL Analysis Commands:**
```
analyze [section]        Full perceptual analysis report
chroma [section]         Chromagram (pitch class distribution)
brightness [section]     Spectral centroid over time
energy [section]         RMS loudness curve
compare <sec1> <sec2>    Side-by-side section comparison
```

**Analysis Metrics:**
| Metric | Description | LLM Utility |
|--------|-------------|-------------|
| Chromagram | 12-semitone pitch class distribution | Shows active pitches, infers key |
| Spectral Centroid | Weighted center of frequency (Hz) | Brightness (warm/bright/harsh) |
| Spectral Flux | Frame-to-frame spectral change | Onset detection, rhythmic activity |
| RMS Energy | Root mean square amplitude (dB) | Loudness over time |
| Zero Crossing Rate | Sign changes per second | Percussive vs tonal character |

**Example Session:**
```
ether> load examples/archive/threshold/01-before-dawn.etherscore.json
Loaded: Before Dawn

ether> play awakening
Playing...

ether> analyze awakening
═══════════════════════════════════════════════════════
Audio Analysis: awakening
═══════════════════════════════════════════════════════

SPECTRAL PROFILE:
  Warm (centroid: 680 Hz) - mid-bass focused
  Smooth (flux: 8%) - sustained, pad-like

CHROMAGRAM:
   C │████████████████████│ 18%
  C# │░░░░░░░░░░░░░░░░░░░░│  2%
   D │██████████████░░░░░░│ 15% ◄
   ...

OBSERVATIONS:
  • Very warm, bass-focused frequency balance
  • Clear harmonic focus - simple, direct tonality

ether> compare awakening emergence
Comparing sections...
                   awakening    emergence
Brightness:        warm         neutral
Centroid:          680 Hz       1,240 Hz
...

Differences:
  • emergence is BRIGHTER (+560 Hz centroid)
  • emergence is LOUDER (+6 dB)

Transition assessment: Good contrast (noticeable but natural)
```

**Key Files:**
| File | Purpose |
|------|---------|
| `src/analysis/perceptual.ts` | Perceptual metrics (chromagram, centroid, flux, RMS, ZCR) |
| `src/analysis/describe-audio.ts` | Natural language descriptions |
| `src/analysis/audio-analyzer.ts` | Unified audio buffer access |

## Verification Workflow

1. **Validate**: `npx tsx src/cli.ts validate myfile.etherscore.json`
2. **Compile**: `npx tsx src/cli.ts compile myfile.etherscore.json`
3. **Listen**: Open `player.html`, load file, play
4. **Analyze**: Use benchmark verifier for automated checks

**Analysis tools** (`src/analysis/benchmark-verifier.ts`):
- `verifyFrequencyContent()` - Check expected frequency range
- `verifyTiming()` - Verify note onset timing
- `verifyDynamics()` - Check amplitude envelope
- `detectArtifacts()` - Find clicks, pops, DC offset

## Composition Philosophy

When composing and hitting a limitation:
1. **Don't work around it** - Don't change your intended composition to fit DAW limitations
2. **Improve the DAW** - Add the missing feature, preset, or syntax support
3. **Document the change** - Update docs/DEVELOPMENT.md changelog
4. **Test thoroughly** - Run tests, validate compositions, listen in browser

Examples of DAW improvements over workarounds:
- Missing `openhat` drum name? Add drum aliases, not rename in composition
- No noise presets? Add them to presets.ts, not use a different sound
- Drums require verbose `"lines"` wrapper? Add shorthand detection

## Claude Code Integration (v0.82.5)

Commands: `/compose`, `/verify`, `/plan`, `/onboard`, `/validate`

See `.claude/README.md` for skills, agents, hooks, and full documentation.

## Utilities (v0.9.1)

Consolidated utility modules in `src/utils/`:

| Module | Functions |
|--------|-----------|
| `math.ts` | `clamp`, `clamp01`, `lerp`, `remap`, `dbToLinear`, `randomDeviation` |
| `time.ts` | `beatsToSeconds`, `secondsToBeats`, `formatTime`, `parseTimeSignature` |
| `pitch.ts` | `pitchToMidi`, `midiToPitch`, `transposePitch`, `midiToFrequency` |
| `format.ts` | `formatHz`, `formatDb`, `progressBar`, `pluralize`, `formatList` |

```typescript
import { clamp01, beatsToSeconds, pitchToMidi, formatHz } from './utils/index.js';
```

## Presets (v0.9.1)

Unified preset registry in `src/presets/` with 67 presets across 14 categories.

**Categories**: synth, bass, pad, lead, keys, pluck, fm, texture, drums, lofi, cinematic, world, ambient, modern

**Query API**:
```typescript
import { getPreset, findPresets, suggestPreset, isValidPreset } from './presets/index.js';

// Get preset by name (supports aliases)
const preset = getPreset('fm_epiano');      // Direct
const preset = getPreset('rhodes');         // Alias → fm_epiano

// Query presets
const warmPads = findPresets({ category: 'pad', minWarmth: 0.7 });
const bassPresets = findPresets({ category: 'bass' });

// Typo suggestions for error messages
const suggestions = suggestPreset('fm_epino');  // → ['fm_epiano']

// Validation
if (!isValidPreset(name)) { /* handle error */ }
```

**Adding a New Preset**: Edit the relevant category file in `src/presets/` (e.g., `bass.ts`, `pad.ts`). The registry automatically aggregates all presets.

**Aliases**: Defined in `src/presets/index.ts`. Support old names and alternative naming conventions.

## Conventions

- Duration: `w` `h` `q` `8` `16` `32`
- Velocity: 0-1 internally
- **Two-layer validation**: Update both `etherscore.schema.json` AND `validator.ts` when adding features
- **Single source of truth**: Use utilities from `src/utils/` and presets from `src/presets/`
