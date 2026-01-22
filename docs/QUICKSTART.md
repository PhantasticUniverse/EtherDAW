# Quick Start Guide

Get started creating music with EtherDAW in minutes.

## Minimal Example

The simplest possible EtherScore:

```json
{
  "settings": { "tempo": 120 },
  "instruments": {
    "synth": { "preset": "synth" }
  },
  "patterns": {
    "melody": { "notes": ["C4:q", "E4:q", "G4:q", "C5:q"] }
  },
  "sections": {
    "main": {
      "bars": 1,
      "tracks": {
        "synth": { "pattern": "melody" }
      }
    }
  },
  "arrangement": ["main"]
}
```

## Step-by-Step Walkthrough

### Step 1: Define Settings

```json
{
  "settings": {
    "tempo": 100,
    "key": "C major"
  }
}
```

### Step 2: Add Instruments

```json
{
  "instruments": {
    "piano": {
      "preset": "fm_epiano",
      "volume": -3
    },
    "bass": {
      "preset": "fm_bass",
      "volume": 0
    },
    "drums": {
      "preset": "drums:909",
      "volume": -2
    }
  }
}
```

### Step 3: Create Patterns

```json
{
  "patterns": {
    "chords": {
      "chords": ["Cmaj7:h", "Am7:h", "Fmaj7:h", "G7:h"]
    },
    "bass_line": {
      "notes": ["C2:8", "r:8", "C2:8", "G2:8", "r:q", "E2:q"]
    },
    "beat": {
      "drums": {
        "kit": "909",
        "hits": [
          { "drum": "kick", "time": "0" },
          { "drum": "snare", "time": "q" },
          { "drum": "kick", "time": "h" },
          { "drum": "snare", "time": "h+q" }
        ]
      }
    }
  }
}
```

### Step 4: Arrange into Sections

```json
{
  "sections": {
    "intro": {
      "bars": 4,
      "tracks": {
        "piano": { "pattern": "chords", "repeat": 2 }
      }
    },
    "verse": {
      "bars": 4,
      "tracks": {
        "piano": { "pattern": "chords", "repeat": 2 },
        "bass": { "pattern": "bass_line", "repeat": 4 },
        "drums": { "pattern": "beat", "repeat": 4 }
      }
    }
  }
}
```

### Step 5: Set the Arrangement

```json
{
  "arrangement": ["intro", "verse", "verse"]
}
```

## Complete Example

```json
{
  "meta": {
    "title": "My First Song",
    "genre": "Pop"
  },
  "settings": {
    "tempo": 100,
    "key": "C major"
  },
  "instruments": {
    "piano": { "preset": "fm_epiano", "volume": -3 },
    "bass": { "preset": "fm_bass", "volume": 0 },
    "drums": { "preset": "drums:909", "volume": -2 }
  },
  "patterns": {
    "chords": {
      "chords": ["Cmaj7:h", "Am7:h", "Fmaj7:h", "G7:h"]
    },
    "bass_line": {
      "notes": ["C2:8", "r:8", "C2:8", "G2:8", "r:q", "E2:q"]
    },
    "beat": {
      "drums": {
        "kit": "909",
        "hits": [
          { "drum": "kick", "time": "0" },
          { "drum": "snare", "time": "q" },
          { "drum": "kick", "time": "h" },
          { "drum": "snare", "time": "h+q" }
        ]
      }
    }
  },
  "sections": {
    "intro": {
      "bars": 4,
      "tracks": {
        "piano": { "pattern": "chords", "repeat": 2 }
      }
    },
    "verse": {
      "bars": 4,
      "tracks": {
        "piano": { "pattern": "chords", "repeat": 2 },
        "bass": { "pattern": "bass_line", "repeat": 4 },
        "drums": { "pattern": "beat", "repeat": 4 }
      }
    }
  },
  "arrangement": ["intro", "verse", "verse"]
}
```

---

## Common Recipes

### Basic Pop Song Structure

```json
{
  "arrangement": [
    "intro",
    "verse",
    "chorus",
    "verse",
    "chorus",
    "bridge",
    "chorus",
    "outro"
  ]
}
```

### Adding Effects to Instruments

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

### Using Arpeggios

```json
{
  "patterns": {
    "arp": {
      "arpeggio": {
        "chord": "Cmaj7",
        "duration": "16",
        "mode": "updown",
        "octaves": 2
      }
    }
  }
}
```

### Four-on-the-Floor Beat

```json
{
  "patterns": {
    "house_beat": {
      "drums": {
        "kit": "909",
        "hits": [
          { "drum": "kick", "time": "0" },
          { "drum": "kick", "time": "q" },
          { "drum": "kick", "time": "h" },
          { "drum": "kick", "time": "h+q" },
          { "drum": "hihat_open", "time": "8" },
          { "drum": "hihat_open", "time": "q+8" },
          { "drum": "hihat_open", "time": "h+8" },
          { "drum": "hihat_open", "time": "h+q+8" },
          { "drum": "clap", "time": "q" },
          { "drum": "clap", "time": "h+q" }
        ]
      }
    }
  }
}
```

### Hip-Hop Beat (Boom Bap)

```json
{
  "patterns": {
    "boom_bap": {
      "drums": {
        "kit": "lofi",
        "hits": [
          { "drum": "kick", "time": "0" },
          { "drum": "kick", "time": "h+8" },
          { "drum": "snare", "time": "q" },
          { "drum": "snare", "time": "h+q" },
          { "drum": "hihat", "time": "0", "velocity": 0.6 },
          { "drum": "hihat", "time": "8", "velocity": 0.4 },
          { "drum": "hihat", "time": "q", "velocity": 0.6 },
          { "drum": "hihat", "time": "q+8", "velocity": 0.4 },
          { "drum": "hihat", "time": "h", "velocity": 0.6 },
          { "drum": "hihat", "time": "h+8", "velocity": 0.4 },
          { "drum": "hihat", "time": "h+q", "velocity": 0.6 },
          { "drum": "hihat", "time": "h+q+8", "velocity": 0.4 }
        ]
      }
    }
  }
}
```

### Jazz ii-V-I

```json
{
  "settings": { "key": "C major", "tempo": 120 },
  "patterns": {
    "jazz_progression": {
      "chords": ["Dm7:h", "G7:h", "Cmaj7:w"]
    }
  }
}
```

### Euclidean Rhythms

```json
{
  "patterns": {
    "afro_cuban": {
      "euclidean": {
        "hits": 5,
        "steps": 8,
        "duration": "8",
        "drum": "cowbell"
      }
    }
  }
}
```

---

## Tips for Success

1. **Start simple** - Begin with basic patterns, add complexity gradually
2. **Use repeat** - Patterns can repeat to fill sections
3. **Layer instruments** - Multiple tracks playing together creates fullness
4. **Add effects** - Reverb and delay add space and polish
5. **Vary velocity** - Different velocities create dynamics
6. **Reference examples** - Look at the example compositions for inspiration

---

## Playback

Save your file with `.etherscore.json` extension and open it in the EtherDAW player (player.html).

## Next Steps

- [PRESETS.md](PRESETS.md) - Explore all available instruments
- [PATTERNS.md](PATTERNS.md) - Learn advanced pattern syntax
- [EFFECTS.md](EFFECTS.md) - Add effects to your sounds
- [THEORY.md](THEORY.md) - Music theory reference
- [EXAMPLES.md](EXAMPLES.md) - Study example compositions
