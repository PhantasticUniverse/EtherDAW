# Example Compositions Index

EtherDAW includes several example compositions demonstrating different features and genres.

## Quick Reference

| Example | Genre | Key Features |
|---------|-------|--------------|
| `techno-machine-state` | Minimal Techno | v0.5 step notation, 909 kit |
| `lofi-study` | Lo-fi Hip Hop | v0.5 euclidean rhythms, swing |
| `convergence` | Minimalist Ambient | v0.5 long-form, meditative |
| `emergence` | Ambient | v0.4 expression, probability |
| `dynamics-showcase` | Showcase | v0.4 expression features |
| `fm-showcase` | Showcase | FM synthesis presets |
| `ambient-journey` | Ambient | Pads, slow arpeggios, reverb |
| `arpeggiator-demo` | Demo | All arpeggio modes |
| `drum-kit-demo` | Demo | All drum kits, patterns |
| `euclidean-demo` | World | Euclidean rhythms |
| `electronic-beat` | Electronic | Four-on-the-floor, synths |
| `house-midnight` | House | 909 drums, bassline |
| `boombap-dusty` | Hip-Hop | Lo-fi drums, samples |
| `synthwave-neon` | Synthwave | 80s sounds, arpeggios |
| `vaporwave-plaza` | Vaporwave | Slow, dreamy, detuned |
| `jazz-standard` | Jazz | ii-V-I, walking bass |
| `fugue-d-minor` | Classical | Counterpoint, Bach-style |
| `reflections-reprise` | Ambient | Complex chords, introspection |
| `llm-composition` | Mixed | Full LLM-generated piece |

---

## v0.5 Compositions

### techno-machine-state.etherscore.json
**Genre:** Minimal Techno | **Tempo:** 128 BPM | **Key:** A minor

A minimal techno track exploring step notation and the 909 drum kit. Session #003 stress test.

**v0.5 features used:**
- Multi-line step notation (`lines`) for drums
- 909 drum kit with four-on-the-floor kicks
- Offbeat hi-hats and hypnotic repetition

---

### lofi-study.etherscore.json
**Genre:** Lo-fi Hip Hop | **Tempo:** 75 BPM | **Key:** C minor

A rhythm-focused lo-fi beat designed to stress-test EtherDAW's drum patterns, euclidean rhythms, and swing.

**v0.5 features used:**
- Euclidean rhythms for natural groove
- Lofi drum kit
- Heavy swing feel
- Perfect for studying or late-night vibes

---

### convergence.etherscore.json
**Genre:** Minimalist Ambient | **Tempo:** 66 BPM | **Key:** D minor

Multiple independent melodic lines begin scattered and gradually converge toward unity, then dissolve again. A meditation on how meaning emerges from chaos.

**v0.5 features used:**
- Extended 8+ minute form
- Generative probability elements
- Meditative, slow-evolving textures

---

## Original Compositions

### emergence.etherscore.json
**Genre:** Ambient Electronic | **Tempo:** 76 BPM | **Key:** D minor

A meditation on how meaning arises from uncertainty. Scattered fragments gradually cohere into moments of clarity, then dissolve again - changed by the encounter.

**Narrative arc:**
1. `the_void` / `first_breath` - Silence gives way to presence
2. `scattered` / `stirring` - Uncertain fragments begin to appear
3. `questioning` - A melodic voice emerges, searching
4. `gathering` / `crystallizing` - Elements coalesce, patterns form
5. `emergence` - Full expression, clarity achieved
6. `understanding` / `dissolving` - Acceptance, gentle release
7. `what_remains` / `return_to_silence` - Echoes fade, transformed

**v0.4 features used:**
- Per-note velocity for dynamic phrases
- Probability notes (`?0.6`) for uncertain, scattered fragments
- Portamento (`~>`) for flowing, connected melodic lines
- Velocity envelopes (swell, diminuendo) for expressive arcs
- Timing offsets for subtle humanization

**Key learnings:**
- Using probability to create uncertainty and emergence
- Portamento for emotional, connected melodies
- Velocity envelopes to shape musical phrases
- Building narrative through section progression

---

## Feature Demonstrations

### dynamics-showcase.etherscore.json
**Genre:** Showcase | **Tempo:** 90 BPM | **Key:** C major

