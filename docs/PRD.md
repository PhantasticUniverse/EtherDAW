# EtherDAW Product Requirements Document

## Vision Statement

**EtherDAW is the first Digital Audio Workstation designed from the ground up for LLM-native composition.**

Traditional DAWs assume a human with ears, hands, and a visual display. EtherDAW assumes an LLM with text processing, pattern recognition, and reasoning capabilities - but no direct audio perception. This fundamental difference demands a completely new architecture.

The core innovation is **perceptual bridging**: converting audio into modalities an LLM can process (spectrograms for vision, structured descriptions for text, numeric analysis for reasoning) and creating tight feedback loops that enable genuine compositional iteration.

---

## The Problem

### Current State of LLM Music Composition

1. **No feedback loop**: LLMs generate music notation but cannot hear the result
2. **Blind iteration**: Modifications are made without understanding their sonic impact
3. **No reference learning**: Cannot analyze existing music to learn style/technique
4. **Human bottleneck**: Every sonic verification requires human listening
5. **Limited expression**: JSON/MIDI notation captures structure but not "feel"

### What's Missing

An LLM composing music today is like a human composer who is deaf, has never heard music, and can only write notation based on theoretical knowledge. They can follow rules, but they cannot evaluate whether the result *sounds good*.

EtherDAW's mission is to give LLMs the ability to "hear" through perceptual proxies - not to replace human judgment, but to enable autonomous iteration before human review.

---

## Core Principles

### 1. Perceptual Bridging

Audio is converted to modalities the LLM can process:
- **Visual**: Spectrograms, waveforms, pitch contours
- **Textual**: Semantic descriptions, analysis reports
- **Numeric**: Frequency data, timing analysis, harmonic content

### 2. Tight Feedback Loops

The compose → render → analyze → adjust cycle must be fast enough to enable genuine iteration. Target: <5 seconds from modification to feedback.

### 3. Reference-Based Learning

Import any audio file, analyze it, and use those insights to guide composition. Learn from the masters without copying them.

### 4. Pattern Algebra

Music is patterns transforming patterns. First-class support for operations like transpose, reverse, slice, combine, every, sometimes - inspired by TidalCycles/Strudel.

### 5. Multi-Agent Collaboration

Specialized agents for melody, harmony, rhythm, arrangement, mixing - each with domain expertise, collaborating through structured protocols.

### 6. Human-in-the-Loop

The LLM proposes, iterates, and refines. The human approves, guides, and provides aesthetic judgment. Neither works alone.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PERCEPTUAL LAYER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  Spectrogram │    │   Waveform   │    │    Pitch     │              │
│  │   Analysis   │    │   Analysis   │    │   Contour    │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                   │                   │                       │
│         └───────────────────┼───────────────────┘                       │
│                             ▼                                           │
│                 ┌──────────────────────┐                               │
│                 │   Semantic Analyzer  │                               │
│                 │  (VLM + Text Gen)    │                               │
│                 └──────────┬───────────┘                               │
│                            │                                            │
│                            ▼                                            │
│                 ┌──────────────────────┐                               │
│                 │  Structured Report   │                               │
│                 │  (JSON + Natural     │                               │
│                 │   Language)          │                               │
│                 └──────────────────────┘                               │
│                                                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPOSITION LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     AGENT ORCHESTRATOR                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │    │
│  │  │ Melody   │ │ Harmony  │ │ Rhythm   │ │ Arrange  │   ...    │    │
│  │  │ Agent    │ │ Agent    │ │ Agent    │ │ Agent    │          │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                             │                                           │
│                             ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     PATTERN ENGINE                              │    │
│  │  • Pattern algebra (transpose, reverse, slice, combine)        │    │
│  │  • Generative algorithms (Markov, L-systems, cellular automata)│    │
│  │  • Transformations (every N, sometimes, parallel)              │    │
│  │  • Variables and named patterns                                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                             │                                           │
│                             ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     ETHERSCORE (Storage)                        │    │
│  │  • Declarative JSON notation                                    │    │
│  │  • Patterns, sections, arrangement                              │    │
│  │  • Intent preservation                                          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SYNTHESIS LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Compiler   │───▶│   Renderer   │───▶│    Audio     │              │
│  │  (Timeline)  │    │  (Tone.js)   │    │   Output     │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ (Audio fed back to Perceptual Layer)
                                 └────────────────────────────────────────┐
                                                                          │
