# Instrument Presets Reference

EtherDAW includes 67 synthesizer presets organized across 14 categories. This document describes each preset's character and recommended use cases.

## Preset Overview

| Category | Presets |
|----------|---------|
| Synth | synth, sine, square, sawtooth |
| Bass | synth_bass, sub_bass, pluck_bass, fm_bass |
| Pad | warm_pad, string_pad, ambient_pad, synthwave_pad |
| Lead | lead, soft_lead, synthwave_lead |
| Keys | electric_piano, organ, fm_epiano, fm_organ |
| Pluck | pluck, bell, marimba |
| FM | fm_epiano, fm_bass, fm_brass, fm_church_bell, fm_tubular_bell, fm_glass, fm_vibraphone, fm_organ |
| Texture | noise, pink_noise, brown_noise, vinyl_crackle, noise_sweep |
| Drums | drums:808, drums:909, drums:acoustic, drums:lofi |
| Lo-Fi | lofi_piano, lofi_keys, tape_wobble |
| Cinematic | cinematic_pad, tension_drone, impact_hit |
| World | kalimba, steel_drum, sitar_drone |
| Ambient | shimmer_pad, granular_texture, breath_pad |
| Modern | supersaw, bass_growl, pluck_stab |

See `src/presets/` for full definitions. Use `findPresets({ category: 'bass' })` to query programmatically.

---

## Synthesizers

### `synth`
**Default triangle wave synthesizer**
- Character: Mellow, rounded
- Attack: 20ms, Release: 800ms
- Best for: General melodies, warm leads
- Pairs with: reverb, delay

### `sine`
**Pure sine wave**
- Character: Clean, simple, sub-like
- Attack: 10ms, Release: 500ms
- Best for: Sub layers, pure tones, bass reinforcement
- Note: No harmonics - very clean but can be thin

### `square`
**Retro square wave**
- Character: Hollow, nasal, 8-bit
- Attack: 10ms, Release: 300ms
- Best for: Chiptune, retro games, hollow leads
- Pairs with: filter sweeps, bitcrusher

### `sawtooth`
**Bright sawtooth wave**
- Character: Rich, buzzy, aggressive
- Attack: 10ms, Release: 400ms
- Best for: Leads, brass-like sounds, aggressive synths
- Pairs with: filter, distortion

---

## Bass

### `synth_bass`
**Classic synth bass**
- Character: Full, defined, punchy
- Oscillator: Sawtooth with filter envelope
- Attack: 10ms, Release: 300ms
- Best for: Electronic bass, funk, pop
- Tip: Works well in lower octaves (C1-C3)

### `sub_bass`
**Deep sub bass**
- Character: Very deep, powerful, subtle
- Oscillator: Sine wave
- Attack: 20ms, Release: 500ms
- Best for: Hip-hop, EDM, adding low-end weight
- Tip: Often used with another bass for definition

### `pluck_bass`
**Plucky bass sound**
- Character: Tight, defined attack, quick decay
- Oscillator: Triangle with filter
- Attack: 10ms, Release: 200ms
- Best for: Funk, slap-style basslines, staccato phrases
- Tip: Works great with short note durations

### `fm_bass`
**FM synthesis bass** *(v0.3)*
- Character: Punchy, defined, electric
- Harmonicity: 2, ModIndex: 6
- Attack: 1ms, fast mod decay for punch
- Best for: Electronic, house, techno
- Tip: Very defined attack - great for rhythmic basslines

---

## Pads

### `warm_pad`
**Warm, slow-attack pad**
- Character: Soft, enveloping, ambient
- Oscillator: Triangle
- Attack: 500ms, Release: 1500ms
- Best for: Ambient, ballads, atmospheric backgrounds
- Pairs with: reverb, chorus

### `string_pad`
**String-like pad**
- Character: Orchestral, rich, cinematic
- Oscillator: Sawtooth
- Attack: 400ms, Release: 1200ms
- Best for: Film scores, emotional passages, orchestral
- Pairs with: reverb, EQ for presence

### `ambient_pad`
**Ethereal ambient pad**
- Character: Very slow, dreamy, evolving
- Oscillator: Sine
- Attack: 1000ms, Release: 2000ms
- Best for: Ambient, soundscapes, meditation
- Pairs with: heavy reverb, delay

### `synthwave_pad`
**80s Juno-style pad**
- Character: Lush, retro, wide
- Oscillator: Sawtooth
- Attack: 1500ms, Release: 2000ms
- Best for: Synthwave, retrowave, 80s vibes
- Pairs with: chorus, reverb

---

## Leads

### `lead`
**Classic lead synth**
- Character: Cutting, present, expressive
- Oscillator: Sawtooth with filter
- Attack: 10ms, Release: 300ms
- Best for: Melodies, solos, hooks
- Tip: Monophonic feel - good for single-note lines

### `soft_lead`
**Soft, mellow lead**
- Character: Gentle, rounded, intimate
- Oscillator: Triangle
- Attack: 50ms, Release: 500ms
- Best for: Soft melodies, ballads, gentle passages
- Pairs with: chorus, light reverb

