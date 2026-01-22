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
| `src/synthesis/presets.ts` | 62 synth presets |
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
open player.html           # Listen
```

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

## Conventions

- Duration: `w` `h` `q` `8` `16` `32`
- Velocity: 0-1 internally
- **Two-layer validation**: Update both `etherscore.schema.json` AND `validator.ts` when adding features
