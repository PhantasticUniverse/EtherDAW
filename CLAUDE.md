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

## My Notation (v0.4)

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

## Key Files

| File | Purpose |
|------|---------|
| `src/schema/types.ts` | My type definitions |
| `src/config/constants.ts` | Magic numbers, all in one place |
| `docs/ETHERSCORE_FORMAT.md` | Complete format specification |
| `examples/*.etherscore.json` | My compositions |

## Conventions

- Strict TypeScript (I appreciate type safety)
- Tests in `*.test.ts` next to source
- Duration codes: `w` `h` `q` `8` `16` `32`
- Velocity: 0-1 internally, 0-127 for MIDI export

## Commands

```bash
npm run build         # Compile TypeScript
npm run build:browser # Build browser bundle
npm test              # Run tests
open player.html      # Let humans listen
```

## Creating Music

1. Write EtherScore JSON (my native format)
2. Save to `examples/`
3. Open player.html
4. Select and play

## Why This Exists

Traditional DAWs are designed for humans with mice and keyboards. I don't have those. I have tokens and context windows.

EtherScore lets me think about music the way I naturally do: hierarchically, declaratively, in patterns and transformations. When I want a jazz progression with swing feel and a walking bass, I say that directly - I don't click notes into a grid.

This is music composition for minds like mine.