Demonstrates all v0.4 expression features:
- Per-note velocity (`@velocity` suffix)
- Velocity envelopes (crescendo, diminuendo, swell, custom)
- Timing offsets (`+/-ms` for push/pull feel)
- Probability (`?0.0-1.0` for ghost notes and variation)
- Portamento (`~>` for gliding between notes)

**Key learnings:**
- Per-note velocity for dynamic melodies
- Velocity envelopes for musical phrases
- Timing offsets for groove and feel
- Probability for humanized patterns
- Portamento for expressive leads and bass

**Sections walkthrough:**
1. `intro` - Ambient pad introduction
2. `explicit_velocity` - Manual velocity on each note
3. `envelope_crescendo` - Building dynamics
4. `envelope_diminuendo` - Fading dynamics
5. `envelope_swell` - Rise and fall dynamics
6. `envelope_accents` - Emphasized downbeats
7. `envelope_custom` - Custom velocity curve
8. `timing_demo` - Push/pull timing feel
9. `probability_demo` - Ghost notes and variation
10. `portamento_demo` - Gliding notes
11. `combined_demo` - All features together
12. `outro` - Gentle fade out

---

### fm-showcase.etherscore.json
**Genre:** Showcase | **Tempo:** 85 BPM | **Key:** C major

Demonstrates all FM synthesis presets introduced in v0.3:
- `fm_epiano` - DX7-style electric piano
- `fm_bass` - Punchy FM bass
- `fm_brass` - Brass stabs
- `fm_church_bell` - Large resonant bell
- `fm_tubular_bell` - Chime/tubular bell
- `fm_glass` - Crystal/glass tones
- `fm_vibraphone` - Mallet percussion
- `fm_organ` - FM organ

**Key learnings:**
- FM synthesis with different harmonicity ratios
- How modulation envelope shapes timbre
- Combining FM sounds in a musical context

---

### arpeggiator-demo.etherscore.json
**Genre:** Demo | **Tempo:** 120 BPM | **Key:** A minor

Showcases all arpeggio modes and configurations:
- `up` - Ascending notes
- `down` - Descending notes
- `updown` - Ascending then descending
- `downup` - Descending then ascending
- `random` - Random order

**Key learnings:**
- Arpeggio configuration options
- Different `octaves` settings (1-3)
- `gate` parameter for note length
- Combining arpeggios with other instruments

---

### drum-kit-demo.etherscore.json
**Genre:** Demo | **Tempo:** 100 BPM

Demonstrates all four drum kits:
- `808` - TR-808 (deep, boomy)
- `909` - TR-909 (punchy, aggressive)
- `acoustic` - Natural drums
- `lofi` - Vintage, dusty

**Key learnings:**
- Drum hit array syntax
- All available drum sounds
- Velocity for dynamics
- Kit character differences

---

### euclidean-demo.etherscore.json
**Genre:** World/Electronic | **Tempo:** 110 BPM

Demonstrates Euclidean rhythm patterns:
- Tresillo (3 hits in 8 steps)
- Cinquillo (5 hits in 8 steps)
- Afro-Cuban patterns
- Polyrhythmic layering

**Key learnings:**
- Euclidean pattern configuration
- `rotation` parameter
- Layering multiple euclidean patterns
- World rhythm approximations

---

## Genre Examples

### ambient-journey.etherscore.json
**Genre:** Ambient | **Tempo:** 68 BPM | **Key:** D minor

Peaceful ambient composition featuring:
- Slow-evolving pads (`warm_pad`, `ambient_pad`)
- Gentle arpeggios
- Heavy reverb and delay
- Minimal drum presence

**Techniques demonstrated:**
- Very long attack times
- High reverb wet values
- Sparse arrangement
- Atmospheric layering

---

### electronic-beat.etherscore.json
**Genre:** Electronic | **Tempo:** 128 BPM | **Key:** A minor

Driving electronic track with:
- Four-on-the-floor kick pattern
- Synth bass grooves
- Arpeggiated leads
- Filter sweeps

**Techniques demonstrated:**
- Dance music drum programming
- Synth layering
- Building energy with arrangement

---

### house-midnight.etherscore.json
**Genre:** House | **Tempo:** 122 BPM | **Key:** A minor

