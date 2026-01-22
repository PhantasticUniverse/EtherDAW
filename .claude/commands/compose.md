---
name: compose
description: Create a new EtherScore composition
auto_load_skills:
  - etherscore-composition
  - preset-discovery
---

# /compose - Generate EtherScore Composition

Create an original EtherScore composition with full creative control.

## Workflow

### 1. Gather Requirements
Ask the user for:
- **Genre/mood**: "chill lofi", "energetic synthwave", "ambient cinematic"
- **Duration**: "30 seconds", "1-2 minutes"
- **Key elements**: "arpeggio lead", "808 drums", "pad chords"
- **Key/tempo** (optional): "D minor at 85 BPM"

### 2. Select Instruments
Reference the `preset-discovery` skill for available presets:

**Synth Categories:**
- Bass: `sub_bass`, `acid_bass`, `pluck_bass`, `fm_bass`
- Leads: `saw_lead`, `square_lead`, `fm_bell`, `soft_lead`
- Pads: `warm_pad`, `string_pad`, `ambient_pad`, `shimmer`
- Keys: `fm_epiano`, `fm_organ`, `electric_piano`
- Plucks: `pluck`, `marimba`, `fm_vibraphone`

**Drum Kits:** `808`, `909`, `acoustic`, `lofi`

**Noise/FX:** `noise`, `pink_noise`, `vinyl_crackle`, `noise_sweep`

### 3. Create Composition
Generate valid EtherScore JSON:
- Use appropriate patterns (notes, chords, drums, arpeggio)
- Add expressive elements (velocity envelopes, articulations)
- Include humanize for natural feel
- Apply appropriate groove (dilla, shuffle, straight)

### 4. Validate
```bash
npx tsx src/cli.ts validate examples/<name>.etherscore.json
```

### 5. Test
```bash
open player.html
# Load composition, verify playback
```

## Quick Reference

**Note syntax:** `C4:q` (pitch:duration), `r:q` (rest)
**Modifiers:** `.` (dotted), `*` (staccato), `~` (legato), `>` (accent)
**Dynamics:** `@pp`, `@p`, `@mp`, `@mf`, `@f`, `@ff`
**Drums:** `x` = hit, `.` = rest, `x...x...` = pattern

## Example Prompt

"Create a 45-second chill lofi beat with a jazzy piano loop, vinyl crackle vibes, and a boom-bap drum pattern in D minor at 85 BPM"

## Output

Save to: `examples/archive/{descriptive-name}.etherscore.json`

Include in the composition:
- Meaningful `title` and `composer` fields
- Descriptive pattern names
- Appropriate BPM and time signature
- At least 2-3 distinct sections or patterns
