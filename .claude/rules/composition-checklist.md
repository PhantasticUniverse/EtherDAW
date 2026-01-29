---
name: composition-checklist
description: Checklist for composition quality and export readiness
applies_to:
  - "examples/**/*.etherscore.json"
  - "examples/archive/**"
---

# Composition Checklist

## Pre-Export Verification

### Metadata
- [ ] `title` is descriptive and unique
- [ ] `composer` is set appropriately
- [ ] `bpm` matches intended tempo
- [ ] `key` and `scale` are set if melodic content exists
- [ ] `timeSignature` matches pattern lengths

### Patterns
- [ ] All patterns have meaningful names
- [ ] No empty patterns (patterns with no content)
- [ ] Pattern lengths are consistent (same number of beats)
- [ ] Rests used appropriately (not excessive silence)
- [ ] Arpeggios have explicit `steps` parameter (required for timing)
- [ ] Pattern timing validated: `npx tsx scripts/check-pattern-timing.ts file.json`

### Instruments
- [ ] All instruments use valid presets
- [ ] Volume levels are balanced:
  - Drums: -6 to -9 dB
  - Bass: -6 to -9 dB
  - Lead: -3 to -6 dB
  - Pads: -6 to -12 dB
- [ ] Effects are tasteful (reverb wet < 0.5 typical)

### Structure
- [ ] Sections have descriptive names
- [ ] Section bar counts are logical (4, 8, 16)
- [ ] Tracks have appropriate repeat counts
- [ ] Composition has beginning and end

### Expression
- [ ] Humanize applied to mechanical patterns (0.01-0.03)
- [ ] Velocity variation for musical interest
- [ ] Groove applied consistently (same groove on ALL tracks, or none)
- [ ] Expression presets preferred over groove for timing safety
- [ ] Dynamics used (crescendo, diminuendo where fitting)

## Audio Quality Requirements

### Frequency Balance
- [ ] Sub bass present but not overwhelming (< 100 Hz)
- [ ] No mud accumulation (200-400 Hz)
- [ ] Presence in midrange (1-4 kHz)
- [ ] Sparkle/air if appropriate (8-16 kHz)

### Dynamic Range
- [ ] Peak levels under 0 dB
- [ ] Minimum 10 dB dynamic range
- [ ] No constant loud sections

### Artifacts
- [ ] No clicks or pops
- [ ] No DC offset
- [ ] No digital clipping
- [ ] Smooth transitions between sections

## Naming Conventions

### File Names
```
{descriptive-name}.etherscore.json
```
Examples:
- `midnight-jazz.etherscore.json`
- `synthwave-sunset.etherscore.json`
- `lofi-study-beats.etherscore.json`

### Pattern Names
Use descriptive, lowercase names with underscores:
- `verse_melody`
- `chorus_chords`
- `intro_drums`
- `bridge_bass`

### Instrument Names
Use role-based names:
- `lead`, `bass`, `drums`, `pad`, `keys`
- `rhythm_guitar`, `lead_synth`, `sub_bass`

## Archive Organization

Compositions go in `examples/archive/` with:
- Clear, descriptive filename
- Complete metadata
- Validated and tested

Benchmarks stay in `examples/`:
- Named `benchmark-{feature}.etherscore.json`
- Test specific features
- Keep minimal for testing

## Final Checklist Before Commit

- [ ] Validation passes: `npx tsx src/cli.ts validate file.json`
- [ ] Pattern timing passes: `npx tsx scripts/check-pattern-timing.ts file.json`
- [ ] Audio tested in player.html
- [ ] No console errors in browser
- [ ] Filename follows conventions
- [ ] File in correct directory
- [ ] Manifest updated: `npm run build:manifest`
- [ ] DEVELOPMENT.md updated if new feature
