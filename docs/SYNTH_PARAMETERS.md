# Semantic Synth Parameters (v0.5)

EtherDAW v0.5 introduces a semantic parameter system designed for LLM composers. Instead of needing to know Tone.js internals, you can describe sounds using intuitive concepts.

## Core Concept

All semantic parameters use a **0-1 scale**:
- `0` = minimum/none
- `0.5` = neutral/default
- `1` = maximum/full

This makes parameters predictable and easy to reason about.

## Parameter Reference

### Timbre Parameters

| Parameter | Description | What it controls |
|-----------|-------------|------------------|
| `brightness` | 0=dark, 1=bright | Filter cutoff, FM modulation index, harmonicity |
| `warmth` | 0=cold/digital, 1=warm/analog | Harmonicity (lower for warmer), saturation |
| `richness` | 0=thin, 1=thick | Detune amount, voice layering |

### Envelope Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| `attack` | 0=instant (0.001s), 1=slow (2s) | How quickly the sound reaches full volume |
| `decay` | 0=short (0.05s), 1=long (4s) | How quickly it drops to sustain level |
| `sustain` | 0=none, 1=full | Volume level while key is held |
| `release` | 0=short (0.1s), 1=long (4s) | How long sound continues after key release |

### Character Parameters

| Parameter | Description | Effect |
|-----------|-------------|--------|
| `punch` | 0=soft, 1=punchy | Transient sharpness (reduces attack time, tightens decay) |
| `movement` | 0=static, 1=evolving | LFO depth and rate (planned) |
| `space` | 0=dry, 1=wet | Built-in reverb send (planned) |

## Usage Examples

### Basic: Preset with Modifications

```json
{
  "instruments": {
    "lead": {
      "preset": "fm_epiano",
      "params": {
        "brightness": 0.8,
        "attack": 0.2,
        "punch": 0.7
      },
      "volume": -6
    }
  }
}
```

This takes the FM electric piano preset and makes it:
- Brighter (more harmonics/modulation)
- Faster attack
- Punchier transients

### Multiple Instances of Same Preset

```json
{
  "instruments": {
    "lead_bright": {
      "preset": "fm_epiano",
      "params": { "brightness": 0.9, "attack": 0.1 }
    },
    "lead_mellow": {
      "preset": "fm_epiano",
      "params": { "brightness": 0.3, "warmth": 0.8, "attack": 0.5 }
    }
  }
}
```

Same base preset, different character on each track.

### Hybrid: Semantic + Direct Overrides

```json
{
  "instruments": {
    "custom_fm": {
      "preset": "fm_brass",
      "params": { "brightness": 0.7 },
      "overrides": { "harmonicity": 2.5 }
    }
  }
}
```

Semantic params for general shaping, direct overrides for precise control.

## Direct Overrides

For power users who need precise Tone.js control:

```json
{
  "overrides": {
    "oscillator": { "type": "sine" | "triangle" | "square" | "sawtooth" },
    "envelope": { "attack": 0.02, "decay": 0.3, "sustain": 0.5, "release": 0.8 },
    "filterEnvelope": {
      "attack": 0.01,
      "decay": 0.2,
      "sustain": 0.3,
      "release": 0.3,
      "baseFrequency": 200,
      "octaves": 2.5
    },
    "harmonicity": 2.0,
    "modulationIndex": 4.0,
    "modulationEnvelope": { "attack": 0.01, "decay": 0.3, "sustain": 0.2, "release": 0.3 }
  }
}
```

Overrides take precedence over semantic params.

## Preset Categories

### Basic Synths
- `synth` - Default triangle wave
- `sine` - Pure sine wave
- `square` - Square wave
- `sawtooth` - Sawtooth wave

### Bass
- `synth_bass` - Filtered sawtooth bass
- `sub_bass` - Deep sine bass
- `pluck_bass` - Plucky triangle bass

### Pads
- `warm_pad` - Soft triangle pad
- `string_pad` - Sawtooth string ensemble
- `ambient_pad` - Slow-attack sine pad

### Leads
- `lead` - Filtered sawtooth lead
- `soft_lead` - Gentle triangle lead

### Keys
- `electric_piano` - Sine-based keys
- `organ` - Sustained organ tones

### Plucks
- `pluck` - Fast-decay triangle
- `bell` - Sine bell tones
- `marimba` - Wooden mallet sound

### FM Synthesis
- `fm_epiano` - DX7-style Rhodes
- `fm_bass` - Punchy FM bass
- `fm_brass` - Bright FM brass
- `fm_church_bell` - Large bell
- `fm_tubular_bell` - Orchestral bell
- `fm_glass` - Crystalline tones
- `fm_vibraphone` - Jazz vibes
- `fm_organ` - FM organ

### Synthwave (Aliases)
- `synthwave_bass` - Same as fm_bass
- `synthwave_lead` - Bright FM lead
- `synthwave_pad` - Lush sawtooth pad
- `arp_synth` - Fast-attack arp sound

## How Semantic Params Map to Tone.js

### Brightness → FM Parameters
```
brightness: 0.0 → modulationIndex * 0.3
brightness: 0.5 → modulationIndex * 1.0 (default)
brightness: 1.0 → modulationIndex * 1.7
```

Also affects filter envelope `baseFrequency` and `octaves`.

### Warmth → Harmonicity
```
warmth: 0.0 → harmonicity * 1.5 (cold/harsh)
warmth: 0.5 → harmonicity * 1.0 (neutral)
warmth: 1.0 → harmonicity * 0.7 (warm/soft)
```

### Punch → Envelope
```
punch: 0.0 → attack unchanged
punch: 1.0 → attack reduced to 0.001s, decay tightened
```

### Envelope → Time Mapping
```
attack:  0.0 → 0.001s    1.0 → 2.0s
decay:   0.0 → 0.05s     1.0 → 4.0s
release: 0.0 → 0.1s      1.0 → 4.0s
sustain: Direct 0-1 mapping
```

## Tips for LLM Composers

1. **Start with presets** - Pick a preset close to your desired sound, then modify
2. **Use semantic params first** - They're designed for intuitive sound shaping
3. **Reserve overrides for edge cases** - When you need exact Tone.js values
4. **Create multiple instances** - Same preset, different params for variation
5. **Combine with effects** - Semantic params + reverb/delay for full sound design

## Complete Instrument Definition

```typescript
interface Instrument {
  // Start from preset (recommended)
  preset?: string;

  // Or specify type directly
  type?: 'synth' | 'monosynth' | 'fmsynth' | 'polysynth';

  // Semantic parameters (0-1 scale)
  params?: {
    brightness?: number;
    warmth?: number;
    richness?: number;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    punch?: number;
    movement?: number;
    space?: number;
  };

  // Direct Tone.js overrides
  overrides?: ToneJsOverrides;

  // Audio chain
  volume?: number;  // dB
  pan?: number;     // -1 to 1
  effects?: Effect[];
}
```
