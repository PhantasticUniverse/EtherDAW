---
name: verify
description: Evidence-based task verification protocol
auto_load_skills:
  - verification-patterns
---

# /verify - Evidence-Based Task Verification

Verify task completion with tangible evidence, not just claims.

## Protocol

Follow this evidence-gathering process:

### Step 1: Code Verification
```bash
# Build check
npm run build

# Test check
npm run test:run

# Browser build (if UI changes)
npm run build:browser
```

**Show the actual output** - don't just say "tests pass".

### Step 2: EtherScore Validation (if applicable)
```bash
npx tsx src/cli.ts validate <file.etherscore.json>
```

**Report validation results** including any warnings.

### Step 3: Audio Verification (for compositions)
1. Open player.html
2. Load and play the composition
3. Listen for:
   - Expected sounds playing
   - No clicks or pops
   - Proper timing and rhythm
   - Correct dynamics

**Describe what you hear** or take screenshots.

### Step 4: Git Status
```bash
git status
git diff --stat
```

**Show what files changed** and summarize modifications.

## Evidence Checklist

| Claim | Required Evidence |
|-------|-------------------|
| "Tests pass" | Show test output with pass count |
| "Build works" | Show build output (no errors) |
| "Player works" | Describe playback or screenshot |
| "Feature works" | Demonstrate with specific example |
| "Validation passes" | Show validator output |

## Example Evidence Report

```
## Verification Report

### Build
✓ TypeScript compiled with no errors
✓ Browser bundle: 78.2kb

### Tests
✓ 127 tests passed in 4.2s
  - note-parser: 23 passed
  - pattern-expander: 45 passed
  ...

### Audio Check
✓ Loaded in player.html
✓ Playback: 4 bars, drums and bass audible
✓ No audio artifacts detected

### Files Changed
- src/synthesis/presets.ts (+15 lines)
- examples/new-track.etherscore.json (new file)
```

## When to Use

Run `/verify` after:
- Completing a feature implementation
- Fixing a bug
- Making significant code changes
- Creating or modifying compositions
- Before committing changes