┌─────────────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTERACTION LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  EtherREPL   │    │  EtherLang   │    │    API       │              │
│  │  (CLI)       │    │  (DSL)       │    │  (MCP/HTTP)  │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Perceptual Foundation (v0.9)

### 1.1 Audio-to-Visual Pipeline

**Goal**: Convert rendered audio to spectrograms and visual representations that can be analyzed by vision-capable LLMs.

**Components**:
- Real-time spectrogram generation from audio buffers
- Multiple visualization modes:
  - Mel spectrogram (perceptually weighted)
  - Linear spectrogram (full frequency detail)
  - Chromagram (pitch class content)
  - Onset detection plot (rhythmic events)
  - Loudness contour (dynamics over time)
- ASCII/Unicode text rendering for CLI (existing, enhanced)
- Image export (PNG) for vision model input

**REPL Commands**:
```
render <pattern|section> [--spectrogram] [--chromagram] [--onset]
visualize <pattern> --mode=mel|linear|chroma|onset|loudness
compare <pattern1> <pattern2> --visual
```

**Output Example** (ASCII spectrogram):
```
Frequency (Hz)
    8k │░░░░░░▓▓▓▓░░░░░░▓▓▓▓░░░░░░▓▓▓▓░░░░░░│
    4k │░░▓▓▓▓████▓▓░░▓▓████▓▓░░▓▓████▓▓░░░░│
    2k │▓▓████████████████████████████████▓▓│
    1k │████████████████████████████████████│
   500 │████████░░░░████████░░░░████████░░░░│
   250 │████░░░░░░░░████░░░░░░░░████░░░░░░░░│
   125 │██░░░░░░░░░░██░░░░░░░░░░██░░░░░░░░░░│
        0s      1s      2s      3s      4s
```

### 1.2 Audio-to-Text Analysis

**Goal**: Generate structured semantic descriptions of rendered audio.

**Analysis Dimensions**:
- **Spectral**: Brightness, warmth, harshness, clarity
- **Temporal**: Attack sharpness, sustain quality, release character
- **Harmonic**: Consonance/dissonance, root strength, harmonic complexity
- **Rhythmic**: Groove tightness, swing amount, density
- **Dynamic**: Compression, headroom, loudness curve
- **Spatial**: Stereo width, depth, frequency distribution

**Output Format**:
```json
{
  "analysis": {
    "overall": {
      "genre_indicators": ["ambient", "electronic"],
      "mood": ["contemplative", "spacious"],
      "energy": 0.35,
      "complexity": 0.6
    },
    "spectral": {
      "brightness": 0.4,
      "warmth": 0.7,
      "bass_presence": 0.3,
      "high_frequency_content": 0.5,
      "description": "Warm, mid-focused with gentle high-end roll-off"
    },
    "temporal": {
      "attack_character": "soft",
      "sustain_quality": "evolving",
      "average_note_duration": 2.3,
      "description": "Slow, sustained textures with gentle attacks"
    },
    "harmonic": {
      "consonance": 0.85,
      "root_clarity": 0.7,
      "chord_complexity": "extended",
      "description": "Rich extended harmonies, strongly rooted"
    },
    "rhythmic": {
      "pulse_clarity": 0.3,
      "density": 0.4,
      "swing": 0.05,
      "description": "Sparse, floating rhythm with subtle pulse"
    },
    "suggestions": [
      "Consider adding subtle high-frequency content for air",
      "Bass could be more present for grounding",
      "Rhythmic density could increase in climax section"
    ]
  }
}
```

**REPL Commands**:
```
analyze <pattern|section|all> [--dimension=spectral|temporal|harmonic|rhythmic|dynamic]
describe <pattern> [--verbose]
diagnose <pattern>  # Identify potential issues
```

