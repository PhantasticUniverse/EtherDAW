# EtherDAW

A DAW built for LLMs to compose music. EtherScore is the native JSON notation.

## Quick Reference

| Topic | Documentation |
|-------|---------------|
| **Format Spec** | [docs/ETHERSCORE_FORMAT.md](docs/ETHERSCORE_FORMAT.md) - Complete EtherScore syntax |
| **Composer Guide** | [docs/LLM_COMPOSER_GUIDE.md](docs/LLM_COMPOSER_GUIDE.md) - Practical composition guide |
| **Theory Engine** | [docs/THEORY.md](docs/THEORY.md) - Scales, chords, intervals, validation |
| **Presets** | [docs/PRESETS.md](docs/PRESETS.md) - 127 presets + 20 sample instruments |
| **Audio Analysis** | [docs/AUDIO_ANALYSIS.md](docs/AUDIO_ANALYSIS.md) - Perceptual analysis system |
| **Development** | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - Adding features, validation |
| **Architecture** | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design |

## Commands

```bash
npm run build:all                    # Full build
npm test                             # Tests
npx tsx src/cli.ts validate <file>   # Validate EtherScore
npx tsx src/cli.ts compile <file>    # Compile to MIDI
npx tsx src/cli.ts repl              # Interactive REPL
open player.html                     # Listen in browser
```

**Player shortcuts:** Space=play/pause, ←→=seek, 1-9=sections, M=mute

## After Creating a New Composition

**IMPORTANT:** After creating any new `.etherscore.json` file, run these commands:

```bash
npx tsx src/cli.ts validate <file>              # 1. Validate the file
npx tsx scripts/check-pattern-timing.ts <file>  # 2. Check pattern timing
npx tsx src/cli.ts compile <file>               # 3. Verify it compiles
npm run build:manifest                          # 4. Update player dropdown
```

The player loads compositions from `dist/manifest.json`. Without step 4, new compositions won't appear in the browser player dropdown.

## Pattern Timing Rules

**Critical:** Timing issues are the most common composition bugs. Follow these rules:

1. **Note patterns**: Total beats must match usage context
   - If using `patterns: ["p1", "p2", ...]` array, each pattern = 1 bar (4 beats in 4/4)
   - If using `pattern: "p" + repeat: N`, pattern beats × N = section beats

2. **Arpeggio patterns**: Always specify `steps` explicitly
   ```json
   "arpeggio": {
     "chord": "Cmaj7",
     "duration": "16",
     "mode": "up",
     "steps": 16,      // REQUIRED: 16 sixteenth notes = 4 beats
     "octaves": 2
   }
   ```
   - For 16th notes: `steps: 16` = 4 beats (1 bar)
   - For 8th notes: `steps: 8` = 4 beats (1 bar)

3. **Chord patterns**: Count rest durations too
   ```json
   "chords": ["Cmaj7:w", "r:h", "Dm7:h"]  // 4 + 2 + 2 = 8 beats
   ```

4. **Groove consistency**: Apply groove settings uniformly or not at all
   - `groove: "laid_back"` adds ~21ms delay to notes
   - If some tracks have groove and others don't, they'll be desynchronized
   - **Safe approach**: Use `expression` presets instead (they don't shift timing)
   - **Alternative**: Apply the same groove to ALL tracks in a section

5. **Run the timing checker** before publishing:
   ```bash
   npx tsx scripts/check-pattern-timing.ts <file>
   ```

## CLI Commands (v0.9.11)

| Command | Description |
|---------|-------------|
| `preview <file>` | Preview patterns or sections |
| `preview <file> --section verse` | Preview a specific section |
| `preview <file> --analyze` | Preview with analysis output |
| `mix-analysis <file>` | Analyze mix balance and frequency distribution |
| `mix-analysis <file> --section chorus` | Analyze specific section |
| `mix-analysis <file> --quick` | Quick summary only |
| `timeline <file>` | ASCII section timeline visualization |
| `timeline <file> --tracks` | Track activity visualization |
| `watch <file>` | Auto-rebuild on file changes |
| `watch <file> --browser` | With browser auto-refresh |
| `watch <file> --export midi` | Auto-export on change |

## REPL Commands (v0.9.11)

| Command | Description |
|---------|-------------|
| `instant C4:q E4:q G4:h` | Play notes instantly |
| `instant C4:q @ 80 \| piano` | With tempo and preset |
| `preview melody --analyze` | Visual preview + audio analysis |
| `quick verse` | LLM-friendly section analysis |
| `connect` | Connect to browser for real-time audio |
| `cache` | Show pattern cache statistics |
| `analyze [section]` | Full perceptual analysis |
| `mix [section]` | Mix analysis (frequency balance, section energy) |
| `chroma [section]` | Chromagram (pitch distribution) |
| `energy [section]` | RMS energy curve |
| `compare sec1 sec2` | Compare two sections |

## Key Files

| Path | Purpose |
|------|---------|
| `src/schema/types.ts` | TypeScript types |
| `src/presets/` | Preset registry (single source of truth) |
| `src/theory/` | Music theory engine (scales, chords, intervals, validation) |
| `src/validation/validator.ts` | Two-layer validation |
| `src/analysis/perceptual.ts` | Audio analysis |
| `examples/benchmark-*.json` | Feature test files |
| `examples/archive/` | Full compositions |

## EtherScore Minimal Example

```json
{
  "settings": { "tempo": 120 },
  "instruments": {
    "lead": { "preset": "fm_epiano", "volume": -6 }
  },
  "patterns": {
    "melody": { "notes": ["C4:q", "E4:q", "G4:h"] }
  },
  "sections": {
    "main": { "bars": 4, "tracks": { "lead": { "patterns": ["melody"] } } }
  },
  "arrangement": ["main"]
}
```

## Composition Philosophy

When hitting a DAW limitation:
1. **Don't work around it** - Don't change your composition to fit limitations
2. **Improve the DAW** - Add the missing feature/preset/syntax
3. **Document** - Update docs/DEVELOPMENT.md
4. **Test** - Validate, listen, verify

## Conventions

- Duration: `w` `h` `q` `8` `16` `32`
- Velocity: 0-1 internally
- **Two-layer validation**: Update both `etherscore.schema.json` AND `validator.ts`
- **Single source of truth**: Presets in `src/presets/`, utilities in `src/utils/`

## Claude Code Integration

Commands: `/compose`, `/verify`, `/validate`, `/build`, `/test`, `/play`

See [.claude/README.md](.claude/README.md) for skills and hooks.