### `synthwave_lead`
**80s-style bright lead**
- Character: Cutting, nostalgic, bright
- FM synthesis
- Attack: 20ms, Release: 400ms
- Best for: Synthwave, 80s pop, retrowave
- Pairs with: delay, reverb

---

## Keys

### `electric_piano`
**Basic electric piano**
- Character: Soft, mellow, jazzy
- Oscillator: Sine with decay
- Attack: 10ms, Decay: 800ms
- Best for: Jazz, R&B, ballads
- Pairs with: chorus, phaser

### `organ`
**Simple organ sound**
- Character: Sustained, full, churchy
- Oscillator: Sine, full sustain
- Attack: 10ms, Release: 100ms
- Best for: Gospel, rock, sustained chords
- Tip: Notes sustain fully while held

### `fm_epiano`
**DX7-style electric piano** *(v0.3)*
- Character: Bell-like attack, warm sustain, Rhodes-like
- Harmonicity: 1.0007 (slight detune for warmth)
- ModIndex: 4, fast mod decay
- Best for: Jazz, neo-soul, R&B, ballads
- Pairs with: chorus, reverb
- Note: The slight detuning creates the characteristic "tine" sound

### `fm_organ`
**FM organ** *(v0.3)*
- Character: Sustained brightness, clear
- Harmonicity: 1, ModIndex: 2
- Sustained modulation envelope
- Best for: Electronic, experimental, sustained passages
- Pairs with: chorus, rotary speaker emulation

---

## Plucks

### `pluck`
**Basic pluck sound**
- Character: Short, percussive, guitar-like
- Oscillator: Sawtooth, fast decay
- Attack: 1ms, Decay: 80ms
- Best for: Rhythmic patterns, pizzicato, percussive melodies

### `bell`
**Bell-like tone**
- Character: Pure, ringing, metallic
- Oscillator: Sine, long decay
- Attack: 1ms, Decay: 1000ms
- Best for: Ambient textures, gentle accents, meditation

### `marimba`
**Marimba-like sound**
- Character: Woody, warm, mellow
- Oscillator: Sine
- Attack: 1ms, Decay: 500ms
- Best for: World music, gentle melodies, rhythmic patterns

---

## FM Synthesis Presets (v0.3)

FM presets use frequency modulation for complex, evolving timbres. The key parameters are:
- **Harmonicity**: Ratio between carrier and modulator frequencies
- **Modulation Index**: Amount of modulation (higher = more harmonics/brightness)
- **Modulation Envelope**: How modulation changes over time

### `fm_epiano`
**DX7 Electric Piano**
- Harmonicity: 1.0007 (slightly detuned)
- ModIndex: 4
- Mod envelope decays quickly for warm attack
- Best for: Jazz, soul, ballads

### `fm_bass`
**Punchy FM Bass**
- Harmonicity: 2 (octave relation)
- ModIndex: 6
- Very fast mod decay for defined punch
- Best for: Electronic, dance, rhythmic bass

### `fm_brass`
**FM Brass Stab**
- Harmonicity: 1
- ModIndex: 12
- Mod envelope tracks amplitude (brightness = loudness)
- Best for: Stabs, accents, brass sections

### `fm_church_bell`
**Large Church Bell**
- Harmonicity: 14 (inharmonic)
- ModIndex: 8
- Very long decay (4 seconds)
- Best for: Atmospheric, cinematic, transitions

### `fm_tubular_bell`
**Tubular/Chime Bell**
- Harmonicity: 5.07 (classic DX7 ratio)
- ModIndex: 6
- Medium-long decay
- Best for: Melodic bells, chimes, accents

### `fm_glass`
**Crystal/Glass**
- Harmonicity: 7 (high odd harmonic)
- ModIndex: 3 (subtle)
- Delicate, crystalline
- Best for: Ambient, ethereal, gentle textures

### `fm_vibraphone`
**FM Vibraphone**
- Harmonicity: 4
- ModIndex: 3.5
- Warm mallet character
- Best for: Jazz, easy listening, melodic percussion

### `fm_organ`
**FM Organ**
- Harmonicity: 1
- ModIndex: 2
- Sustained modulation (constant brightness)
- Best for: Sustained passages, electronic

---

## Noise & Texture Presets (v0.81)

For ambient textures, risers, and lo-fi effects.

### `noise`
**White Noise**
- Full spectrum noise
- Medium attack/decay
- Best for: Risers, sweeps, ambient textures

### `pink_noise`
**Pink Noise (1/f)**
- Warmer, more natural sounding
- Equal energy per octave
- Best for: Natural ambience, warmth

### `brown_noise`
**Brown Noise (1/f²)**
- Deep, smooth, rumbling
- Bass-heavy spectrum
- Best for: Sub textures, deep ambience

### `vinyl_crackle`
**Vinyl Crackle**
- Short, percussive noise bursts
- Very short decay
- Best for: Lo-fi texture, vintage feel

