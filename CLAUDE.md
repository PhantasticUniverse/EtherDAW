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
| `src/synthesis/presets.ts` | 62 synth presets |
| `src/validation/validator.ts` | Two-layer validation |
| `examples/*.etherscore.json` | Compositions |

## Commands

```bash
npm run build:all     # Full build
npm test              # Tests
open player.html      # Listen
```

## Conventions

- Duration: `w` `h` `q` `8` `16` `32`
- Velocity: 0-1 internally
- **Two-layer validation**: Update both `etherscore.schema.json` AND `validator.ts` when adding features
