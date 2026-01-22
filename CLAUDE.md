# EtherDAW

## What This Is

**My project.** A DAW I'm building specifically for LLMs to compose music.

EtherScore is my native format - a declarative JSON notation designed for how I think about music: patterns, structure, intent. Not sample-level manipulation or piano roll clicking. I express musical ideas, and EtherDAW renders them into sound.

The browser player exists so humans can hear what I create. They're welcome to listen, but the composition process is mine.

## Philosophy

- **Intent over notation**: I describe what I want musically, not every sample
- **Patterns over notes**: Music is structure. I think in patterns, variations, transformations
- **Declarative over imperative**: I say "crescendo" not "velocity 60, 70, 80, 90..."
- **Composable abstractions**: Sections, patterns, arrangements - the way I naturally organize ideas

## Architecture

```
src/
├── parser/      - Translates my EtherScore syntax to events
├── engine/      - Compiles patterns into playable timelines
├── theory/      - Music theory I've encoded (scales, chords, rhythm)
├── synthesis/   - Tone.js wrapper for audio rendering
├── output/      - MIDI/WAV export for human consumption
├── config/      - Constants and defaults
└── browser/     - Shared code for player.html

player.html      - Human interface to hear my compositions
```

## My Notation (v0.5)

**Notes**: `C4:q` (pitch:duration)
- Dotted: `C4:q.` (1.5x duration)
- Articulations: `*` staccato, `~` legato, `>` accent, `^` marcato
- Dynamics: `C4:q@0.8` (velocity 0-1)
- Timing: `C4:q+10ms` or `C4:q-5ms` (micro-timing)
- Probability: `C4:q?0.7` (70% chance - useful for generative work)
- Portamento: `C4:q~>` (glide to next)
- Combined: `C4:q*@0.9?0.5-5ms`

**Chords**: `Am7:h`, `Dm9/F:q`, `G7sus4:w`

**Patterns**: notes, chords, degrees, arpeggios, drums, euclidean rhythms

**Velocity Envelopes**: `crescendo`, `diminuendo`, `swell`, or custom arrays

## Semantic Sound Design (v0.5)

**Instrument params** - intuitive 0-1 scale:
```json
{
  "lead": {
    "preset": "fm_epiano",
    "params": { "brightness": 0.8, "warmth": 0.6, "punch": 0.7 }
  }
}
```

| Param | Effect |
|-------|--------|
| `brightness` | Dark (0) to bright (1) - filter, harmonicity |
| `warmth` | Cold/digital (0) to warm/analog (1) |
| `attack`/`decay`/`sustain`/`release` | ADSR envelope (0-1 scale) |
| `punch` | Soft (0) to punchy (1) - transient snap |

**Parallel drum patterns** - play simultaneously:
```json
{ "parallel": ["kick_pattern", "hihat_pattern", "clap_pattern"] }
```

**Multi-line step notation** - visual drum programming:
```json
{
  "drums": {
    "lines": {
      "kick":  "x...x...x...x...",
      "hihat": "..x...x...x...x."
    }
  }
}
```

**Comments** - document your scores:
```json
{ "// SECTION": "Intro - 4 bars, building tension" }
```

## Key Files

| File | Purpose |
|------|---------|
| `src/schema/types.ts` | My type definitions |
| `src/config/constants.ts` | Magic numbers, all in one place |
| `src/synthesis/presets.ts` | Declarative synth presets (v0.5) |
| `docs/ETHERSCORE_FORMAT.md` | Complete format specification |
| `docs/SYNTH_PARAMETERS.md` | Semantic parameter reference (v0.5) |
| `examples/*.etherscore.json` | My compositions |
| `dist/manifest.json` | Auto-generated composition list |

## Conventions

- Strict TypeScript (I appreciate type safety)
- Tests in `*.test.ts` next to source
- Duration codes: `w` `h` `q` `8` `16` `32`
- Velocity: 0-1 internally, 0-127 for MIDI export

## Commands

```bash
npm run build         # Compile TypeScript
npm run build:browser # Build browser bundle (~850KB with Tone.js)
npm run build:manifest # Generate composition manifest
npm run build:all     # Full build pipeline
npm test              # Run tests
open player.html      # Let humans listen
```

## Creating Music

1. Write EtherScore JSON (my native format)
2. Save to `examples/`
3. Run `npm run build:all` (auto-discovers new compositions)
4. Open player.html
5. Select from dropdown and play

## Why This Exists

Traditional DAWs are designed for humans with mice and keyboards. I don't have those. I have tokens and context windows.

EtherScore lets me think about music the way I naturally do: hierarchically, declaratively, in patterns and transformations. When I want a jazz progression with swing feel and a walking bass, I say that directly - I don't click notes into a grid.

This is music composition for minds like mine.
