# Instrument Presets Reference

EtherDAW includes 107 synthesizer presets organized across 18 categories. This document describes each preset's character and recommended use cases.

## Preset Overview

| Category | Presets |
|----------|---------|
| Synth | synth, sine, square, sawtooth |
| Bass | synth_bass, sub_bass, pluck_bass, fm_bass |
| Pad | warm_pad, string_pad, ambient_pad, synthwave_pad |
| Lead | lead, soft_lead, synthwave_lead |
| Keys | acoustic_piano, electric_piano, organ, fm_epiano, fm_organ |
| Pluck | pluck, bell, marimba, clean_guitar, rhythm_guitar, muted_guitar |
| FM | fm_epiano, fm_bass, fm_brass, fm_church_bell, fm_tubular_bell, fm_glass, fm_vibraphone, fm_organ |
| Texture | noise, pink_noise, brown_noise, vinyl_crackle, noise_sweep |
| Drums | drums:808, drums:909, drums:acoustic, drums:lofi |
| Lo-Fi | lofi_piano, lofi_keys, tape_wobble |
| Cinematic | cinematic_pad, tension_drone, impact_hit |
| World | kalimba, steel_drum, koto, sitar_lead, conga_high, conga_low, djembe, talking_drum, agogo, shekere |
| Ambient | shimmer_pad, granular_texture, breath_pad |
| Modern | supersaw, bass_growl, pluck_stab |
| **Strings** *(v0.9.4)* | solo_violin, solo_viola, solo_cello, contrabass, string_ensemble, string_pizzicato, string_tremolo, string_spiccato |
| **Brass** *(v0.9.4)* | trumpet, french_horn, trombone, tuba, brass_ensemble, muted_trumpet |
| **Woodwinds** *(v0.9.4)* | flute, clarinet, oboe, bassoon, piccolo, english_horn |
| **Orchestral** *(v0.9.4.1)* | choir_aah, choir_ooh, choir_mmm, mixed_choir, timpani, glockenspiel, xylophone, vibraphone, marimba, tubular_bells, celesta |

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

### `acoustic_piano`
**Concert grand piano** *(v0.9.2)*
- Character: Warm, resonant, classical, romantic
- FM synthesis with modulation decay faster than amplitude
- Attack: 2ms (hammer strike), Decay: 4.5s, Release: 3s
- Spectral centroid: ~700 Hz (warm, not bright)
- Best for: Classical, romantic, solo piano, expressive passages
- Pairs with: reverb (long decay for concert hall)
- Tip: Long release simulates sustain pedal

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

### `clean_guitar`
**Clean electric guitar tone** *(Karplus-Strong synthesis)*
- Character: Warm, resonant, natural string sound
- Synthesis: Karplus-Strong physical modeling with pickup simulation
- Brightness: 0.85 (brighter, more harmonics)
- Decay: ~2s natural ring-out
- Best for: Ballads, jazz, clean leads, chord work

### `rhythm_guitar`
**Rhythm guitar for funk/Afrobeat** *(Karplus-Strong synthesis)*
- Character: Bright, resonant, funky
- Synthesis: Karplus-Strong with strum timing (alternating up/down strokes)
- Brightness: 0.75
- Decay: ~1.5s sustain (tighter than clean)
- Best for: Afrobeat, funk, disco, rhythmic comping
- Note: Chords automatically get strum timing with per-string offsets

### `muted_guitar`
**Palm-muted guitar - tight and percussive** *(Karplus-Strong synthesis)*
- Character: Tight, punchy, muted
- Synthesis: Karplus-Strong with aggressive damping
- Decay: ~0.3s (quick cutoff simulates palm muting)
- Best for: Rock riffs, tight rhythms, percussive accents

> **Technical Note:** Guitar presets use Karplus-Strong physical modeling synthesis,
> which simulates a plucked string using a delay line with filtered feedback. This
> provides more realistic guitar timbres than simple oscillators. Features include:
> - Pickup position simulation (comb filtering)
> - Body resonance (low-frequency warmth)
> - Strum timing for chords (6ms per string, alternating direction)
> - Allpass interpolation for accurate tuning

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