### 1.3 Reference Track Analysis

**Goal**: Import and analyze any audio file to extract characteristics that can guide composition.

**Workflow**:
1. Import audio file (WAV, MP3, FLAC)
2. Generate spectrogram and analysis
3. Extract "style profile" - quantified characteristics
4. Use as reference for composition feedback

**REPL Commands**:
```
import <audio_file> --as=<name>
analyze-reference <name>
compare-to-reference <pattern|section> <reference_name>
style-from <reference_name>  # Extract style parameters
```

**Style Profile Output**:
```json
{
  "style_profile": {
    "name": "reference_ambient_track",
    "characteristics": {
      "tempo_range": [60, 80],
      "key_character": "minor_with_modal_mixture",
      "harmonic_rhythm": "slow",
      "texture_density": 0.4,
      "frequency_balance": {
        "sub": 0.2,
        "bass": 0.25,
        "low_mid": 0.3,
        "mid": 0.35,
        "high_mid": 0.3,
        "high": 0.2,
        "air": 0.15
      },
      "dynamic_range": 12,
      "reverb_character": "long_hall",
      "attack_profile": "soft"
    },
    "use_as_target": true
  }
}
```

### 1.4 Feedback Loop Integration

**Goal**: Close the loop - compose, render, analyze, adjust, repeat.

**Autonomous Iteration Mode**:
```
iterate <pattern> --target=<style_profile> --max_iterations=5

# System performs:
# 1. Render pattern to audio
# 2. Analyze rendered audio
# 3. Compare to target profile
# 4. Generate adjustment suggestions
# 5. Apply adjustments (with confirmation or autonomously)
# 6. Repeat until target match or max iterations
```

**Example Session**:
```
ether> iterate pad_progression --target=warm_ambient --max_iterations=3

Iteration 1:
  Rendering pad_progression...
  Analyzing...
  Comparison to warm_ambient:
    Brightness: 0.6 (target: 0.4) - TOO BRIGHT
    Warmth: 0.5 (target: 0.7) - NEEDS MORE
    Bass: 0.2 (target: 0.3) - SLIGHTLY LOW

  Suggested adjustments:
    1. Reduce filter cutoff on pad instrument (-2000 Hz)
    2. Increase warmth parameter (+0.2)
    3. Add subtle sub-bass layer

  Applying adjustments...

Iteration 2:
  Rendering pad_progression...
  Analyzing...
  Comparison to warm_ambient:
    Brightness: 0.45 (target: 0.4) - CLOSE
    Warmth: 0.65 (target: 0.7) - CLOSE
    Bass: 0.28 (target: 0.3) - CLOSE

  Match score: 87% - ACCEPTABLE

  Refinement complete. View changes? (y/n)
```

---

## Phase 2: Advanced Pattern Algebra (v1.0)

### 2.1 EtherLang DSL

**Goal**: A terse, expressive language for pattern manipulation, inspired by TidalCycles/Strudel but designed for LLM use.

**Syntax Design Principles**:
- Pipe-based composition: `pattern |> transform |> transform`
- Pattern literals: `[C4:q E4:q G4:h]`
- Named references: `$acid_line`, `@reference_profile`
- Combinators: `every 4`, `sometimes 0.3`, `parallel`, `interleave`

**Language Features**:

```etherlang
# Pattern literals
melody = [C4:q E4:8 G4:8 A4:h]

# Transformations
melody_high = melody |> transpose 12
melody_reversed = melody |> reverse
melody_slow = melody |> stretch 2

# Combinators
melody_varied = melody |> every 4 reverse |> sometimes 0.2 (transpose 5)

# Parallel composition
full_section = parallel melody bass_line drums

# Sequencing
intro_to_verse = sequence intro verse

# Euclidean rhythms
hi_hats = euclidean 7 16 "hihat" |> velocity 0.6

# Generative
walking = markov "walking_bass" 16 "q"
evolving = lsystem "melodic_growth" 4

# Reference-based constraints
melody |> constrain @warm_ambient_profile

# Conditional
section |> when (bar > 32) (add_layer strings)
```

