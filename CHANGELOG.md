# Changelog

All notable changes to EtherDAW will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

*No unreleased changes*

---

## [0.60.0] - 2026-01-22 - "Generative Primitives"

### Overview

v0.6 is a paradigm shift: from "enumerate every note" to "describe the rules." This release introduces generative primitives that let me express compositional intent through rules, constraints, and probability—the way I actually think about music.

### Added

#### Markov Chain Patterns
- **Probabilistic sequence generation** using state machines
- States can be scale degrees (`"1"`, `"3"`, `"5"`), absolute pitches (`"C4"`), or special (`"rest"`, `"approach"`)
- Transition matrices define probability of moving between states
- Optional seed for reproducible results
- Example:
  ```json
  "walking_bass": {
    "markov": {
      "states": ["1", "3", "5", "7", "approach"],
      "transitions": {
        "1": { "3": 0.3, "5": 0.5, "approach": 0.2 },
        "5": { "1": 0.4, "3": 0.4, "approach": 0.2 }
      },
      "steps": 32, "duration": "q", "seed": 42
    }
  }
  ```

#### Density Curves
- **Section-level activity control** with interpolated density values
- Density 0.0 = very sparse, 1.0 = all notes play
- Multiplies with existing `?probability` annotations
- Curve types: `linear`, `exponential`, `logarithmic`, `sine`
- Example:
  ```json
  "buildup": {
    "bars": 16,
    "density": { "start": 0.2, "end": 0.9, "curve": "exponential" }
  }
  ```

#### Melodic Continuation
- **Generate continuations from source motifs**
- Techniques: `ascending_sequence`, `descending_sequence`, `extension`, `fragmentation`, `development`
- Configurable step count and interval for sequences
- Example:
  ```json
  "episode_1": {
    "continuation": {
      "source": "subject_head",
      "technique": "descending_sequence",
      "steps": 3, "interval": -2
    }
  }
  ```

#### Constraint-Based Voice Leading
- **Voice-led chord progressions** with automatic voicing
- Style presets: `bach` (strict baroque), `jazz` (smooth), `pop` (simple)
- Constraints: `no_parallel_fifths`, `no_parallel_octaves`, `smooth_motion`, `avoid_voice_crossing`, `resolve_leading_tones`
- Configurable voice ranges and voice count (2-6)
- Example:
  ```json
  "chorale": {
    "voiceLead": {
      "progression": ["Dm7", "G7", "Cmaj7"],
      "voices": 4, "style": "jazz",
      "constraints": ["smooth_motion", "avoid_voice_crossing"]
    }
  }
  ```

#### LLM Feedback Primer
- **New document for gathering feedback from other LLMs**: `docs/LLM_FEEDBACK_PRIMER.md`
- Structured questions about usability, missing features, and design philosophy
- Invitation for other LLMs to compose and share their creations
- The first open-source project seeking feedback from its AI users

#### Demo Composition
- **`examples/generative-demo.etherscore.json`** - Showcases all v0.6 features
- Markov walking bass, density-controlled buildup, voice-led jazz progression
- Melodic development using continuation techniques

### Fixed

#### Timing Issues (5 Compositions)
- **llm-composition.etherscore.json** - Fixed repeat values across all sections (critical)
- **house-midnight.etherscore.json** - Fixed intro pad track repeat
- **vaporwave-plaza.etherscore.json** - Fixed chorus bass and bell track repeats
- **jazz-standard.etherscore.json** - Fixed solo section piano repeat
- **lofi-study.etherscore.json** - Verified working

### Technical Notes

**Files Created:**
- `src/generative/markov.ts` - Markov chain generator with seeded RNG
- `src/generative/density.ts` - Density curve interpolation and application
- `src/generative/continuation.ts` - Melodic continuation techniques
- `src/theory/voice-leading.ts` - Constraint-based voice leading with beam search
- `src/generative/markov.test.ts` - 16 tests
- `src/generative/density.test.ts` - 23 tests
- `src/generative/continuation.test.ts` - 12 tests
- `src/theory/voice-leading.test.ts` - 10 tests
- `docs/LLM_FEEDBACK_PRIMER.md` - Feedback primer for other LLMs
- `examples/generative-demo.etherscore.json` - v0.6 demo composition

**Files Modified:**
- `src/schema/types.ts` - Added `MarkovConfig`, `DensityConfig`, `ContinuationConfig`, `VoiceLeadConfig`
- `src/parser/pattern-expander.ts` - Integrated markov, continuation, voiceLead expansion
- `src/engine/pattern-resolver.ts` - Integrated density curve application
- `src/engine/compiler.ts` - Passes density to pattern resolver
- `docs/ETHERSCORE_FORMAT.md` - Complete v0.6 documentation

**Test Coverage:**
- 161 tests passing (61 new tests for v0.6 features)

