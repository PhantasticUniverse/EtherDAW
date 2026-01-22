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

### v0.82: Foundation for Live Coding

Build the foundation: REPL, pattern preview, basic transforms.

- Audio playback from Node.js (no browser required)
- Pattern preview command (`preview --pattern`)
- Basic REPL: load/play/stop/save/quit
- Pattern transforms: transpose, stretch, velocity
- Composition templates for quick starts
- Workflow analysis comparing REPL vs JSON editing

### v0.83: Pattern Algebra

- Full transform library: reverse, invert, shuffle, slice
- Combinators: parallel, sequence, every, sometimes
- Pattern variables in REPL

### v0.84: EtherLang DSL

- Formal syntax for pattern expressions
- Parser and evaluator
- Integration with REPL

### v0.85: Live Modification

- Modify patterns during playback
- Hot-reload without stopping
- Temporal recursion support

### v0.90: Multi-Agent Composition

- Specialized agents (melody, harmony, rhythm)
- Agent collaboration protocol
- Human-in-the-loop oversight

### v1.0: Full Live Coding Environment

- Complete EtherLang implementation
- Visual pattern representation
- Network collaboration (multiple REPLs)
- Plugin architecture

---

## Philosophy

**EtherDAW is for emergence.** The joy of composition comes from setting up conditions and watching what unfolds. Markov chains generate melodies I didn't write. Euclidean rhythms create patterns I didn't plan. The DAW should amplify this - more exploration, more surprise, more flow.

**The human stays in the loop.** Live coding means the programmer is an active participant while the program runs. EtherDAW should support this dialogue between human intent and algorithmic generation.

**JSON is the interchange, not the interface.** EtherScore JSON remains valuable for storage, sharing, and LLM generation. But the primary composition experience should be live, interactive, immediate.

**Improve the DAW, don't work around it.** When hitting a limitation, add the missing feature rather than compromising the composition. The DAW should grow to support creative intent, not constrain it.
