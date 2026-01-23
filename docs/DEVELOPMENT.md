# EtherDAW Development Guide

This document explains the internal architecture and what needs to be updated when making changes to EtherDAW.

## Validation System

EtherDAW uses a **two-layer validation system**:

1. **JSON Schema** (`src/schema/etherscore.schema.json`) - Structural validation using Ajv
2. **Custom Validator** (`src/validation/validator.ts`) - Semantic validation with friendly error messages

### When Adding New Features

**Both files must be updated** when adding new pattern types, instrument options, or syntax features:

| Feature Type | JSON Schema Update | Validator Update |
|--------------|-------------------|------------------|
| New pattern property (e.g., `markov`) | Add to `definitions.pattern.properties` | Add validation in `validatePatterns()` |
| New instrument property (e.g., `layers`) | Add to `definitions.instrument.properties` | Add validation in `validateInstruments()` |
| New note syntax (e.g., `.fall`) | N/A (schema doesn't parse notes) | Update `NOTE_REGEX` constant |
| New effect type | Add to `definitions.effect.properties.type.enum` | Add to `VALID_EFFECT_TYPES` |
| New synth preset | N/A | Add to `src/presets/{category}.ts` (auto-registered) |

### JSON Schema Location

```
src/schema/etherscore.schema.json  # Source file
dist/schema/etherscore.schema.json # Copied during build
```

The schema is copied to `dist/` during `npm run build`. The browser player loads it from `dist/schema/`.

### Custom Validator Location

```
src/validation/validator.ts        # Main validator
src/validation/index.ts            # Re-exports
```

### Comment Keys

EtherScore JSON files support comment keys for documentation:

```json
{
  "// SECTION": "This is a comment - ignored by validation",
  "_comment_intro": "Another comment style",
  "patterns": { ... }
}
```

**Comment key patterns**:
- `// ...` - JavaScript-style comments
- `_comment_...` - Underscore-prefixed comments
- `$schema` - JSON Schema reference (optional)

Both the JSON Schema and custom validator skip these keys during validation.

**Implementation**:

In `validator.ts`:
```typescript
function isCommentKey(key: string): boolean {
  return key.startsWith('//') || key.startsWith('_comment') || key === '$schema';
}
```

In `etherscore.schema.json`:
```json
"additionalProperties": true  // Allows comment keys to pass
```

## Note Syntax Validation

The custom validator uses `NOTE_REGEX` to validate note strings. When adding new note syntax features:

1. Update `NOTE_REGEX` in `validator.ts`
2. Update `src/parser/note-parser.ts` to actually parse the new syntax
3. Update `docs/ETHERSCORE_FORMAT.md` with the new syntax

Current note syntax (v0.8):
```
C4:q           # Basic: pitch:duration
C4:q.          # Dotted
C4:8t3         # Tuplet (triplet)
C4:q*          # Staccato
C4:q~          # Legato
C4:q>          # Accent
C4:q^          # Marcato
C4:q~>         # Portamento
C4:q.fall      # Jazz fall
C4:q.doit      # Jazz doit
C4:q.scoop     # Jazz scoop
C4:q.bend+2    # Pitch bend
C4:q.tr        # Trill
C4:q.mord      # Mordent
C4:q.turn      # Turn
C4:q@0.8       # Velocity
C4:q@mf        # Dynamic marking
C4:q+10ms      # Timing offset
C4:q?0.7       # Probability
r:q            # Rest
```

## Adding New Pattern Types

Example: Adding a new `transform` pattern type:

### 1. Update JSON Schema

In `src/schema/etherscore.schema.json`, add to `definitions.pattern.properties`:

```json
"transform": {
  "type": "object",
  "description": "Pattern transformation",
  "required": ["source", "operation"],
  "properties": {
    "source": { "type": "string" },
    "operation": { "type": "string" },
    "params": { "type": "object" }
  }
}
```

### 2. Update Custom Validator

In `src/validation/validator.ts`, add validation in `validatePatterns()`:

```typescript
if (pattern.transform) {
  if (!pattern.transform.source) {
    errors.push({
      path: `${path}.transform.source`,
      message: 'Transform requires a source pattern',
      severity: 'error'
    });
  }
  if (!ctx.patterns[pattern.transform.source]) {
    warnings.push({
      path: `${path}.transform.source`,
      message: `Source pattern "${pattern.transform.source}" not found`,
      severity: 'warning'
    });
  }
}
```

### 3. Implement the Feature

Add actual implementation in the relevant module (e.g., `src/parser/pattern-expander.ts`).

### 4. Update Documentation

Update `docs/ETHERSCORE_FORMAT.md` with the new pattern type.

### 5. Add Tests

Add tests in the relevant `*.test.ts` file.

## Adding New Presets

### Synth Presets (v0.9.1)

Presets are organized by category in `src/presets/`. To add a new preset:

1. Find the appropriate category file (e.g., `bass.ts`, `pad.ts`, `lead.ts`)
2. Add the preset definition:
```typescript
// In src/presets/bass.ts
export const BASS_PRESETS: Record<string, PresetDefinition> = {
  // ... existing presets

  new_bass_preset: {
    name: 'New Bass Preset',
    category: 'bass',
    description: 'Description of the sound character',
    type: 'monosynth',  // polysynth, monosynth, fmsynth, membrane, noise
    base: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
      filterEnvelope: { /* optional for monosynth */ }
    },
    semanticDefaults: { brightness: 0.5, warmth: 0.7 },  // optional
    tags: ['punchy', 'modern'],  // optional, for discovery
  },
};
```

3. The registry automatically picks up new presets (no validator update needed!)

4. If adding aliases for backward compatibility, update `PRESET_ALIASES` in `src/presets/index.ts`

### Drum Kit Presets

1. Add to `src/synthesis/drum-kits.ts`
2. Add to `VALID_DRUM_KITS` in `src/validation/validator.ts`

### Markov Presets

1. Add to `src/generative/markov-presets.ts`
2. No validator update needed (presets are validated at runtime)

## Build Pipeline

```bash
npm run build          # TypeScript compile + copy schema
npm run build:browser  # Bundle for browser (esbuild)
npm run build:manifest # Generate composition manifest
npm run build:all      # All of the above
```

**Important**: After modifying the JSON Schema, run `npm run build` to copy it to `dist/`.

## Testing Changes

1. Run unit tests: `npm test`
2. Build manifest (validates all compositions): `npm run build:manifest`
3. Manual test in browser: `open player.html`

If compositions fail validation after your changes:
- Check JSON Schema allows the new syntax (`additionalProperties: true` may be needed)
- Check custom validator doesn't reject the new pattern type
- Check for typos in enum values

## Common Issues

### "Invalid property X in patterns"
The JSON Schema is rejecting an unknown property. Either:
- Add the property to `definitions.pattern.properties` in the schema
- Or ensure `additionalProperties: true` is set on the pattern definition

### "Pattern X not found"
The custom validator is warning about a referenced pattern that doesn't exist. Check:
- Pattern name spelling
- Pattern is defined in the `patterns` object

### "Invalid note format"
The `NOTE_REGEX` doesn't match the note syntax. Update the regex to support the new format.

### Validation passes but playback fails
The validators only check structure, not semantics. The actual parsing/rendering code may have additional requirements.

## File Reference

| File | Purpose |
|------|---------|
| `src/schema/etherscore.schema.json` | JSON Schema for structural validation |
| `src/schema/types.ts` | TypeScript type definitions |
| `src/validation/validator.ts` | Custom semantic validator |
| `src/parser/note-parser.ts` | Parses note syntax to events |
| `src/parser/chord-parser.ts` | Parses chord syntax |
| `src/parser/pattern-expander.ts` | Expands patterns to note arrays |
| `src/engine/pattern-resolver.ts` | Resolves tracks to timelines |
| `src/presets/` | Preset registry (single source of truth for 67 presets) |
| `src/presets/index.ts` | Preset query API (getPreset, findPresets, suggestPreset) |
| `src/synthesis/instruments.ts` | Instrument factory (createInstrument) |
| `src/synthesis/presets.ts` | [DEPRECATED] Legacy preset definitions |
| `src/generative/markov-presets.ts` | Markov chain presets |
| `docs/ETHERSCORE_FORMAT.md` | User-facing format documentation |

## Changelog

### v0.9.2 (2026-01-23) - Node Player Rendering & Sound Design Improvements

**Problem:** Node player WAV exports had poor audio quality and unrealistic instrument sounds.

**Root Causes Fixed:**
1. **Generic drum synthesis** - Node player only recognized kick/snare/hihat, other drums were noise bursts
2. **No instrument volumes** - Volume settings from composition were ignored
3. **No RMS normalization** - Quiet signals weren't boosted to audible levels
4. **String velocity values** - Track-level `"velocity": "crescendo"` caused NaN values
5. **Noise/metal presets rendered as pitched tones** - Shekere and agogo played as synth tones instead of noise/bell sounds
6. **Unrealistic agogo bell** - Simple FM synthesis without proper metallic characteristics

**Changes:**
- `src/node/player.ts`:
  - Uses `DRUM_KITS` for proper drum synthesis (membrane/noise/metal types)
  - **NEW**: `instrumentPresets` option passes preset info to renderer
  - Looks up world presets (conga, djembe, agogo, shekere) via `getPreset()`
  - Routes noise/metal/membrane preset types to correct synthesis
  - Applies instrument volumes from composition
  - Applies master volume from settings
  - RMS-based normalization targets -18 dB RMS
  - Soft limiting (tanh-based) prevents clipping
  - **Metal synthesis**: Added modulation envelope decay (bells start bright, become pure)

- `src/presets/world.ts`:
  - **Agogo**: Higher harmonicity (2.414), higher modulation index (15), longer decay (0.5s)
  - **Shekere**: Changed from white to pink noise for more natural shaker sound

- `src/schema/types.ts` & `etherscore.schema.json`:
  - Added `masterVolume` to settings (-60 to +12 dB)

- `src/node/player.test.ts`:
  - New test file with 11 tests for rendering functionality
  - Tests instrument volumes, drum synthesis, RMS normalization

**Results:**
- Spectral centroid: 7234 Hz (harsh) → 1948 Hz (balanced)
- RMS level: -33 dB → -26 dB (audible)
- Character: "noisy" → "sustained, pad-like"

---

### v0.9.1 Phase 2 (2026-01-23) - Preset Consolidation

**Vision:** A preset system that's joyful for LLMs to discover and use.

**Core Changes:**
- **Unified Preset Registry**: Single source of truth in `src/presets/` (67 presets across 14 categories)
- **Query API**: `getPreset()`, `findPresets()`, `suggestPreset()`, `isValidPreset()`
- **Typo Suggestions**: `suggestPreset('fm_epino')` → `['fm_epiano']`
- **Backward-Compatible Aliases**: Old names like `rhodes`, `bass_sub` still work
- **Category Organization**: Presets split into focused files (bass.ts, pad.ts, etc.)

**New Files:**
| File | Purpose |
|------|---------|
| `src/presets/types.ts` | PresetDefinition interface and types |
| `src/presets/index.ts` | Registry with query API |
| `src/presets/{category}.ts` | Preset definitions by category |

**API Examples:**
```typescript
// Find presets
const warmPads = findPresets({ category: 'pad', minWarmth: 0.7 });
const suggestions = suggestPreset('fm_epino');  // → ['fm_epiano']

// Adding a preset: just edit src/presets/{category}.ts - auto-registered!
```

**Benefits:**
- Adding a preset requires editing ONE file
- Validator automatically uses registry (no hardcoded lists)
- Rich discovery for LLM composers
- 39 new tests for preset registry

---

### v0.9.1 Phase 1 (2026-01-23) - Consolidated Utilities

**Core Changes:**
- Created `src/utils/` with consolidated helpers (math, time, pitch, format)
- 112 new unit tests for utilities
- Fixed duplicate code in transforms module

---

### v0.9 (2026-01-23) - Perceptual Foundation

**Vision:** Audio analysis infrastructure that allows LLMs to "hear" through visual and textual proxies. Closes the feedback loop: compose → render → analyze → understand → adjust.

**Core Insight:** Composing blind was the biggest limitation. I could structure music but couldn't evaluate how it sounded.

**New Analysis Commands (REPL):**
| Command | Description |
|---------|-------------|
| `analyze [section]` | Full perceptual analysis report |
| `chroma [section]` | Chromagram (pitch class distribution) |
| `brightness [section]` | Spectral centroid over time |
| `energy [section]` | RMS loudness curve |
| `compare <sec1> <sec2>` | Side-by-side section comparison |

**Perceptual Metrics:**
| Metric | Description | LLM Utility |
|--------|-------------|-------------|
| Chromagram | 12-semitone pitch class distribution | Shows active pitches, infers key |
| Spectral Centroid | Weighted center of frequency (Hz) | Brightness (warm/bright/harsh) |
| Spectral Flux | Frame-to-frame spectral change | Onset detection, rhythmic activity |
| RMS Energy | Root mean square amplitude (dB) | Loudness over time |
| Zero Crossing Rate | Sign changes per second | Percussive vs tonal character |

**Semantic Descriptions:**
- Converts numeric metrics to natural language
- Brightness: "very dark", "warm", "neutral", "bright", "harsh"
- Texture: "smooth", "rhythmic", "choppy"
- Energy: "quiet", "moderate", "loud", "intense"
- Envelope: "building", "decaying", "arc", "steady", "dynamic"
- Character tags: "warm", "subby", "sustained", "pad-like", "tonal", etc.

**Comprehensive Chord Library (~80 chord types):**

| Category | New Chords |
|----------|------------|
| Seventh variations | 7sus4, 7sus2, augmaj7/maj7#5, mM7/minmaj7 |
| Extended chords | 9sus4, 11sus, 13sus4, mM9 |
| Lydian chords | 7#11, maj7#11, 9#11, 13#11 |
| Altered dominants | 7b13, 7b5#9, 7#5b9, 7b9b13, 7#9b13, 7b9#11, 9b5, 9#5, 13b9, 13#9, 7alt |
| Add chords | add2, add4, madd2, madd4 |
| Quartal/special | quartal, quartal4, quintal, so_what, mu |
| Power/dyads | power8, octave |
| Shell voicings | shell7, shellM7, shellm7 |

**Voicing Expansion:**
- drop24, spread, rootless_a, rootless_b, quartal, so_what, freddie, gospel
- Applied to maj7, m7, 7, 9, m9, maj9, dim7, m7b5, 7sus4, 13, 7alt, 7#9, 7b9, add9, 6, m6

**Jazz Progressions (25+ total):**
| Category | Progressions |
|----------|--------------|
| Jazz standards | ii-V-I-7, ii-V-i, rhythm-a, autumn-leaves, coltrane-cycle |
| Contemporary | neo-soul, gospel-extended, backdoor, tritone-sub |
| Advanced | lady-bird, tadd-dameron, all-the-things |

**New Files:**
- `src/analysis/audio-analyzer.ts` - Unified audio buffer access
- `src/analysis/perceptual.ts` - Perceptual metrics implementation
- `src/analysis/describe-audio.ts` - Natural language descriptions

**Modified Files:**
- `src/node/player.ts` - Added buffer caching for analysis
- `src/cli/repl/state.ts` - Added rendered audio access methods
- `src/cli/repl/commands.ts` - New analysis commands
- `src/analysis/spectrogram.ts` - Added ASCII spectrogram output
- `src/analysis/index.ts` - Added new exports
- `src/theory/chords.ts` - Expanded chord library (80+ types, 25+ voicings)
- `src/parser/chord-parser.ts` - Updated regex for new chord formats

**Example Output:**
```
ether> analyze awakening

═══════════════════════════════════════════
Audio Analysis: awakening
═══════════════════════════════════════════

SPECTRAL PROFILE:
  Warm (centroid: 680 Hz) - mid-bass focused
  Smooth (flux: 8%) - sustained, pad-like

CHROMAGRAM:
   C │████████░░░│  D │██████████│  E │████░░░░░░│
   F │████████████│ ◄  G │██████░░░░│  A │████████░░│

ENERGY:
  Moderate (-19 dB) - conversational
  Envelope: Arc - rises then falls

CHARACTER: warm, sustained, pad-like, tonal

OBSERVATIONS:
  • Very warm, bass-focused frequency balance
  • Classic phrase arc - natural musical shape
```

---

### v0.83 (2026-01-23) - Pattern Algebra + Album

**Vision:** Full pattern transformation system plus an 8-track album "Threshold" demonstrating all capabilities.

**Pattern Algebra:**
- **Core Transforms**: `reverse`, `invert`, `shuffle`, `slice`, `rotate` REPL commands
- **Combinators**: `every N <transform>`, `sometimes <transform>` for conditional application
- **Pattern Variables**: `set name = pattern | transform` with pipe syntax chaining
- **Debug Tools**: `show`, `explain`, `diff` for inspecting transformed patterns

**LLM Feedback Tools:**
- `preview <pattern>` - ASCII pitch contour visualization
- `describe <pattern>` - Verbal analysis (contour, range, rhythm, mood)
- `suggest <pattern>` - Generate transform suggestions
- `spectrum [section]` - Frequency band distribution visualization
- `timeline` - Time-domain energy arc visualization

**Format Enhancements:**
- Extended chord support: `add11`, `m7add11`, `maj7add11` compound chords
- Extended dynamics: `@ppp`, `@fff` for extreme dynamic markings

**Files Created:**
- `src/transforms/reverse.ts`, `invert.ts`, `shuffle.ts`, `slice.ts`, `rotate.ts`
- `src/cli/repl/combinators.ts` - Combinator logic
- `examples/album-1-01/` - 8-track album "Threshold"
- `docs/PRD.md` - Comprehensive product requirements document
- `docs/ARCHITECTURE.md` - Technical architecture documentation

**Files Modified:**
- `src/cli/repl/commands.ts` - All new REPL commands
- `src/cli/repl/state.ts` - Pattern modifications, variables, transform history
- `src/parser/chord-parser.ts` - Extended add chord support
- `src/config/constants.ts` - Extended dynamics (@ppp, @fff)
- `src/parser/note-parser.ts` - Extended dynamics regex

**Key Insight:** When composing reveals DAW limitations, improve the DAW instead of compromising the composition.

---

### v0.82 (2026-01-23) - Live Coding Foundation

**Vision:** See [docs/VISION.md](./VISION.md) for the long-term architecture and philosophy.

**New Features:**
- **Node.js audio playback**: Play compositions from the command line without a browser
- **Pattern preview**: `npx tsx src/cli.ts preview file.json --pattern name` to hear individual patterns
- **EtherREPL**: Interactive composition environment with load/play/stop/save commands
- **Pattern transforms**: transpose, stretch, velocity scaling via REPL
- **Composition templates**: Quick-start templates for techno, lofi, ambient genres

**New Files:**
- `src/node/player.ts` - Node.js audio playback using Tone.js
- `src/node/audio-context.ts` - Web Audio API polyfill for Node.js
- `src/cli/repl.ts` - Main REPL loop
- `src/cli/repl/commands.ts` - REPL command implementations
- `src/cli/repl/state.ts` - REPL session state management
- `src/cli/commands/preview.ts` - Pattern preview command
- `src/cli/commands/new.ts` - Template-based composition creation
- `src/transforms/index.ts` - Transform registry
- `src/transforms/transpose.ts` - Pitch transposition
- `src/transforms/stretch.ts` - Time stretching
- `src/transforms/velocity.ts` - Velocity scaling
- `templates/techno.etherscore.json` - Techno composition template
- `templates/lofi.etherscore.json` - Lo-fi composition template
- `templates/ambient.etherscore.json` - Ambient composition template

**REPL Commands (v0.82):**
| Command | Description |
|---------|-------------|
| `load <file>` | Load EtherScore file |
| `play [pattern/section]` | Play audio |
| `stop` | Stop playback |
| `tempo <bpm>` | Change tempo |
| `transpose <pattern> <semitones>` | Transpose pattern |
| `list patterns` | List available patterns |
| `list instruments` | List instruments |
| `save [file]` | Save current state |
| `quit` | Exit REPL |

**Workflow Evolution:**
- Composition feels more like conversation than file editing
- Immediate feedback loop: change → hear in seconds
- Patterns become first-class values to transform

---

### v0.81 (2026-01-23)

**New Features:**
- **Noise presets**: Added `noise`, `pink_noise`, `brown_noise`, `vinyl_crackle`, `noise_sweep` to presets.ts for texture and lo-fi effects
- **Drum name aliases**: Common aliases now work (`openhat` → `hihat_open`, `closedhat` → `hihat`, `bd` → `kick`, etc.)
- **Drum shorthand notation**: Drum patterns can use direct keys without `"lines"` wrapper:
  ```json
  // New shorthand (v0.81)
  { "kit": "909", "kick": "x...x...", "snare": "....x..." }

  // Old verbose format (still supported)
  { "kit": "909", "lines": { "kick": "x...x...", "snare": "....x..." } }
  ```

**Files Modified:**
- `src/synthesis/presets.ts` - Added noise preset definitions
- `src/synthesis/drum-kits.ts` - Added `normalizeDrumName()` and `DRUM_ALIASES`
- `src/parser/pattern-expander.ts` - Auto-detect drum shorthand format
- `src/schema/types.ts` - Updated DrumPattern interface for shorthand
- `src/browser/player.ts` - Use normalized drum names in pools

**Compositions:**
- `examples/emergent-patterns.etherscore.json` - Generative ambient showcase
- `examples/midnight-study.etherscore.json` - Lo-fi hip-hop with Dilla groove

**Lessons Learned:**
- Browser bundle uses `presets.ts` (not `instruments.ts`) for synth creation
- Offline WAV rendering can reveal clipping not audible in realtime playback
- Drum name aliases improve composer ergonomics significantly

---

## Known Issues

### Guitar Synthesis (Karplus-Strong)

**Status:** Functional but needs refinement

The guitar presets (`clean_guitar`, `rhythm_guitar`, `muted_guitar`) use Karplus-Strong physical modeling synthesis implemented in `src/node/player.ts`. While this provides more realistic guitar timbres than simple oscillators, there are known limitations:

**Current Issues:**
1. **Sustain/Resonance**: Guitar strings don't resonate quite as long as real guitars. The decay feels slightly artificial - closer to a damped string than a freely ringing one. This is particularly noticeable on rhythm guitar parts.

2. **Body resonance**: The body resonance simulation is simplistic (single-pole lowpass). Real guitar bodies have complex resonant modes that contribute to warmth and fullness.

3. **String interaction**: Currently each string is synthesized independently. Real guitars have sympathetic resonance between strings that adds richness.

**Technical Details:**
- Implementation: `synthesizeGuitarKS()` in `src/node/player.ts`
- Algorithm: Karplus-Strong with allpass interpolation, pickup comb filter, body resonance
- Strum timing: `addGuitarStrumTiming()` adds per-string offsets (6ms/string, alternating up/down)

**Potential Improvements:**
- Extended Karplus-Strong with two-point averaging for more natural decay
- Multi-mode body resonance filter
- Sympathetic string resonance between chord notes
- Per-string brightness variation based on string gauge

**References:**
- [Karplus-Strong Algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Karplus%E2%80%93Strong_string_synthesis)
- [MATLAB Guitar Chord Generation](https://www.mathworks.com/help/signal/ug/generate-guitar-chords-using-the-karplus-strong-algorithm.html)
