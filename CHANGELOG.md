# Changelog

All notable changes to EtherDAW will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.45.0] - 2025-01-22

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
- Browser bundle exports shared code for player.html (~89KB)
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

## [0.4.0] - 2025-01-22

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