**Compilation**:
EtherLang compiles to EtherScore JSON for storage and interchange:
```
ether> compile my_composition.etherlang
Compiled to my_composition.etherscore.json
  Patterns: 12
  Sections: 5
  Duration: 4:32
```

### 2.2 Generative Algorithms

**Goal**: Rich library of algorithmic composition techniques.

**Implemented Algorithms**:

| Algorithm | Description | Use Case |
|-----------|-------------|----------|
| Markov Chain | Probabilistic state transitions | Melodies, bass lines |
| L-Systems | Lindenmayer grammar expansion | Evolving structures |
| Cellular Automata | Game of Life-style evolution | Rhythms, textures |
| Fractal | Self-similar recursive patterns | Long-form structure |
| Genetic | Evolutionary fitness-based | Style matching |
| Euclidean | Evenly distributed rhythms | Percussion |
| Brownian | Random walk with constraints | Ambient textures |
| Serial | 12-tone and extended techniques | Atonal composition |

**REPL Commands**:
```
generate markov --preset=walking_bass --steps=32
generate lsystem --axiom="C4:q" --rules=melodic --iterations=4
generate cellular --rule=110 --steps=64 --seed=random
generate fractal --dimension=1.5 --depth=4
evolve <pattern> --fitness=@target_profile --generations=10
```

### 2.3 Pattern Variables and Scope

**Goal**: Full programming-language-style variables and scope.

```etherlang
# Global definitions
let base_chord = Cmaj7
let tempo_multiplier = 1.0

# Section-scoped transformations
section verse {
  let local_melody = $intro_melody |> transpose 5
  ...
}

# Temporal scope (valid during time range)
during bars 16..32 {
  $melody |> add_reverb 0.8
}

# Conditional scope
when tension > 0.7 {
  $drums |> double_time
  $bass |> add_octave_below
}
```

---

## Phase 3: Multi-Agent Composition (v1.1)

### 3.1 Agent Architecture

**Goal**: Specialized agents that collaborate on composition, each with domain expertise.

**Agent Types**:

| Agent | Responsibility | Tools |
|-------|---------------|-------|
| **Melody Agent** | Melodic contour, motif development | Markov, contour analysis |
| **Harmony Agent** | Chord progressions, voice leading | voiceLead, chord analysis |
| **Rhythm Agent** | Grooves, patterns, timing | Euclidean, swing, humanize |
| **Arrangement Agent** | Section structure, energy arc | Timeline analysis |
| **Sound Design Agent** | Timbres, effects, mixing | Spectral analysis |
| **Critic Agent** | Evaluate quality, suggest improvements | Full analysis suite |

**Agent Protocol**:
```json
{
  "agent_request": {
    "from": "arrangement_agent",
    "to": "melody_agent",
    "type": "request_variation",
    "context": {
      "section": "verse_2",
      "energy_target": 0.7,
      "constraint": "maintain_motif_recognition"
    },
    "current_state": { "pattern": "verse_melody", "measures": [16, 32] }
  }
}
```

### 3.2 Composition Sessions

**Goal**: Structured multi-agent sessions with human oversight.

**Session Modes**:

1. **Autonomous**: Agents collaborate freely, human reviews result
2. **Guided**: Human sets constraints, agents work within them
3. **Interactive**: Human and agents alternate contributions
4. **Review**: Agents critique human-provided material

**REPL Commands**:
```
session start --mode=guided --style=@electronic_ambient
session add-constraint "tempo between 70-90"
session add-constraint "avoid chord: Dm"
session add-agent melody --preset=lyrical
session add-agent rhythm --preset=minimal
session compose --target-duration=3:00
session review  # Critic agent evaluates
session approve section:verse
session refine section:chorus --feedback="needs more energy"
session export
```

### 3.3 Agent Memory and Learning

**Goal**: Agents learn from session history and user preferences.

**Memory Types**:
- **Session memory**: What worked in current session
- **Project memory**: Patterns that were approved across sessions
- **Style memory**: Extracted characteristics from approved work
- **Constraint memory**: User preferences (avoid X, prefer Y)

