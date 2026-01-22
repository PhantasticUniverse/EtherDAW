# Instrument Presets Reference

EtherDAW includes a variety of synthesizer presets organized by category. This document describes each preset's character and recommended use cases.

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
| Drums | drums:808, drums:909, drums:acoustic, drums:lofi |

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

- [EFFECTS.md](EFFECTS.md) - Audio effects to enhance presets
- [ETHERSCORE_FORMAT.md](ETHERSCORE_FORMAT.md) - Complete format specification
