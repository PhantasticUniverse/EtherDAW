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
| New synth preset | N/A | Add to `VALID_SYNTH_PRESETS` |

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

### Synth Presets

1. Add to `src/synthesis/presets.ts`:
```typescript
export const PRESETS: Record<string, PresetConfig> = {
  // ... existing presets
  'new_preset': {
    type: 'monosynth',
    params: { /* ... */ }
  }
};
```

2. Add to `VALID_SYNTH_PRESETS` in `src/validation/validator.ts`

3. Update `docs/PRESETS.md`

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
| `src/synthesis/presets.ts` | Synth preset definitions |
| `src/generative/markov-presets.ts` | Markov chain presets |
| `docs/ETHERSCORE_FORMAT.md` | User-facing format documentation |

## Changelog

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

### v0.83 (Planned) - LLM Feedback & Pattern Algebra

**Problem:** LLMs cannot hear audio. When composing, an LLM needs real-time feedback mechanisms that translate audio into analyzable data.

**Proposed LLM Feedback Features:**

1. **Audio Analysis Reports** - After rendering, generate structured analysis:
   ```json
   {
     "duration": "4:26",
     "peakAmplitude": -1.2,
     "rmsLoudness": -12.4,
     "frequencyBalance": { "low": 0.35, "mid": 0.45, "high": 0.20 },
     "dynamicRange": 14.2,
     "clippingEvents": 0,
     "silenceGaps": ["2:15-2:17"],
     "instruments": {
       "bass": { "avgFrequency": 85, "presenceRatio": 0.7 },
       "drums": { "avgFrequency": 150, "presenceRatio": 0.8 }
     }
   }
   ```

2. **Spectrogram Generation** - ASCII or image-based spectrograms for visual frequency analysis

3. **Comparative Analysis** - Compare two renders:
   - "Transpose increased brightness by 15%"
   - "Adding reverb reduced clarity in 2-4kHz range"

4. **Pattern Statistics** - Before rendering, analyze patterns:
   - Note density per bar
   - Pitch range and distribution
   - Rhythmic complexity score
   - Chord tension analysis

5. **Validation with Audio Context** - Post-render warnings:
   - "Bass frequency conflicts with kick drum at 80Hz"
   - "Lead melody masked by pad in 500-2kHz range"
   - "Sparse section at bars 32-40 may feel empty"

**Pattern Algebra Features (also v0.83):**
- `reverse` - Retrograde transformation
- `invert` - Pitch inversion around axis
- `shuffle` - Randomize note order
- `slice` - Extract portion of pattern
- `parallel` - Play multiple patterns together
- `every N <transform>` - Apply transform every N cycles
- `sometimes <probability> <transform>` - Probabilistic transforms

**Files to Create:**
- `src/analysis/audio-analyzer.ts` - Post-render analysis
- `src/analysis/pattern-stats.ts` - Pre-render pattern statistics
- `src/analysis/frequency-bands.ts` - Frequency content analysis
- `src/transforms/reverse.ts` - Retrograde transform
- `src/transforms/invert.ts` - Pitch inversion
- `src/cli/repl/feedback.ts` - LLM-friendly feedback formatting

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