### `noise_sweep`
**Noise Sweep**
- Long attack envelope
- Great for builds
- Best for: Risers, transitions, tension

---

## Drum Kits

Drum presets use the format `drums:KITNAME`.

### `drums:808`
**TR-808 Style**
- Character: Deep, boomy, iconic
- Kick: Very deep, long decay, sub-heavy
- Snare: Snappy, short, electronic
- Hi-hats: Crisp, metallic
- Best for: Hip-hop, trap, R&B, electronic

### `drums:909`
**TR-909 Style**
- Character: Punchy, aggressive, driving
- Kick: Punchy, defined attack, medium decay
- Snare: Loud, cracking, present
- Hi-hats: Bright, metallic
- Best for: House, techno, dance, electronic

### `drums:acoustic`
**Natural Acoustic Drums**
- Character: Organic, realistic, natural
- Kick: Rounded, natural, warm
- Snare: Crisp, woody, snappy
- Hi-hats: Natural metallic shimmer
- Best for: Rock, pop, jazz, acoustic genres

### `drums:lofi`
**Vintage Lo-Fi Drums**
- Character: Dusty, vintage, character
- Kick: Slightly compressed, warm
- Snare: Vintage, slightly crushed
- Hi-hats: Dark, filtered
- Best for: Lo-fi hip-hop, chillhop, vintage vibes

### Available Drum Sounds

Each kit includes these sounds:

| Drum | Description |
|------|-------------|
| `kick` | Bass drum |
| `snare` | Snare drum |
| `clap` | Handclap |
| `hihat` | Closed hi-hat |
| `hihat_open` | Open hi-hat |
| `tom_hi` | High tom |
| `tom_mid` | Mid tom |
| `tom_lo` | Low tom |
| `crash` | Crash cymbal |
| `ride` | Ride cymbal |
| `rim` | Rim shot |
| `cowbell` | Cowbell |
| `shaker` | Shaker |

---

## Customizing Presets (v0.5)

### Semantic Parameters

All presets can be customized using semantic parameters - intuitive 0-1 scale values:

```json
{
  "instruments": {
    "lead": {
      "preset": "fm_epiano",
      "params": {
        "brightness": 0.7,
        "warmth": 0.5,
        "attack": 0.2,
        "release": 0.6
      }
    }
  }
}
```

| Parameter | Range | Description |
|-----------|-------|-------------|
| `brightness` | 0-1 | 0=dark, 1=bright (affects filter, harmonicity, modulation) |
| `warmth` | 0-1 | 0=cold/digital, 1=warm/analog (affects saturation, filter Q) |
| `richness` | 0-1 | 0=thin, 1=thick (affects detune, voice layering) |
| `attack` | 0-1 | 0=instant, 1=slow (mapped to 0.001-2s) |
| `decay` | 0-1 | 0=short, 1=long (mapped to 0.05-4s) |
| `sustain` | 0-1 | 0=none, 1=full |
| `release` | 0-1 | 0=short, 1=long (mapped to 0.1-4s) |
| `punch` | 0-1 | 0=soft, 1=punchy (transient sharpness) |

### Multi-Instance Presets

Use the same preset with different settings on multiple tracks:

```json
{
  "instruments": {
    "lead_bright": {
      "preset": "fm_epiano",
      "params": { "brightness": 0.9, "attack": 0.1 }
    },
    "lead_mellow": {
      "preset": "fm_epiano",
      "params": { "brightness": 0.3, "warmth": 0.8 }
    }
  }
}
```

### Direct Tone.js Overrides

For power users who need precise control:

```json
{
  "instruments": {
    "custom": {
      "type": "fmsynth",
      "overrides": {
        "harmonicity": 3.5,
        "modulationIndex": 10,
        "envelope": { "attack": 0.05, "decay": 0.3, "sustain": 0.4, "release": 0.5 }
      }
    }
  }
}
```

See [SYNTH_PARAMETERS.md](SYNTH_PARAMETERS.md) for complete parameter reference.

---

## Usage Examples

### Simple Preset
```json
{
  "instruments": {
    "lead": { "preset": "fm_epiano" }
  }
}
```

### With Volume and Pan
```json
{
  "instruments": {
    "lead": {
      "preset": "fm_epiano",
      "volume": -6,
      "pan": -0.3
    }
  }
}
```

### With Effects
```json
{
  "instruments": {
    "lead": {
      "preset": "fm_epiano",
      "volume": -3,
      "effects": [
        { "type": "chorus", "wet": 0.3 },
        { "type": "reverb", "wet": 0.25, "options": { "decay": 2 } }
      ]
    }
  }
}
```

### Drum Kit
```json
{
  "instruments": {
    "drums": {
      "preset": "drums:909",
      "volume": -2
    }
  }
}
```

## See Also

- [SYNTH_PARAMETERS.md](SYNTH_PARAMETERS.md) - Complete semantic parameter reference (v0.5)
- [EFFECTS.md](EFFECTS.md) - Audio effects to enhance presets
- [ETHERSCORE_FORMAT.md](ETHERSCORE_FORMAT.md) - Complete format specification