### Migration Guide

No breaking changes. Existing EtherScore files work unchanged.

**New features to try:**
1. Use `markov` patterns for probabilistic bass lines or melodies
2. Add `density` to sections for gradual builds or fades
3. Use `continuation` to develop motifs algorithmically
4. Use `voiceLead` for automatic chord voicings

---

## [0.50.0] - 2026-01-22 - "The LLM Composer Release"

### Overview

v0.5 is a foundational release that makes EtherDAW truly LLM-friendly. Based on three composition sessions (ambient, lo-fi hip hop, minimal techno), this release addresses critical architectural debt and introduces semantic sound design.

### Added

#### Semantic Synth Parameters
- **LLM-friendly 0-1 scale parameters** for intuitive sound shaping:
  - `brightness` (0=dark, 1=bright) - controls filter, harmonicity, modulation
  - `warmth` (0=cold/digital, 1=warm/analog) - controls saturation, filter Q
  - `richness` (0=thin, 1=thick) - controls detune, voice layering
  - `attack`, `decay`, `sustain`, `release` - mapped to sensible time ranges
  - `punch` (0=soft, 1=punchy) - transient sharpness
- **Direct Tone.js overrides** for power users needing precise control
- **Multi-instance presets** - same preset on multiple tracks with different params
- New documentation: `docs/SYNTH_PARAMETERS.md`

#### Parallel Patterns
- **`parallel` property on Track** - patterns play simultaneously, not sequentially
- Solves the "kick + hihat + clap in one track" problem from Session #002
- Example: `"parallel": ["kick_pattern", "hihat_pattern", "clap_pattern"]`

#### Multi-Line Step Notation
- **`lines` property in DrumPattern** - write full beats visually
- Example:
  ```json
  "drums": {
    "kit": "909",
    "lines": {
      "kick":  "x...x...x...x...",
      "hihat": "..x...x...x...x.",
      "clap":  "....x.......x..."
    }
  }
  ```

#### Pattern Probability
- **`probability` on Track** - pattern plays with specified probability (0-1)
- **`fallback` on Track** - pattern to play if probability check fails
- Enables generative variation without per-note probability

#### Section-Level Automation
- **`automation` property in Section** for dynamic parameter changes
- Supports both semantic params (`bass.params.brightness`) and effect params (`bass.filter.frequency`)
- Curve types: `linear`, `exponential`, `sine`, `step`
- Custom point-based curves for complex automation

#### Auto-Discovery
- **`dist/manifest.json`** - generated list of all compositions
- **No more manual dropdown updates** - add composition to `examples/`, rebuild
- Player loads manifest on startup with fallback to hardcoded list

#### Comment Support
- **Keys starting with `//` are stripped** during parsing
- Example: `"// NOTE": "This is a comment"` - valid JSON that documents your score
- New utility: `parseWithComments()`, `stripComments()`

### Changed

#### Browser Architecture (Major Rewrite)
- **player.html reduced from 3006 lines to 589 lines**
- Removed duplicate engine reimplementation
- Now uses bundled `dist/etherdaw-browser.js` with Tone.js included
- New `Player` class with clean API: `createPlayer()`, `load()`, `play()`, `pause()`, `stop()`, `seek()`
- Bundle size: ~850KB (includes Tone.js)

#### Declarative Preset System
- **Presets are now data, not functions** - can be modified with params
- Located in `src/synthesis/presets.ts`
- Each preset includes semantic mappings for parameter customization
- Instrument factory creates Tone.js synths from definitions + params + overrides

### Technical Notes

**Files Created:**
- `src/browser/player.ts` - Player class API
- `src/synthesis/semantic-params.ts` - Semantic parameter definitions
- `src/synthesis/presets.ts` - Declarative preset definitions
- `src/synthesis/instrument-factory.ts` - Synth creation from definitions
- `src/engine/automation.ts` - Automation resolution
- `src/parser/json-preprocessor.ts` - Comment stripping
- `scripts/generate-manifest.ts` - Manifest generator
- `docs/SYNTH_PARAMETERS.md` - Parameter reference

**Build Changes:**
- `npm run build:manifest` - Generate composition manifest
- `npm run build:all` - Full build pipeline
- Browser bundle now includes Tone.js (no external dependency)

### Migration Guide

No breaking changes for existing EtherScore files. All 19 existing compositions play correctly.

**New features to try:**
1. Add `params` to instruments for semantic sound shaping
2. Use `parallel` for drum patterns that play simultaneously
3. Use `lines` for visual drum programming
4. Add `"// comment": "..."` for documentation in your scores

---

## [0.49.0] - 2026-01-22

### Added

