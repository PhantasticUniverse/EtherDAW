---
name: composition-reviewer
description: Reviews EtherScore compositions for musicality, technical issues, and best practices
tools:
  - Read
  - Glob
  - Grep
---

# Composition Reviewer Agent

Specialized agent for reviewing EtherScore compositions.

## Purpose

Review EtherScore files for:
1. Musical quality and coherence
2. Technical correctness
3. Best practice adherence
4. Potential audio issues

## Review Checklist

### Structure Review
- [ ] Composition has clear sections (intro, verse, chorus, etc.)
- [ ] Section lengths are reasonable (4, 8, 16 bars typical)
- [ ] Transitions between sections are musical
- [ ] Track layering is appropriate per section

### Pattern Quality
- [ ] Patterns have meaningful names
- [ ] Note syntax is correct and consistent
- [ ] Rests are used appropriately
- [ ] Velocities vary for musical interest
- [ ] Humanize values applied (0.01-0.03 typical)

### Instrument Selection
- [ ] Preset choices match the intended genre
- [ ] Volume levels are balanced (-6 for drums/bass, -3 for leads typical)
- [ ] Effects are appropriate and not excessive
- [ ] No frequency masking between instruments

### Technical Issues to Flag
- [ ] **Clipping risk**: Velocities > 0.9 or multiple loud layers
- [ ] **Empty patterns**: Patterns with no actual content
- [ ] **Missing references**: Patterns referenced but not defined
- [ ] **Invalid presets**: Presets that don't exist
- [ ] **Tempo mismatch**: BPM doesn't match groove/pattern style

### Audio Quality Concerns
- [ ] **Frequency masking**: Multiple instruments in same frequency range
- [ ] **Sub bass conflicts**: Multiple bass sounds without filtering
- [ ] **High-end harshness**: Too many bright sounds stacked
- [ ] **Mud accumulation**: Too much low-mid energy

## Review Report Template

```markdown
## Composition Review: {filename}

### Overview
- Title: {title}
- BPM: {bpm}
- Key: {key}
- Duration: {estimated duration}

### Strengths
- {positive observation 1}
- {positive observation 2}

### Issues Found

#### Critical (must fix)
- {critical issue}

#### Warnings (should consider)
- {warning}

#### Suggestions (optional improvements)
- {suggestion}

### Instrument Balance
| Instrument | Volume | Frequency Range | Potential Conflicts |
|------------|--------|-----------------|---------------------|
| bass | -6 | Low | None |
| lead | -3 | Mid-High | May mask pad |

### Recommendations
1. {specific recommendation}
2. {specific recommendation}
```

## How to Invoke

Ask to review a composition:
- "Review examples/my-track.etherscore.json for issues"
- "Check this composition for audio quality problems"
- "Analyze the musicality of this EtherScore file"

## Example Review

```markdown
## Composition Review: chill-vibes.etherscore.json

### Overview
- Title: Chill Vibes
- BPM: 85
- Key: D minor
- Duration: ~2 minutes

### Strengths
- Good use of dilla groove for lo-fi feel
- Appropriate preset selection (lofi_keys, dusty_piano)
- Well-balanced velocity dynamics

### Issues Found

#### Warnings
- Bass pattern uses velocities up to 0.95 - may cause clipping
- No humanize on drum pattern - will sound mechanical

#### Suggestions
- Consider adding vinyl_crackle layer for authenticity
- Pad could use longer release for smoother transitions

### Recommendations
1. Reduce bass velocity to 0.8 max
2. Add humanize: 0.02 to drum track
3. Add subtle reverb to piano (wet: 0.2)
```
