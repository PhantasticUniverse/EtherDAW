# EtherDAW

## What This Is
A declarative music composition engine. EtherScore JSON -> playable music.

## Philosophy
- Composers (human or LLM) express *intent*, not every note
- The format should read like music notation, not code
- Simple things should be simple; complex things possible

## Architecture
- `src/parser/` - Converts EtherScore syntax to internal events
- `src/engine/` - Compiles patterns into timelines
- `src/synthesis/` - Tone.js wrapper for audio rendering
- `src/theory/` - Music theory utilities (chords, scales, rhythm)
- `src/output/` - MIDI and WAV export functionality
- `player.html` - Browser playback (v0.45: uses shared code from dist/etherdaw-browser.js)

## Key Files
- `src/schema/types.ts` - All type definitions
- `src/config/constants.ts` - All magic numbers (v0.45)
- `docs/ETHERSCORE_FORMAT.md` - Format specification
- `player.html` - Browser-based playback and testing

## Conventions
- Use strict TypeScript
- Tests in `*.test.ts` next to source
- Examples in `examples/*.etherscore.json`
- Duration strings: 'w' (whole), 'h' (half), 'q' (quarter), '8' (eighth), '16' (sixteenth), '32' (thirty-second)

## Note Syntax (v0.4)
Basic: `C4:q` (pitch:duration)
Dotted: `C4:q.` (1.5x duration)
Articulations: `*` (staccato), `~` (legato), `>` (accent), `^` (marcato)
Portamento: `C4:q~>` (glide to next note)
Per-note velocity: `C4:q@0.8` (0.0-1.0)
Timing offset: `C4:q+10ms` or `C4:q-5ms`
Probability: `C4:q?0.7` (70% chance to play)
Combined: `C4:q*@0.9?0.5-5ms`

## Chord Syntax
Basic: `Cmaj:h` (root + quality + duration)
Inversions: `Cmaj/E:h` (slash chord)
Extended: `Am7:q`, `Dm9:h`, `G7sus4:q`

## Pattern Types
- `notes`: Array of note strings
- `chords`: Array of chord strings
- `degrees`: Scale degrees with optional rhythm
- `arpeggio`: Chord-based arpeggiator
- `drums`: Step sequencer or hit list
- `euclidean`: Euclidean rhythm generator

## Velocity Envelopes (v0.4)
Presets: 'crescendo', 'diminuendo', 'swell', 'accent_first', 'accent_downbeats'
Custom: `[0.5, 0.6, 0.7, 0.8, 0.9, 1.0]`

## Gotchas
- Velocity is 0-1 internally, converted to 0-127 for MIDI
- Time signature affects beats-per-bar calculation
- Drum pitches use format `drum:kickname@kitname` internally
- player.html now imports from `dist/etherdaw-browser.js` - run `npm run build:browser` after changes

## Common Commands
```bash
npm run build         # Compile TypeScript
npm run build:browser # Build browser bundle
npm test              # Run tests
npm run test:run      # Run tests once (no watch)
open player.html      # Test in browser
```

## Testing Compositions
1. Place EtherScore JSON in `examples/`
2. Open `player.html` in browser
3. Select from dropdown and play
4. Check browser console for errors