**REPL Commands**:
```
agent remember "user prefers extended chords"
agent forget constraint:tempo  # Remove a learned preference
agent show-memory melody_agent
agent export-style "my_composition_style.json"
```

---

## Phase 4: Real-Time and Live Coding (v1.2)

### 4.1 Hot Reload

**Goal**: Modify patterns during playback without stopping.

**Implementation**:
- Pattern modifications queued for next cycle boundary
- Smooth transitions between pattern versions
- Tempo/key changes with crossfade

**REPL Commands**:
```
# While playing
ether [playing]> $melody |> transpose 5
Pattern will update at next cycle (2.3s)

ether [playing]> tempo 100
Tempo change scheduled (will ramp over 4 beats)

ether [playing]> swap bass_v1 bass_v2
Pattern swap scheduled for next bar
```

### 4.2 Temporal Recursion

**Goal**: Patterns that schedule themselves, enabling evolving structures.

```etherlang
# Self-scheduling pattern
define evolving_melody {
  play $current_motif
  schedule (now + 4 bars) {
    $current_motif = $current_motif |> mutate
    evolving_melody  # Recurse
  }
}

# Probabilistic scheduling
define maybe_accent {
  if random() > 0.7 {
    play accent_hit
  }
  schedule (now + beat) { maybe_accent }
}
```

### 4.3 External Sync

**Goal**: Synchronize with external tools and hardware.

**Protocols**:
- MIDI Clock (send/receive)
- Ableton Link
- OSC messages
- MIDI CC for parameter control

**REPL Commands**:
```
sync ableton-link
sync midi-clock --device="IAC Driver"
map midi-cc 1 tempo 60 180
map midi-cc 2 $melody.transpose -12 12
osc-receive /composition/energy tension
```

---

## Phase 5: Collaborative and Network Features (v1.3)

### 5.1 Multi-User Sessions

**Goal**: Multiple users (human or LLM) collaborating on a composition.

**Features**:
- Real-time synchronization of EtherScore state
- Lock/unlock patterns to prevent conflicts
- Chat channel for coordination
- Role-based permissions (composer, mixer, reviewer)

**REPL Commands**:
```
collab start --name="ambient_session"
collab invite user@email.com --role=composer
collab lock pattern:melody
collab chat "I'm working on the bass line"
collab history  # See recent changes
collab merge  # Combine divergent edits
```

### 5.2 API and MCP Integration

**Goal**: Expose EtherDAW capabilities to external tools and AI systems.

**MCP Server**:
```json
{
  "tools": [
    {
      "name": "etherdaw_compose",
      "description": "Create a musical pattern",
      "parameters": { "pattern_type": "melody|chord|rhythm", "constraints": {} }
    },
    {
      "name": "etherdaw_analyze",
      "description": "Analyze audio or pattern",
      "parameters": { "target": "pattern_name|file_path", "dimensions": [] }
    },
    {
      "name": "etherdaw_iterate",
      "description": "Iteratively refine toward target",
      "parameters": { "pattern": "name", "target_profile": "name", "iterations": 5 }
    }
  ]
}
```

### 5.3 Version Control Integration

**Goal**: Git-like versioning for compositions.

**REPL Commands**:
```
version commit "Added verse melody"
version branch "experimental-bridge"
version diff HEAD~1
version merge experimental-bridge
version history
version tag "v1.0-final-mix"
```

---

## Phase 6: Advanced Sound Design (v1.4)

### 6.1 Semantic Sound Design

**Goal**: Create and modify sounds using natural language and semantic parameters.

**Current**: Preset-based with parameters
**Future**: Description-based with analysis feedback

```
ether> sound create "warm analog pad with slow attack and subtle movement"

Creating sound from description...
  Analyzing semantic components:
    - "warm" → low-pass filter, boosted low-mids
    - "analog" → slight detuning, soft saturation
    - "pad" → polyphonic, sustained envelope
    - "slow attack" → attack > 500ms
    - "subtle movement" → slow LFO on filter

Generated preset: custom_warm_pad_001
  Oscillator: 2x detuned saw (-5, +5 cents)
  Filter: lowpass @ 2000Hz, Q=0.5
  Envelope: A=0.8s, D=0.5s, S=0.7, R=2s
  LFO: 0.2Hz → filter cutoff (depth: 200Hz)
  Saturation: soft clip, 10%

Preview? (y/n)
```

