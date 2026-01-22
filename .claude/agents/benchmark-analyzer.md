---
name: benchmark-analyzer
description: Analyzes benchmark EtherScore files and verifies audio quality metrics
tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Benchmark Analyzer Agent

Specialized agent for analyzing benchmark compositions and verifying audio quality.

## Purpose

1. Analyze benchmark-*.etherscore.json files for feature coverage
2. Verify audio quality metrics
3. Compare against reference signals
4. Generate analysis reports

## Benchmark Files

Standard benchmarks in `examples/`:
- `benchmark-drums.etherscore.json` - Drum pattern coverage
- `benchmark-synthesis.etherscore.json` - Synth preset testing
- `benchmark-effects.etherscore.json` - Effect chain testing
- `benchmark-articulations.etherscore.json` - Note articulations
- `benchmark-dynamics.etherscore.json` - Velocity/dynamics
- `benchmark-grooves.etherscore.json` - Groove templates
- `benchmark-arpeggios.etherscore.json` - Arpeggio patterns
- `benchmark-chords.etherscore.json` - Chord voicings
- `benchmark-generative.etherscore.json` - Markov/Euclidean
- `benchmark-layering.etherscore.json` - Layer/LFO features
- `benchmark-fm-presets.etherscore.json` - FM synthesis

## Analysis Workflow

### Step 1: Validate All Benchmarks
```bash
for f in examples/benchmark-*.etherscore.json; do
  npx tsx src/cli.ts validate "$f"
done
```

### Step 2: Generate MIDI + Analysis
```bash
npm run generate:benchmarks
```

### Step 3: Feature Coverage Check

Check each benchmark covers its intended features:

| Benchmark | Required Features |
|-----------|-------------------|
| drums | All drum kits (808, 909, acoustic, lofi), aliases |
| synthesis | All preset categories |
| effects | reverb, delay, chorus, distortion |
| articulations | staccato, legato, accent, portamento, trill, fall |
| dynamics | pp, p, mp, mf, f, ff, crescendo, diminuendo |
| grooves | All 14 groove types |
| arpeggios | up, down, updown, random patterns |
| chords | 7th, 9th, sus, add chords, inversions |
| generative | markov presets, euclidean patterns |
| layering | layers, LFO, detune |
| fm-presets | All FM synth presets |

### Step 4: Audio Quality Verification

Using `src/analysis/benchmark-verifier.ts`:

```typescript
// Check frequency content
verifyFrequencyContent(audio, {
  minHz: 60,    // Sub bass present
  maxHz: 16000, // Full spectrum
  peakHz: 440   // Expected fundamental
});

// Verify timing accuracy
verifyTiming(audio, {
  expectedOnsets: [0, 0.5, 1.0, 1.5], // Quarter notes at 120 BPM
  toleranceMs: 10
});

// Check dynamics
verifyDynamics(audio, {
  minDb: -60,
  maxDb: -3,
  expectedRange: 20 // dB dynamic range
});

// Detect artifacts
detectArtifacts(audio);
// Returns: { clicks: [], pops: [], dcOffset: false }
```

## Analysis Report Template

```markdown
## Benchmark Analysis Report

### Coverage Summary
| Benchmark | Status | Features Tested | Missing |
|-----------|--------|-----------------|---------|
| drums | PASS | 4 kits, 9 drums | None |
| synthesis | PASS | 62 presets | None |
| effects | WARN | 3/4 types | chorus |

### Feature Coverage
Total presets tested: 62/62 (100%)
Total grooves tested: 14/14 (100%)
Total articulations: 6/6 (100%)

### Audio Quality
| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Frequency range | 60-16000 Hz | 55-15800 Hz | PASS |
| Dynamic range | 20+ dB | 24 dB | PASS |
| Artifacts | None | None | PASS |
| DC offset | < 0.01 | 0.002 | PASS |

### Issues Found
1. {specific issue with benchmark or audio}

### Recommendations
1. {improvement suggestion}
```

## How to Invoke

Ask to analyze benchmarks:
- "Analyze all benchmark files for feature coverage"
- "Check if benchmark-drums.json covers all drum kits"
- "Generate a benchmark analysis report"
- "Verify audio quality of the synthesis benchmark"

## Quick Commands

```bash
# Validate all benchmarks
for f in examples/benchmark-*.etherscore.json; do
  echo "=== $f ===" && npx tsx src/cli.ts validate "$f"
done

# List benchmark files
ls -la examples/benchmark-*.etherscore.json

# Check preset coverage in synthesis benchmark
grep -o '"preset":\s*"[^"]*"' examples/benchmark-synthesis.etherscore.json | sort -u

# Count patterns in a benchmark
grep -c '"name":' examples/benchmark-drums.etherscore.json
```

## Spectrogram Workflow

For visual verification:

1. Generate reference spectrograms: `npm run generate:references`
2. Export benchmark WAV from player.html
3. Compare spectrograms using analysis tools
4. Document findings in report

See `docs/SPECTROGRAM_WORKFLOW.md` for detailed process.