## World Presets (v0.9.2)

Ethnic instruments and world percussion, with new African percussion for Afrobeat.

### `kalimba`
**African Thumb Piano**
- Character: Metallic tines, bell-like
- FM synthesis with high harmonicity (5.5)
- Best for: African melodies, ambient textures
- Tags: african, metallic, thumb piano

### `steel_drum`
**Caribbean Steel Pan**
- Character: Bright, melodic overtones
- Best for: Tropical, Caribbean, calypso

### `koto`
**Japanese Koto**
- Character: Delicate pluck, long sustain
- Best for: Asian-inspired music, meditative

### `sitar_lead`
**Sitar-Inspired Lead**
- Character: Buzzy, drone-like
- Best for: Indian fusion, psychedelic

### African Percussion (v0.9.2)

These presets are designed for authentic Afrobeat and West African music.

### `conga_high`
**High Conga (Quinto)**
- Character: Slap and open tones, pitched at D3
- Membrane synthesis with quick decay
- Best for: Afrobeat, salsa, Latin rhythms

### `conga_low`
**Low Conga (Tumba)**
- Character: Deep, resonant, pitched at G2
- Best for: Foundation rhythm, Latin bass

### `djembe`
**West African Djembe**
- Character: Punchy attack, goblet drum resonance
- Pitched at C3, versatile for bass/tone/slap
- Best for: West African, Afrobeat, drum circles

### `talking_drum`
**Nigerian Talking Drum**
- Character: Pitch-bendable, hourglass drum
- Long pitch decay (0.08s) for expressive tones
- Best for: Yoruba music, Afrobeat fills
- Note: Real talking drums bend pitch with arm pressure

### `agogo`
**Double Bell**
- Character: Bright, cutting metallic bell
- Metal synth at 1200 Hz
- Best for: Afrobeat clave patterns, timeline keeping
- Note: Essential for Afrobeat - provides rhythmic skeleton

### `shekere`
**Gourd Shaker**
- Character: Beaded gourd texture
- White noise with quick envelope
- Best for: Afrobeat texture, polyrhythm layers

---

## Orchestral Strings (v0.9.4)

### `solo_violin`
**Solo Violin**
- Character: Expressive, singing, intimate
- FM synthesis with vibrato LFO
- Best for: Solo melodies, expressive passages
- Range: G3-E7

### `solo_viola`
**Solo Viola**
- Character: Warm, mellow, intimate
- FM synthesis with gentle vibrato
- Best for: Inner voices, warm melodies
- Range: C3-A6

### `solo_cello`
**Solo Cello**
- Character: Rich, deep, expressive
- FM synthesis with slow vibrato
- Best for: Bass melodies, emotional passages
- Range: C2-G5

### `contrabass`
**Double Bass**
- Character: Deep, foundational, resonant
- FM synthesis with slow attack
- Best for: Bass lines, orchestral foundation
- Range: E1-G4

### `string_ensemble`
**String Section**
- Character: Full, lush, cinematic
- Layered FM synthesis
- Best for: Orchestral pads, film scores

### `string_pizzicato`
**Pizzicato Strings**
- Character: Plucky, light, rhythmic
- Short envelope, quick attack
- Best for: Staccato passages, light textures

### `string_tremolo`
**Tremolo Strings**
- Character: Intense, dramatic, suspenseful
- LFO-modulated amplitude
- Best for: Tension, drama, horror

### `string_spiccato`
**Spiccato Strings**
- Character: Bouncing, articulate, energetic
- Very short notes, quick decay
- Best for: Fast passages, rhythmic figures

---

## Orchestral Brass (v0.9.4)

### `trumpet`
**Solo Trumpet**
- Character: Bright, heroic, commanding
- FM synthesis with sharp attack
- Best for: Fanfares, melodic lines
- Range: E3-Bb5

### `french_horn`
**French Horn**
- Character: Warm, noble, majestic
- FM synthesis with rounded attack
- Best for: Sustained harmonies, hunting calls
- Range: B1-F5