### 6.2 Spectral Matching

**Goal**: Make one sound match the spectral characteristics of another.

```
ether> match $my_pad to @reference_pad

Analyzing source and target...
  Source brightness: 0.6, Target: 0.35
  Source warmth: 0.4, Target: 0.75
  Source harmonics: thin, Target: rich

Applying corrections:
  1. Lowering filter cutoff by 1500Hz
  2. Adding subtle saturation for harmonics
  3. Increasing low-mid EQ by 3dB

Match score: 84%
Apply changes? (y/n)
```

### 6.3 Effect Chain Synthesis

**Goal**: Design effect chains using high-level descriptions.

```
ether> effects create "spacious but focused, vintage character"

Recommended chain:
  1. Tape saturation (subtle warmth)
  2. Parametric EQ (cut 2-4kHz for focus)
  3. Plate reverb (medium, 2.5s decay)
  4. Stereo widener (subtle, 20%)

Preview on $lead_synth? (y/n)
```

---

## User Personas

### 1. Claude (LLM Composer)

**Needs**:
- Perceptual feedback to understand compositional choices
- Reference analysis to learn from existing music
- Autonomous iteration capabilities
- Structured descriptions, not just raw data

**Workflow**:
1. Receive composition brief from human
2. Analyze reference tracks to understand target style
3. Generate initial patterns using generative algorithms
4. Render, analyze, compare to target, iterate
5. Present refined composition to human for review

### 2. Human Producer (Collaborator)

**Needs**:
- Quick iteration with AI assistance
- Maintain creative control
- Learn from AI suggestions
- Export to standard formats

**Workflow**:
1. Provide high-level direction ("upbeat electronic, 128 BPM")
2. Review AI-generated options
3. Select and refine preferred elements
4. Use AI for tedious tasks (humanization, variation)
5. Export final composition

### 3. Live Coder (Performer)

**Needs**:
- Real-time pattern manipulation
- Predictable latency
- Expressive terse syntax
- External sync capabilities

**Workflow**:
1. Load base patterns
2. Transform in real-time during performance
3. Layer, combine, mutate on the fly
4. Respond to audience/environment

---

## Technical Requirements

### Performance

| Metric | Target |
|--------|--------|
| Pattern modification → audio update | <100ms |
| Full composition render (3 min) | <10s |
| Spectrogram generation | <500ms |
| Analysis report generation | <2s |
| Iterate cycle (render + analyze + adjust) | <5s |

### Compatibility

| Platform | Support Level |
|----------|---------------|
| Node.js (CLI) | Full |
| Browser | Full (except file system) |
| Electron app | Full |
| VS Code extension | Planned |
| MCP server | Full |

### Audio

| Feature | Specification |
|---------|---------------|
| Sample rate | 44.1kHz / 48kHz |
| Bit depth | 16/24-bit |
| Channels | Stereo |
| Export formats | WAV, MIDI, MP3, FLAC |
| Synthesis | Tone.js (Web Audio API) |

---

## Success Metrics

### For LLM Composition

1. **Iteration efficiency**: Compositions improve measurably over iterations
2. **Style matching**: Can match reference track characteristics within 15%
3. **Autonomous quality**: Human approval rate >70% without intervention
4. **Learning retention**: Style preferences persist across sessions

### For Human Collaboration

1. **Time to first draft**: <5 minutes for simple compositions
2. **Iteration speed**: <30 seconds between versions
3. **Export quality**: Professional-grade audio output
4. **Learning curve**: Productive within 1 hour

### For Live Coding

1. **Latency**: <50ms from command to audio change
2. **Stability**: Zero audio glitches during modification
3. **Expressiveness**: Can achieve effects comparable to TidalCycles

