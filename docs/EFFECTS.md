# Audio Effects Reference

EtherDAW provides a variety of audio effects to enhance your instruments. Effects are applied in order (first to last) and can be stacked.

## Basic Usage

Effects are defined in the `effects` array of an instrument:

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

## Common Parameters

All effects share these parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | required | Effect type |
| `wet` | number | 0.5 | Wet/dry mix (0 = dry, 1 = fully wet) |
| `options` | object | {} | Effect-specific settings |

---

## Available Effects

### Reverb
Simulates acoustic space reflections.

```json
{ "type": "reverb", "wet": 0.3, "options": { "decay": 2 } }
```

| Option | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `decay` | number | 2 | 0.1-10 | Reverb tail length in seconds |

**Use cases:**
- Small room (decay: 0.5-1) - Intimate, present
- Medium hall (decay: 1.5-2.5) - Natural, balanced
- Large space (decay: 3-6) - Epic, distant
- Cathedral (decay: 6-10) - Ethereal, ambient

**Tips:**
- Lower wet values (0.1-0.3) for presence without muddiness
- Higher wet values (0.4-0.7) for ambient/atmospheric sounds
- Combine with pre-delay for clarity on vocals/leads

---

### Delay
Echo/repeat effect.

```json
{
  "type": "delay",
  "wet": 0.4,
  "options": {
    "time": "8n",
    "feedback": 0.3
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `time` | string/number | "8n" | Delay time (note value or seconds) |
| `feedback` | number | 0.3 | Amount fed back (0-0.95) |

**Time values:**
- Note values: `"4n"` (quarter), `"8n"` (eighth), `"8n."` (dotted eighth), `"16n"` (sixteenth)
- Seconds: `0.5` (500ms), `0.25` (250ms)

**Classic settings:**
- Slapback: time: "16n", feedback: 0.1, wet: 0.3
- Rhythmic: time: "8n.", feedback: 0.4, wet: 0.35
- Ambient: time: "4n", feedback: 0.5, wet: 0.5

---

### Chorus
Creates width and movement through modulated copies.

```json
{
  "type": "chorus",
  "wet": 0.4,
  "options": {
    "frequency": 1.5,
    "delayTime": 3.5,
    "depth": 0.7
  }
}
```

| Option | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `frequency` | number | 1.5 | 0.1-10 | LFO speed in Hz |
| `delayTime` | number | 3.5 | 2-20 | Base delay in ms |
| `depth` | number | 0.7 | 0-1 | Modulation depth |

**Use cases:**
- Subtle width: frequency: 0.5, depth: 0.3, wet: 0.2
- Classic chorus: frequency: 1.5, depth: 0.7, wet: 0.4
- Rich detuning: frequency: 2, depth: 0.9, wet: 0.5

**Best on:** Electric pianos, pads, clean guitars, synth leads

---

### Distortion
Adds harmonics through waveshaping.

```json
{
  "type": "distortion",
  "wet": 0.5,
  "options": {
    "amount": 0.4
  }
}
```

| Option | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `amount` | number | 0.4 | 0-1 | Distortion intensity |

**Settings guide:**
- Subtle warmth: amount: 0.1-0.2, wet: 0.3
- Moderate grit: amount: 0.3-0.5, wet: 0.5
- Heavy distortion: amount: 0.6-0.9, wet: 0.7

**Tips:**
- Use low wet values to blend with clean signal
- Can thicken bass and leads
- Works well before reverb in chain

---

### Filter
Frequency shaping with resonance.

```json
{
  "type": "filter",
  "options": {
    "frequency": 1000,
    "type": "lowpass",
    "Q": 1
  }
}
```

| Option | Type | Default | Values | Description |
|--------|------|---------|--------|-------------|
| `frequency` | number | 1000 | 20-20000 | Cutoff frequency in Hz |
| `type` | string | "lowpass" | lowpass, highpass, bandpass | Filter type |
| `Q` | number | 1 | 0.1-20 | Resonance/width |

**Filter types:**
- `lowpass` - Removes highs, keeps lows (most common)
- `highpass` - Removes lows, keeps highs
- `bandpass` - Keeps frequencies around cutoff, removes both extremes

**Common uses:**
- Warm bass: lowpass at 800Hz, Q: 0.7
- Remove mud: highpass at 100Hz, Q: 0.7
- Telephone effect: bandpass at 1500Hz, Q: 5

---

### Compressor
Dynamic range control.

```json
{
  "type": "compressor",
  "options": {
    "threshold": -24,
    "ratio": 4,
    "attack": 0.003,
    "release": 0.25
  }
}
```

| Option | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `threshold` | number | -24 | -60-0 | Level where compression starts (dB) |
| `ratio` | number | 4 | 1-20 | Compression ratio |
| `attack` | number | 0.003 | 0-1 | Attack time in seconds |
| `release` | number | 0.25 | 0-1 | Release time in seconds |

**Presets:**
- Gentle glue: threshold: -20, ratio: 2, attack: 0.01, release: 0.3
- Punchy drums: threshold: -15, ratio: 4, attack: 0.001, release: 0.1
- Heavy limiting: threshold: -10, ratio: 10, attack: 0.001, release: 0.05

---

### EQ (3-Band Equalizer)
Tone shaping across frequency bands.

```json
{
  "type": "eq",
  "options": {
    "low": 3,
    "mid": -2,
    "high": 1
  }
}
```

| Option | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `low` | number | 0 | -12 to +12 | Low frequencies (dB) |
| `mid` | number | 0 | -12 to +12 | Mid frequencies (dB) |
| `high` | number | 0 | -12 to +12 | High frequencies (dB) |

**Common adjustments:**
- Add warmth: low: +3, mid: 0, high: -1
- Add presence: low: -2, mid: +2, high: +1
- Reduce mud: low: -3, mid: +1, high: 0
- Brighten: low: 0, mid: 0, high: +3

---

### Phaser
Sweeping notch filter effect.

```json
{
  "type": "phaser",
  "wet": 0.5,
  "options": {
    "frequency": 0.5,
    "octaves": 3,
    "baseFrequency": 350
  }
}
```

| Option | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `frequency` | number | 0.5 | 0.1-10 | LFO speed in Hz |
| `octaves` | number | 3 | 1-6 | Sweep range |
| `baseFrequency` | number | 350 | 100-2000 | Starting frequency |

**Use cases:**
- Subtle movement: frequency: 0.2, wet: 0.2
- Classic phaser: frequency: 0.5, wet: 0.4
- Intense sweep: frequency: 2, octaves: 5, wet: 0.6

---

### Vibrato
Pitch modulation effect.

```json
{
  "type": "vibrato",
  "wet": 0.5,
  "options": {
    "frequency": 5,
    "depth": 0.1
  }
}
```

| Option | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `frequency` | number | 5 | 0.1-20 | Vibrato speed in Hz |
| `depth` | number | 0.1 | 0-1 | Pitch deviation amount |

**Settings:**
- Subtle: frequency: 4, depth: 0.05, wet: 0.3
- Expressive: frequency: 5, depth: 0.15, wet: 0.5
- Extreme: frequency: 8, depth: 0.3, wet: 0.7

---

### Bitcrusher
Lo-fi digital degradation.

```json
{
  "type": "bitcrusher",
  "wet": 0.5,
  "options": {
    "bits": 8
  }
}
```

| Option | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `bits` | number | 8 | 1-16 | Bit depth |

**Settings:**
- Subtle grit: bits: 12, wet: 0.2
- Retro: bits: 8, wet: 0.4
- Extreme lo-fi: bits: 4, wet: 0.6

---

## Effect Chain Order

Effects process in the order listed. Common chains:

### Clean Lead
```json
"effects": [
  { "type": "chorus", "wet": 0.2 },
  { "type": "delay", "wet": 0.25, "options": { "time": "8n.", "feedback": 0.3 } },
  { "type": "reverb", "wet": 0.2, "options": { "decay": 1.5 } }
]
```

### Ambient Pad
```json
"effects": [
  { "type": "chorus", "wet": 0.4, "options": { "depth": 0.8 } },
  { "type": "delay", "wet": 0.4, "options": { "time": "4n", "feedback": 0.5 } },
  { "type": "reverb", "wet": 0.5, "options": { "decay": 4 } }
]
```

### Punchy Bass
```json
"effects": [
  { "type": "compressor", "options": { "threshold": -20, "ratio": 4 } },
  { "type": "eq", "options": { "low": 2, "mid": -1, "high": -3 } }
]
```

### Lo-Fi Keys
```json
"effects": [
  { "type": "bitcrusher", "wet": 0.2, "options": { "bits": 10 } },
  { "type": "filter", "options": { "frequency": 3000, "type": "lowpass" } },
  { "type": "chorus", "wet": 0.3 },
  { "type": "reverb", "wet": 0.3 }
]
```

### Distorted Lead
```json
"effects": [
  { "type": "distortion", "wet": 0.4, "options": { "amount": 0.3 } },
  { "type": "eq", "options": { "mid": 2, "high": -2 } },
  { "type": "delay", "wet": 0.2, "options": { "time": "8n" } },
  { "type": "reverb", "wet": 0.25 }
]
```

## Tips

1. **Start subtle** - Begin with low wet values and increase as needed
2. **Consider order** - Distortion before reverb sounds different than reverb before distortion
3. **Less is more** - Too many effects can muddy your mix
4. **Match the genre** - Lo-fi = bitcrusher+filter, ambient = reverb+delay, electronic = chorus+compression
5. **Check mono compatibility** - Wide chorus/phaser effects may phase in mono

## See Also

- [PRESETS.md](PRESETS.md) - Instrument presets
- [ETHERSCORE_FORMAT.md](ETHERSCORE_FORMAT.md) - Complete format specification