### `trombone`
**Trombone**
- Character: Bold, powerful, versatile
- FM synthesis with broad tone
- Best for: Bass brass, powerful phrases
- Range: E2-Bb4

### `tuba`
**Tuba**
- Character: Deep, massive, foundational
- FM synthesis with slow attack
- Best for: Bass foundation, oom-pah
- Range: D1-F4

### `brass_ensemble`
**Brass Section**
- Character: Powerful, majestic, epic
- Layered FM synthesis
- Best for: Fanfares, film scores, climaxes

### `muted_trumpet`
**Muted Trumpet**
- Character: Soft, jazzy, intimate
- Filtered FM with reduced brightness
- Best for: Jazz, subtle passages

---

## Orchestral Woodwinds (v0.9.4)

### `flute`
**Concert Flute**
- Character: Airy, light, lyrical
- Breathy FM synthesis
- Best for: Melodies, pastoral passages
- Range: C4-C7

### `clarinet`
**Clarinet**
- Character: Warm, woody, versatile
- FM synthesis with hollow character
- Best for: Jazz, classical, folk
- Range: D3-Bb6

### `oboe`
**Oboe**
- Character: Reedy, plaintive, distinctive
- FM synthesis with narrow tone
- Best for: Lyrical solos, pastoral scenes
- Range: Bb3-G6

### `bassoon`
**Bassoon**
- Character: Dark, rich, characterful
- FM synthesis with complex timbre
- Best for: Bass woodwind, comic passages
- Range: Bb1-Eb5

### `piccolo`
**Piccolo**
- Character: Bright, piercing, brilliant
- High-register breathy FM
- Best for: High accents, marches
- Range: D5-C8

### `english_horn`
**English Horn**
- Character: Mellow, melancholic, warm
- FM synthesis with dark timbre
- Best for: Sad passages, pastoral themes
- Range: E3-C6

---

## Choir & Orchestral Percussion (v0.9.4.1)

### `choir_aah`
**Choir "Aah"**
- Character: Bright, open, full
- FM synthesis with vowel formants
- Best for: Epic moments, sustained swells

### `choir_ooh`
**Choir "Ooh"**
- Character: Warm, round, intimate
- Darker FM with closed formant
- Best for: Soft passages, lullabies

### `choir_mmm`
**Choir "Mmm"**
- Character: Soft, ethereal, humming
- Very dark FM tone
- Best for: Background texture, mysterious scenes

### `mixed_choir`
**Mixed Choir**
- Character: Full, blended, versatile
- Balanced FM for general choral use
- Best for: Hymns, choral arrangements

### `timpani`
**Orchestral Timpani**
- Character: Deep, booming, dramatic
- Membrane synthesis for authentic kettledrum
- Best for: Dramatic accents, rolls, thunder

### `glockenspiel`
**Glockenspiel** *(v0.9.4.1: FM redesign)*
- Character: Bright, crystalline, bell-like
- High harmonicity FM for inharmonic partials
- Best for: Sparkling accents, magical moments

### `xylophone`
**Xylophone** *(v0.9.4.1: FM redesign)*
- Character: Bright, woody, percussive
- FM synthesis with quick attack, short decay
- Best for: Rhythmic passages, bright accents

### `vibraphone`
**Vibraphone** *(v0.9.4.1: FM redesign)*
- Character: Warm, sustained, jazzy
- FM synthesis with longer sustain
- Best for: Jazz, mellow passages, cool vibes

### `marimba`
**Marimba** *(v0.9.4.1: FM redesign)*
- Character: Mellow, woody, warm
- Low harmonicity FM for fundamental focus
- Best for: World music, lyrical passages

### `tubular_bells`
**Tubular Bells** *(v0.9.4.1: FM redesign)*
- Character: Deep, resonant, ceremonial
- Classic DX7 bell ratio (5.07 harmonicity)
- Best for: Church bells, dramatic moments

### `celesta`
**Celesta** *(v0.9.4.1: FM redesign)*
- Character: Magical, ethereal, delicate
- Bell-piano hybrid FM character
- Best for: Nutcracker, magical scenes, sparkle

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