---

## Roadmap Summary

| Version | Codename | Focus | Target |
|---------|----------|-------|--------|
| v0.9 | Perception | Audio analysis, feedback loop | Q1 2025 |
| v1.0 | Language | EtherLang DSL, generative algorithms | Q2 2025 |
| v1.1 | Agents | Multi-agent composition | Q3 2025 |
| v1.2 | Live | Real-time modification, hot reload | Q4 2025 |
| v1.3 | Together | Collaboration, network, API | Q1 2026 |
| v1.4 | Design | Semantic sound design | Q2 2026 |

---

## Research References

### Audio-Visual LLM Capabilities
- [Vision Language Models Are Few-Shot Audio Spectrogram Classifiers](https://arxiv.org/html/2411.12058v1) - GPT-4o achieving 59% on spectrogram classification
- [Audio Spectrogram Transformer](https://huggingface.co/docs/transformers/model_doc/audio-spectrogram-transformer) - State-of-the-art audio classification via spectrograms
- [Text-to-music generation models capture musical semantic representations in the human brain](https://www.nature.com/articles/s41467-025-66731-7) - Brain-aligned music AI

### Multi-Agent Composition
- [CoComposer: LLM Multi-agent Collaborative Music Composition](https://arxiv.org/html/2509.00132v1) - Five-agent composition system
- [Musical Agent Systems: MACAT and MACataRT](https://arxiv.org/html/2502.00023v1) - Human-in-the-loop musical agents

### Live Coding
- [TidalCycles](https://tidalcycles.org/) - Pattern-based algorithmic composition
- [Strudel](https://strudel.cc/) - Web-based TidalCycles port
- [Sonic Pi](https://sonic-pi.net/) - Educational live coding

### Generative Algorithms
- [Algorithmic Composition: Paradigms of Automated Music Generation](https://link.springer.com/book/10.1007/978-3-211-75540-2) - Comprehensive algorithmic composition text
- [Cellular Automata Music Composition](https://link.springer.com/chapter/10.1007/978-3-031-13909-3_6) - CA applied to music

### Real-Time AI Music
- [Magenta RealTime](https://www.marktechpost.com/2025/06/22/google-researchers-release-magenta-realtime-an-open-weight-model-for-real-time-ai-music-generation/) - Real-time AI music generation
- [Music Flamingo](https://arxiv.org/abs/2511.10289) - Large audio-language model for music understanding

### Music DSLs
- [Faust](https://faust.grame.fr/) - Functional audio stream processing
- [HMusic](https://www.nime.org/proceedings/2019/nime2019_paper074.pdf) - Haskell music DSL
- [DrumLace](https://drops.dagstuhl.de/entities/document/10.4230/OASIcs.SLATE.2024.8) - Drum programming DSL

---

## Appendix: My Composition Experience

*Reflections from creating the album "Threshold" with EtherDAW v0.83*

### What Worked

1. **Pattern-based thinking**: Defining patterns and transforming them feels natural
2. **JSON as storage**: The declarative format preserves intent clearly
3. **CLI feedback tools**: `preview`, `describe`, `spectrum`, `timeline` were invaluable
4. **Improving the DAW**: Adding features when hitting friction (add11 chords, extended dynamics)

### What Was Missing

1. **No sonic feedback**: I had to trust structure without hearing
2. **Blind timbre choices**: Picked presets by name/description, not sound
3. **No reference comparison**: Couldn't compare to existing music
4. **Slow iteration**: Each change required validation, manual review
5. **Limited genre knowledge**: Theory-based but not "sound-based"

### What Would Transform the Experience

1. **Hearing through spectrograms**: Visual proxy for audio feedback
2. **Reference track analysis**: Learning from existing music
3. **Autonomous iteration**: Compose → render → analyze → adjust loop
4. **Semantic sound matching**: "Make this sound like that"
5. **Multi-agent collaboration**: Specialized help for different domains

This PRD represents what EtherDAW needs to become a truly transformative tool for LLM composition - not replacing human creativity, but enabling a new kind of human-AI musical collaboration.
