# EtherDAW Handoff Guide

Quick orientation for Claude instances taking over EtherDAW development.

---

## Quick Orientation (5 min read)

### What is EtherDAW?

EtherDAW is a DAW (Digital Audio Workstation) designed for LLMs to compose music. The key insight: LLMs can't "hear" audio, but they can read JSON and process text descriptions.

**EtherScore** is the native JSON notation format. A composition is:
- `settings` - tempo, key, time signature
- `patterns` - reusable musical building blocks (notes, chords, drums, arpeggios)
- `sections` - song parts that combine patterns on tracks
- `arrangement` - ordered list of sections to play

### Entry Points

| Interface | Purpose |
|-----------|---------|
| **CLI** (`src/cli.ts`) | Validate, compile, export, analyze |
| **REPL** (`src/cli/repl/`) | Interactive composition session |
| **Browser** (`player.html`) | Listen to compositions, real-time playback |

### Key Commands

```bash
# Validate a composition
npx tsx src/cli.ts validate examples/my-track.etherscore.json

# Check pattern timing (catches most common bug)
npx tsx scripts/check-pattern-timing.ts examples/my-track.etherscore.json

# Compile to MIDI
npx tsx src/cli.ts compile examples/my-track.etherscore.json

# Update player dropdown
npm run build:manifest

# Full build
npm run build:all

# Run tests
npm test
```

---

## Project State (v0.9.11)

- **127 synth presets** + **20 sample-based instruments**
- **4 drum kits**: 808, 909, acoustic, lofi
- **697 tests** passing
- Core features stable, actively developed

### What's Stable

- EtherScore format specification
- Pattern system (notes, chords, drums, arpeggios, markov, voice-leading)
- Preset registry (`src/presets/`)
- Two-layer validation
- MIDI/WAV export
- Browser player

### What's Newer (v0.9.10-v0.9.11)

- Sample-based instruments (Tone.js samplers with CDN samples)
- Mix analysis (frequency balance, section energy)
- Pattern caching

---

## Critical Knowledge

### 1. Pattern Timing (Most Common Bug)

Pattern timing issues are the #1 cause of broken compositions.

**Rules:**

1. **Arpeggios MUST have explicit `steps` parameter:**
   ```json
   "arpeggio": {
     "chord": "Cmaj7",
     "duration": "16",
     "steps": 16,  // REQUIRED: 16 sixteenth notes = 4 beats = 1 bar
     "mode": "up"
   }
   ```
   Without `steps`, arpeggio length is undefined and timing breaks.

2. **Pattern arrays must sum to section bar count:**
   ```json
   "tracks": {
     "lead": {
       "patterns": ["p1", "p2", "p3", "p4"]  // 4 patterns = 4 bars in 4/4
     }
   }
   ```

3. **Chord patterns: count rest durations too:**
   ```json
   "chords": ["Cmaj7:w", "r:h", "Dm7:h"]  // 4 + 2 + 2 = 8 beats
   ```

4. **Groove consistency:**
   - `groove: "laid_back"` shifts timing by ~21ms
   - Either apply the SAME groove to ALL tracks, or use NONE
   - Safer alternative: use `expression` presets (no timing shift)

**Always run before publishing:**
```bash
npx tsx scripts/check-pattern-timing.ts <file>
```

### 2. Two-Layer Validation

EtherDAW uses two validation layers. **Always update BOTH when adding features:**

| Layer | File | Purpose |
|-------|------|---------|
| JSON Schema | `src/schema/etherscore.schema.json` | Structure (types, required fields) |
| Semantic Validator | `src/validation/validator.ts` | References, ranges, musical rules |

If you add a new pattern type, instrument option, or syntax:
1. Add to schema (properties, types, enums)
2. Add validation function to validator
3. Update docs/ETHERSCORE_FORMAT.md

### 3. After Creating Compositions

**Every time you create a `.etherscore.json` file:**

```bash
# 1. Validate the file
npx tsx src/cli.ts validate <file>

# 2. Check pattern timing
npx tsx scripts/check-pattern-timing.ts <file>

# 3. Verify it compiles
npx tsx src/cli.ts compile <file>

# 4. Update player dropdown (required for new files!)
npm run build:manifest
```

The manifest (`dist/manifest.json`) controls what appears in the browser player dropdown. Without step 4, new compositions won't be selectable.

---

## Architecture Landmarks

### Where to Find Things