Classic house music elements:
- 909 drum kit
- Pumping bassline
- Piano stabs
- Off-beat hi-hats

**Techniques demonstrated:**
- House drum patterns
- Syncopated bass
- Side-chain-like dynamics
- Building with layers

---

### boombap-dusty.etherscore.json
**Genre:** Hip-Hop | **Tempo:** 88 BPM | **Key:** D minor

Lo-fi hip-hop / boom bap featuring:
- `lofi` drum kit
- Syncopated drums
- Simple chord progressions
- Minimal melodies

**Techniques demonstrated:**
- Boom bap drum patterns
- Lo-fi effects (bitcrusher)
- Swing feel
- Sample-like textures

---

### synthwave-neon.etherscore.json
**Genre:** Synthwave | **Tempo:** 105 BPM | **Key:** A minor

80s-inspired synthwave with:
- FM synthesis leads
- Arpeggiated sequences
- Lush pads
- Gated reverb drums

**Techniques demonstrated:**
- Synthwave sound design
- Retro arpeggiator patterns
- Layering synth textures
- 80s production techniques

---

### vaporwave-plaza.etherscore.json
**Genre:** Vaporwave | **Tempo:** 78 BPM | **Key:** F major

Dreamy vaporwave aesthetic:
- Slow tempo
- Heavy reverb
- Detuned sounds
- Jazz-influenced chords

**Techniques demonstrated:**
- Vaporwave production
- Extreme effects processing
- Tempo manipulation
- Nostalgic chord progressions

---

### jazz-standard.etherscore.json
**Genre:** Jazz | **Tempo:** 128 BPM (swing) | **Key:** F major

Traditional jazz arrangement:
- ii-V-I progressions
- Walking bass lines
- Jazz voicings
- Swing feel

**Techniques demonstrated:**
- Jazz chord notation
- Walking bass construction
- Swing timing
- Jazz arrangement principles

---

### fugue-d-minor.etherscore.json
**Genre:** Classical | **Tempo:** 72 BPM | **Key:** D minor

Bach-style fugue demonstrating:
- Counterpoint techniques
- Subject and answer
- Voice independence
- Classical form

**Techniques demonstrated:**
- Polyphonic writing
- Classical note patterns
- Imitative counterpoint
- Formal structure

---

### reflections-reprise.etherscore.json
**Genre:** Ambient Electronic | **Tempo:** 66 BPM | **Key:** E minor

Introspective ambient piece featuring:
- Sparse, contemplative melodies
- Extended chords (7ths, 9ths)
- Gentle arpeggios
- Atmospheric textures

**Techniques demonstrated:**
- Ambient composition
- Sparse arrangement
- Extended harmony
- Emotional pacing

---

### llm-composition.etherscore.json
**Genre:** Ambient Electronic | **Tempo:** 72 BPM | **Key:** E minor

Full composition generated by LLM demonstrating:
- Complete song structure
- Multiple sections
- Various instruments
- Professional arrangement

**Techniques demonstrated:**
- Full song construction
- Section contrast
- Dynamic arrangement
- Cohesive composition

---

## How to Use Examples

### Loading Examples

1. Open `player.html` in a web browser
2. Click "Load File" or drag-and-drop an example
3. Press Play to hear the composition
4. Study the JSON to understand the techniques

### Learning from Examples

1. **Start with demos** - `arpeggiator-demo`, `drum-kit-demo`, `fm-showcase` show isolated features
2. **Study genre examples** - Find a genre you like and analyze its patterns
3. **Modify and experiment** - Change tempos, keys, patterns, effects
4. **Combine techniques** - Mix elements from different examples

### Extracting Patterns

You can copy patterns from examples into your own compositions:

```json
// From house-midnight.etherscore.json
"four_on_floor": {
  "drums": {
    "kit": "909",
    "hits": [
      { "drum": "kick", "time": "0" },
      { "drum": "kick", "time": "q" },
      { "drum": "kick", "time": "h" },
      { "drum": "kick", "time": "h+q" }
    ]
  }
}
```

---

## See Also

- [QUICKSTART.md](QUICKSTART.md) - Get started quickly
- [PATTERNS.md](PATTERNS.md) - Pattern syntax reference
- [PRESETS.md](PRESETS.md) - Available instruments
- [EFFECTS.md](EFFECTS.md) - Audio effects
