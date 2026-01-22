---
name: onboard
description: Quick codebase orientation for new sessions
---

# /onboard - Codebase Orientation

Get oriented quickly with the EtherDAW codebase.

## Quick Overview

**EtherDAW** is a DAW built for LLMs to compose music using **EtherScore**, a JSON-based musical notation format.

## Project Structure

```
EtherDAW/
├── src/
│   ├── parser/          # Note, chord, pattern parsing
│   ├── synthesis/       # Presets, instruments, effects
│   ├── validation/      # Two-layer validation system
│   ├── compiler/        # EtherScore → Timeline
│   ├── browser/         # Web player integration
│   ├── analysis/        # Benchmark verification
│   └── cli.ts           # Command-line interface
├── examples/
│   ├── benchmark-*.json # Feature test files
│   └── archive/         # Full compositions
├── docs/
│   ├── ETHERSCORE_FORMAT.md   # Format spec
│   ├── LLM_COMPOSER_GUIDE.md  # AI composition guide
│   └── DEVELOPMENT.md         # Dev guide
├── player.html          # Browser-based player
└── CLAUDE.md            # This context file
```

## Key Concepts

### EtherScore Format
JSON-based music notation with:
- **Patterns**: notes, chords, drums, arpeggios
- **Instruments**: 62+ synth presets
- **Structure**: sections, tracks, repetition
- **Expression**: dynamics, articulations, grooves

### Two-Layer Validation
1. **Schema**: `etherscore.schema.json` - structure
2. **Custom**: `validator.ts` - semantic rules

### Workflow
1. Create `.etherscore.json` file
2. Validate: `npx tsx src/cli.ts validate file.json`
3. Play: Open `player.html`, select file
4. Export: MIDI or WAV from player

## Essential Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run test suite |
| `npm run build` | Compile TypeScript |
| `npm run build:browser` | Build web player |
| `open player.html` | Open audio player |
| `/compose` | Create new composition |
| `/verify` | Verify task completion |

## Where to Look

| Task | Key Files |
|------|-----------|
| Add instrument | `src/synthesis/presets.ts` |
| Parse notes | `src/parser/note-parser.ts` |
| Add pattern type | `src/parser/pattern-expander.ts` |
| Add validation | `src/validation/validator.ts` |
| Fix playback | `src/browser/index.ts` |

## Current Version

**v0.82** - Features:
- 62 synth presets
- 14 groove types
- Layering and LFO
- REPL for live coding
- Markov/Euclidean generation

See `CLAUDE.md` for full syntax reference.