| Topic | Location |
|-------|----------|
| **Presets** | `src/presets/` (single source of truth, 127+ presets) |
| **Preset query API** | `src/presets/index.ts` (`getPreset`, `findPresets`, `suggestPreset`) |
| **Compilation** | `src/engine/compiler.ts` |
| **Pattern expansion** | `src/parser/pattern-expander.ts` |
| **Synthesis** | `src/synthesis/instruments.ts`, `tone-renderer.ts` |
| **Drum kits** | `src/synthesis/drum-kits.ts` (4 kits: 808, 909, acoustic, lofi) |
| **Sample instruments** | `src/presets/samples.ts` (v0.9.11) |
| **Analysis** | `src/analysis/` (perceptual, mix, spectrogram) |
| **CLI** | `src/cli.ts` + `src/cli/commands/` |
| **REPL** | `src/cli/repl/` |
| **Constants** | `src/config/constants.ts` (durations, grooves, dynamics) |
| **Music theory** | `src/theory/` (scales, chords, intervals, voice-leading) |

### Data Flow

```
EtherScore JSON
    │
    ▼
┌──────────────┐
│ Validator    │ (schema + semantic checks)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Compiler     │ (patterns → timeline events)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Renderer     │ (Tone.js synthesis)
└──────┬───────┘
       │
       ▼
    Audio Output
```

---

## Known Issues / Tech Debt

1. **Some documentation out of date** - Preset counts were inconsistent (now fixed)
2. **Groove timing can cause sync issues** - Use expression presets for safety
3. **Debug output could be more structured** - Use `--debug 1|2|3` for compilation tracing
4. **Guitar synthesis (Karplus-Strong)** - Works but needs refinement for realistic resonance

---

## Tips from Experience

### Composition Tips

1. **Listen before committing** - Open `player.html` and verify audio
2. **Pattern timing checker is your friend** - Run it on every composition
3. **Start simple** - Basic patterns first, add complexity later
4. **Use debug mode** - `--debug 1` shows pattern expansion and scheduling

### Development Tips

1. **Single source of truth** - Presets in `src/presets/`, constants in `src/config/constants.ts`
2. **Check both validation layers** - Schema + validator must agree
3. **Run full test suite** - `npm test` before committing code changes
4. **Update manifest** - After adding/removing compositions

### Common Mistakes

1. **Forgetting `steps` on arpeggios** - Always specify explicitly
2. **Inconsistent groove settings** - Same groove on all tracks or none
3. **Missing manifest update** - New compositions won't appear in player
4. **Editing schema without updating validator** - Silent validation gaps

---

## Quick Reference

### Duration Codes

| Code | Name | Beats |
|------|------|-------|
| `w` | Whole | 4 |
| `h` | Half | 2 |
| `q` | Quarter | 1 |
| `8` | Eighth | 0.5 |
| `16` | Sixteenth | 0.25 |
| `32` | Thirty-second | 0.125 |

### Velocity

- Internal: 0-1 scale
- `@0.7` = moderate, `@0.9` = loud
- Dynamics: `@pp`, `@p`, `@mp`, `@mf`, `@f`, `@ff`

### Preset Categories

| Category | Examples |
|----------|----------|
| Keys | `fm_epiano`, `electric_piano`, `organ` |
| Bass | `sub_bass`, `fm_bass`, `synth_bass` |
| Pads | `warm_pad`, `ambient_pad`, `string_pad` |
| Leads | `soft_lead`, `synthwave_lead` |
| Strings | `solo_violin`, `string_ensemble` |
| Samples | `sample_piano`, `sample_violin` |

### Claude Code Commands

| Command | Purpose |
|---------|---------|
| `/compose` | Create new composition |
| `/validate <file>` | Validate EtherScore |
| `/verify` | Evidence-based verification |
| `/build` | Build project |
| `/test` | Run tests |
| `/play` | Open browser player |

---

## Further Reading

| Document | Purpose |
|----------|---------|
| `docs/ETHERSCORE_FORMAT.md` | Complete format specification |
| `docs/LLM_COMPOSER_GUIDE.md` | Practical composition guide |
| `docs/PRESETS.md` | All presets with descriptions |
| `docs/THEORY.md` | Music theory APIs |
| `docs/ARCHITECTURE.md` | System design |
| `docs/DEVELOPMENT.md` | Adding features |
| `CLAUDE.md` | Project instructions (entry point) |
