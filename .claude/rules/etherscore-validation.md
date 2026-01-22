---
name: etherscore-validation
description: Rules for EtherScore validation process
applies_to:
  - "*.etherscore.json"
  - "src/validation/**"
---

# EtherScore Validation Rules

## Two-Layer Validation Architecture

### Layer 1: JSON Schema (`etherscore.schema.json`)
- Validates JSON structure
- Checks required fields exist
- Validates data types
- Ensures array/object formats

### Layer 2: Semantic Validator (`src/validation/validator.ts`)
- Pattern reference resolution
- Instrument preset existence
- Note syntax correctness
- Chord name validity
- Drum kit/name existence
- Time signature validation
- Cross-reference integrity

## When Adding Features

**CRITICAL**: Always update BOTH layers when adding new features:

1. **Add to schema** (`etherscore.schema.json`)
   - Define property types
   - Set required fields
   - Add enums for valid values

2. **Add to validator** (`src/validation/validator.ts`)
   - Add semantic checks
   - Validate references resolve
   - Check for conflicts/issues

## Validation Command

```bash
npx tsx src/cli.ts validate <file.etherscore.json>
```

## Error Categories

### Critical Errors (block export)
- Missing required fields
- Invalid JSON structure
- Unknown preset names
- Unresolved pattern references
- Invalid note syntax

### Warnings (allow export, flag for review)
- High velocities (> 0.9)
- Unused patterns
- Missing humanize on mechanical patterns
- Potential frequency conflicts

## Common Error Patterns

### Pattern Reference Errors
```
Error: Pattern 'melody' referenced in track but not defined
```
**Fix**: Add pattern to `patterns` array or fix typo

### Preset Errors
```
Error: Unknown preset 'fake_preset' for instrument 'lead'
```
**Fix**: Check `src/synthesis/presets.ts` for valid names

### Note Syntax Errors
```
Error: Invalid note 'X4:q' - pitch must be A-G
```
**Fix**: Use valid pitch (A-G) with optional # or b

### Drum Errors
```
Error: Unknown drum 'snaredrum' - use 'snare'
```
**Fix**: Use standard drum names or aliases

## Resolution Workflow

1. Run validation: `npx tsx src/cli.ts validate file.json`
2. Read error message carefully
3. Locate the issue in the file
4. Fix according to error type
5. Re-validate until clean
6. Test in player.html for audio verification

## Pre-Commit Rule

**Never commit** an EtherScore file without:
1. Running `npx tsx src/cli.ts validate <file>`
2. Seeing "Validation complete: No issues found"
3. Testing audio playback in player.html
