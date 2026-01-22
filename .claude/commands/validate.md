---
name: validate
description: Validate a specific EtherScore file
arguments:
  - name: file
    description: Path to the EtherScore file to validate
    required: true
---

# /validate - Single File Validation

Run two-layer validation on a specific EtherScore file.

## Usage

```
/validate examples/my-track.etherscore.json
/validate $ARGUMENTS
```

## What It Checks

### Layer 1: Schema Validation
- Valid JSON structure
- Required fields present
- Correct data types
- Valid pattern references

### Layer 2: Semantic Validation
- Pattern names exist
- Instrument presets are valid
- Note syntax is parseable
- Chord names are valid
- Drum kit names exist
- Time signatures are valid
- References resolve correctly

## Command

```bash
npx tsx src/cli.ts validate <file>
```

## Expected Output

### Success
```
Validating: examples/my-track.etherscore.json
✓ Schema validation passed
✓ Semantic validation passed
✓ All 3 patterns valid
✓ All 2 instruments valid
Validation complete: No issues found
```

### With Warnings
```
Validating: examples/my-track.etherscore.json
✓ Schema validation passed
⚠ Warning: Pattern 'unused_pattern' is defined but never used
⚠ Warning: High velocity (0.95) may cause clipping
Validation complete: 0 errors, 2 warnings
```

### With Errors
```
Validating: examples/my-track.etherscore.json
✗ Error: Unknown instrument preset 'fake_synth'
✗ Error: Pattern 'missing_pattern' referenced but not defined
✗ Error: Invalid note syntax 'X4:q' in pattern 'melody'
Validation failed: 3 errors
```

## Common Issues

| Error | Solution |
|-------|----------|
| Unknown preset | Check `src/synthesis/presets.ts` for valid names |
| Invalid note | Use format `<pitch><octave>:<duration>` (e.g., `C4:q`) |
| Missing pattern | Define pattern in `patterns` section |
| Invalid drum | Use valid drum names or aliases |

## After Validation

If validation passes:
1. Test in `player.html` for audio verification
2. Run `/verify` for full completion check

If validation fails:
1. Fix reported errors
2. Re-run `/validate`
3. Continue until clean
