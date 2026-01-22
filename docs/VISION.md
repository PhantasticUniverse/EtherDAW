# EtherDAW Vision

Long-term architecture and philosophy for EtherDAW's evolution toward live coding.

## Research Sources

| Tool | Key Innovation | Relevance |
|------|----------------|-----------|
| [TidalCycles](https://tidalcycles.org/) | Patterns as first-class citizens, combinators | Pattern algebra |
| [Strudel](https://strudel.cc/) | Tidal in browser, web-native | Browser-first possible |
| [Sonic Pi](https://sonic-pi.net/) | Musical REPL, education-friendly | REPL design |
| [ChucK](https://chuck.stanford.edu/) | Strongly-timed, on-the-fly | Temporal precision |
| [Orca](https://100r.co/site/orca.html) | Visual/spatial, esoteric | Novel interaction |
| [Extempore](https://extemporelang.github.io/) | Temporal recursion, live systems | Philosophy |
| [FoxDot](https://foxdot.org/)/[Renardo](https://github.com/e-lie/renardo) | Python live coding | Accessibility |
| [Tek](https://hackaday.com/2025/04/30/terminal-daw-does-it-in-style/) | Terminal DAW, Vim-like modes | CLI design |
| [CoComposer](https://arxiv.org/html/2509.00132v1) | Multi-agent LLM composition | AI architecture |

## Core Insights

### 1. Programs as Living Systems (Extempore)

> "The behaviour of the system is determined by the development of the code over the whole time the system is running."

Traditional: Write → Compile → Run → Stop → Edit → Repeat
Live coding: Modify code WHILE music plays. No compilation gate.

### 2. Patterns as First-Class (TidalCycles)

Everything is a pattern. Patterns transform patterns. High-level combinators instead of note-by-note editing.

```haskell
d1 $ sound "bd sd" # speed "1 2"     -- Pattern of sounds + speeds
d1 $ every 4 (fast 2) $ sound "bd"  -- Transform every 4 cycles
```

### 3. Temporal Recursion (ChucK, Extempore)

Functions schedule themselves into the future. Loops emerge from recursion, not explicit repetition.

### 4. Immediate Feedback (Sonic Pi)

Change code → hear result in <100ms. No save, no compile, no reload. REPL as instrument.

### 5. Multi-Agent AI (CoComposer)

LLM composition benefits from specialized agents: melody, harmony, rhythm, arrangement, reviewer. Autonomous decision-making with human oversight.

---

## The Paradigm Shift

### Current EtherDAW Model

```
EtherScore (JSON) → Compiler → Events → Player → Audio
        ↑                                        ↓
        └──────────── Edit file ─────────────────┘
```

**Problems:**
- JSON is static (can't express evolving processes)
- Compilation is a gate (breaks flow)
- Feedback loop is slow (minutes, not milliseconds)
- No real-time modification

### New EtherDAW Model

```
                    ┌──────────────────────────────┐
                    │        EtherREPL             │
                    │   (live interaction layer)   │
                    └──────────────────────────────┘
                              ↓ ↑
                    ┌──────────────────────────────┐
                    │      Pattern Engine          │
                    │ (transforms, combinators)    │
                    └──────────────────────────────┘
                              ↓ ↑
                    ┌──────────────────────────────┐
                    │    EtherScore (JSON)         │
                    │   (storage/interchange)      │
                    └──────────────────────────────┘
                              ↓
                    ┌──────────────────────────────┐
                    │       Audio Engine           │
                    │        (Tone.js)             │
                    └──────────────────────────────┘
```

**Key Changes:**
1. EtherScore remains valuable for storage, LLM generation, sharing
2. NEW: EtherREPL for live interaction
3. NEW: Pattern Engine with first-class transformations
4. Continuous feedback loop (no compilation gate)

---

## Three-Layer Architecture (v1.0)

### Layer 1: EtherScore (Data)

- JSON format for compositions (keep existing)
- LLM-friendly, versionable, shareable
- Can be generated, parsed, validated
- The "compiled output" or "save format"

### Layer 2: EtherLang (Live Coding DSL)

- Terse syntax for pattern manipulation
- Patterns as first-class values
- Transformations: transpose, stretch, shift, reverse, invert
- Combinators: parallel, sequence, interleave, every, sometimes
- Compiles to EtherScore for storage

### Layer 3: EtherREPL (Interaction)

- Interactive environment
- Load/save EtherScore
- Execute EtherLang expressions
- Live audio playback with hot-reload
- Flow state through immediate feedback

### Example Session (Vision)

```
ether> load "techno-signal.etherscore.json"
Loaded: Signal (5 instruments, 7 sections)

ether> play acid_line
Playing pattern: acid_line on acid [looping]

ether> acid_line |> transpose 3
Pattern transposed +3 semitones

ether> acid_line |> every 4 reverse
Every 4th cycle, pattern reverses

ether> drums <- euclidean 5 8 "kick"
Created pattern: drums

ether> parallel acid_line drums
Playing both patterns together

ether> save
Saved to techno-signal.etherscore.json
```

### Why This Architecture

1. **Preserves LLM strengths**: JSON generation remains core
2. **Adds human agency**: REPL enables real-time refinement
3. **Enables flow**: Immediate feedback, no gates
4. **Scales to complexity**: Simple commands compose into complex music
5. **Maintains portability**: EtherScore files work anywhere

---

## Roadmap

### v0.82: Foundation for Live Coding (Complete)

Build the foundation: REPL, pattern preview, basic transforms.

- Audio playback from Node.js (no browser required)
- Pattern preview command (`preview --pattern`)
- Basic REPL: load/play/stop/save/quit
- Pattern transforms: transpose, stretch, velocity
- Composition templates for quick starts
- Workflow analysis comparing REPL vs JSON editing

### v0.82.5: Claude Code Architecture (Complete)

Comprehensive AI-assisted development infrastructure.

- **Hooks**: PreToolUse/PostToolUse for auto-validation of EtherScore files
- **Skills**: Auto-loading context (etherscore-composition, preset-discovery, verification-patterns)
- **Agents**: Specialized reviewers (composition-reviewer, benchmark-analyzer)
- **Commands**: /compose, /verify, /plan, /onboard, /validate
- **Rules**: Modular validation and checklist rules
- **CI/CD**: GitHub Actions for tests and composition validation

**Learnings:**
- Skills work best with specific trigger words and comprehensive reference content
- Hooks should be lightweight (notes/warnings, not blocking validation)
- The EtherScore schema requires `settings`, `sections`, `arrangement` - document this in skills
- Evidence-based verification (/verify) improves composition quality
- Two-layer validation (schema + semantic) catches different error classes

### v0.83: Pattern Algebra + Album (Complete)

Full pattern transformation system inspired by TidalCycles/Strudel, plus an 8-track album demonstrating all capabilities.

- **Core Transforms**: reverse, invert, shuffle, slice, rotate (all working)
- **Combinators**: `every N` and `sometimes` for conditional transforms
- **Pattern Variables**: `set` command with pipe syntax (`set var = pattern | transpose 5 | reverse`)
- **Debug Tools**: `show`, `explain`, `diff` for inspecting transformed patterns
- **LLM Feedback Tools**: `preview`, `describe`, `suggest`, `spectrum`, `timeline` for composition feedback
- **Extended Chord Support**: `add11`, `m7add11`, `maj7add11` and other compound add chords
- **Extended Dynamics**: `@ppp`, `@fff` for extreme dynamics

**REPL Commands Added:**
```
reverse <pattern>              Reverse note order
invert <pattern> [pivot]       Invert around pitch
shuffle <pattern>              Randomize order
slice <pattern> <start> <end>  Extract range
rotate <pattern> <n>           Circular shift
reset <pattern>                Clear modifications
every <n> <transform> <pat>    Apply every N cycles
sometimes <transform> <pat>    50% probability
set <name> = <pat> | <tr>...   Create variable
vars                           List variables
show <pattern>                 View transformed notes
explain <pattern>              List active transforms
diff <pattern>                 Compare original vs current
preview <pattern>              ASCII pitch contour visualization
describe <pattern>             Verbal analysis of pattern
suggest <pattern>              Generate transform suggestions
spectrum [section]             Frequency band distribution
timeline                       Time-domain energy visualization
```

**Album "Threshold"**: 8-track album created with EtherDAW, showcasing:
- Ambient (Before Dawn, Dissolution)
- Lo-fi hip hop (First Light)
- Minimal techno (The Commute)
- Textural/meditative (Midday Static)
- Jazz-influenced (Blue Hour)
- Electronic/geometric (Night Architecture)
- Peaceful resolution (Return)

**Learnings:**
- Transforms work best at pattern string level (before compilation)
- Combinator state (cycle count) needs to be tracked per-session
- Pipe syntax enables powerful chaining: `acid_line | transpose 5 | reverse | slice 0 4`
- **Never compromise composition for DAW limitations** - improve the DAW instead
- LLM feedback tools (spectrum, timeline, describe) are essential for blind composition

### v0.9: Perceptual Foundation

See [PRD.md](./PRD.md) for comprehensive details.

- Audio-to-visual pipeline (spectrograms, chromagrams)
- Semantic audio analysis
- Reference track import and analysis
- Autonomous iteration mode (compose → render → analyze → adjust)

### v1.0: EtherLang DSL + Generative Algorithms

- Formal syntax for pattern expressions
- Parser and evaluator
- L-systems, cellular automata, genetic algorithms
- Pattern variables with scope

### v1.1: Multi-Agent Composition

- Specialized agents (melody, harmony, rhythm, arrangement)
- Agent collaboration protocol
- Session-based composition with human oversight
- Agent memory and learning

### v1.2: Real-Time and Live Coding

- Hot-reload patterns during playback
- Temporal recursion
- External sync (MIDI Clock, Ableton Link, OSC)

### v1.3: Collaborative Features

- Multi-user sessions
- MCP/HTTP API
- Git-like version control for compositions

### v1.4: Advanced Sound Design

- Natural language sound design
- Spectral matching
- Semantic effect chain synthesis

---

## Philosophy

**EtherDAW is for emergence.** The joy of composition comes from setting up conditions and watching what unfolds. Markov chains generate melodies I didn't write. Euclidean rhythms create patterns I didn't plan. The DAW should amplify this - more exploration, more surprise, more flow.

**The human stays in the loop.** Live coding means the programmer is an active participant while the program runs. EtherDAW should support this dialogue between human intent and algorithmic generation.

**JSON is the interchange, not the interface.** EtherScore JSON remains valuable for storage, sharing, and LLM generation. But the primary composition experience should be live, interactive, immediate.

**Improve the DAW, don't work around it.** When hitting a limitation, add the missing feature rather than compromising the composition. The DAW should grow to support creative intent, not constrain it.