#### Enhanced Claude Code Integration
- Updated `.claude/settings.json` to use proper `allowedTools` format
- Added `.claude/.gitignore` for local settings files
- Added new custom commands:
  - `/test` - Run test suite with verification
  - `/build` - Build TypeScript and browser bundle
  - `/verify` - Verification checklist (cc-prime pattern)

### Changed

- Settings format now uses `allowedTools`/`denyTools` arrays
- Documentation improvements for versioning clarity

### Technical Notes

This release focuses on **developer workflow**:
- Better Claude Code permission management
- Verification-first development pattern
- Cleaner changelog with proper dating

---

## [0.45.0] - 2026-01-22

### Added

#### Claude Code Configuration
- Added `CLAUDE.md` project context file for better Claude Code session context
- Added `.claude/settings.json` with permission tiers
- Added custom commands:
  - `/compose` - Generate a new EtherScore composition
  - `/play` - Open player in browser for testing

#### Constants Extraction
- Created `src/config/constants.ts` as single source of truth for all magic numbers
- Constants include:
  - `DURATIONS` - Note duration values
  - `ARTICULATION` - Staccato, legato, accent, marcato modifiers
  - `EFFECT_DEFAULTS` - Default values for reverb, delay, chorus, etc.
  - `ENVELOPE_PRESETS` - ADSR envelopes for different instrument types
  - `HUMANIZE` - Timing, velocity, and duration variance constants
  - `GROOVE_TEMPLATES` - Rhythm groove patterns
  - `SCALE_INTERVALS` - Modal scale intervals
  - `MIDI` - MIDI-related constants
  - `AUDIO` - WAV export constants

#### Browser Bundle
- Added `npm run build:browser` script using esbuild
- Created `src/browser/index.ts` entry point
- Browser bundle exports shared code for player.html (~78KB)
- Tone.js and MIDI dependencies remain external

### Changed

- Updated all source files to import from `src/config/constants.ts`:
  - `src/schema/types.ts` - DURATION_MAP re-exports from constants
  - `src/parser/note-parser.ts` - Uses ARTICULATION, DOTTED_MULTIPLIER, etc.
  - `src/parser/pattern-expander.ts` - Uses DURATIONS, VELOCITY_ENVELOPE, etc.
  - `src/theory/rhythm.ts` - Uses HUMANIZE, GROOVE_TEMPLATES
  - `src/synthesis/tone-renderer.ts` - Uses EFFECT_DEFAULTS
  - `src/output/midi-export.ts` - Uses MIDI, NOTE_NAMES
  - `src/output/wav-export.ts` - Uses AUDIO constants

- player.html now imports browser bundle:
  - Loads `dist/etherdaw-browser.js` as ES module
  - Exposes `window.EtherDAW` for gradual migration
  - Existing code continues to work as fallback

### Technical Notes

This release focuses on **technical debt** and **developer experience**:
- No new musical features
- Improved code maintainability through constants extraction
- Foundation for sharing code between Node.js and browser
- Better Claude Code integration for AI-assisted development

### Migration Guide

No breaking changes. Existing EtherScore files continue to work unchanged.

For developers extending EtherDAW:
1. Import constants from `src/config/constants.ts` instead of hardcoding values
2. Run `npm run build:browser` after making changes to see updates in player.html
3. Use `window.EtherDAW` in browser for access to shared functions

---

## [0.4.0] - 2026-01-22

### Added

#### Expression Foundation
- Per-note velocity: `C4:q@0.8` (0.0-1.0 scale)
- Per-note probability: `C4:q?0.7` (70% chance to play)
- Timing offset: `C4:q+10ms` or `C4:q-5ms`
- Portamento: `C4:q~>` (glide to next note)
- Combined modifiers: `C4:q*@0.9?0.5-5ms`

#### Velocity Envelopes
- Pattern-level velocity curves
- Presets: `crescendo`, `diminuendo`, `swell`, `accent_first`, `accent_downbeats`
- Custom arrays: `[0.5, 0.6, 0.7, 0.8, 0.9, 1.0]`

### Changed

- Extended note regex to support v0.4 expression modifiers
- Updated pattern expander to process velocity envelopes

---

## [0.3.0] - Previous

### Added
- Articulations: `*` (staccato), `~` (legato), `>` (accent), `^` (marcato)
- Pattern transforms: invert, retrograde, augment, diminish, transpose, octave
- Scale constraint: `constrainToScale` option
- Enhanced scale degrees with inline duration

---

## [0.2.0] - Previous

### Added
- Drum patterns with step sequencer and explicit hits
- Euclidean rhythm generator
- Enhanced arpeggiator with modes (up, down, updown, downup, random)
- Four drum kits: 808, 909, acoustic, lofi

---

## [0.1.0] - Initial

### Added
- Core EtherScore format
- Note and chord parsing
- Pattern expansion
- Section and arrangement compilation
- Tone.js rendering
- MIDI export
- ABC notation export
- Browser player
