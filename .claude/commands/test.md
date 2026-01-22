# /test - Run the test suite

Run the EtherDAW test suite and report results.

## Commands

```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm test
```

## What Gets Tested

- Note parsing (pitch, duration, articulation, modifiers)
- Chord parsing and voicings
- Pattern expansion (notes, chords, arpeggios, drums, euclidean)
- Scale and chord theory functions
- Timeline compilation
- MIDI export

## Expected Output

All 100+ tests should pass:
```
✓ note-parser.test.ts (X tests)
✓ chord-parser.test.ts (X tests)
✓ pattern-expander.test.ts (X tests)
...
Test Files: X passed
Tests: X passed
```

## After Tests

If all tests pass, consider:
1. Running `npm run build` to verify TypeScript compilation
2. Running `npm run build:browser` if source changed
3. Testing in player.html for integration verification
