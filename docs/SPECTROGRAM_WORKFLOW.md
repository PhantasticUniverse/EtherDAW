# Spectrogram Workflow for LLMs

This document describes how to use spectrograms for verifying compositions and iterating on musical ideas.

## Overview

Spectrograms provide visual representation of audio content, showing frequency over time. For LLMs composing music, spectrograms serve as:

1. **Verification** - Confirm compositions sound as intended
2. **Debugging** - Identify synthesis or timing issues
3. **Creative feedback** - See the "shape" of music visually
4. **Comparison** - A/B test different arrangements

## Generating Spectrograms

### From Reference Signals

```bash
npm run generate:references
```

Creates spectrograms for standard test signals (sine waves, noise, etc.) in `reference/spectrograms/signals/`.

### From Benchmarks

```bash
npm run generate:benchmarks
```

Exports benchmark compositions to MIDI and creates analysis files in `reference/benchmarks/`.

### From Browser Playback

1. Open `player.html` in a browser
2. Load a composition
3. Use the render/export functionality
4. Use analysis tools to generate spectrogram from WAV

## Reading Spectrograms

### Axes

- **X-axis (horizontal)**: Time in seconds
- **Y-axis (vertical)**: Frequency (logarithmic scale by default)
  - Bottom = low frequencies (bass)
  - Top = high frequencies (treble)
- **Color**: Intensity/loudness (bright = loud, dark = quiet)

### Common Patterns

| Visual Pattern | Audio Meaning |
|---------------|---------------|
| Horizontal lines | Sustained tones at constant pitch |
| Vertical lines | Transients (drum hits, staccato notes) |
| Diagonal ascending | Pitch bending up or arpeggios |
| Multiple parallel lines | Harmonics (overtones) of a sound |
| Diffuse brightness | Noise or dense textures |
| Regular vertical spacing | Rhythmic pattern (tempo visible) |

### Instrument Characteristics

| Instrument | Spectrogram Appearance |
|------------|----------------------|
| Sine wave | Single horizontal line |
| Square wave | Odd harmonics (fundamental + 3rd + 5th...) |
| Sawtooth | All harmonics (dense vertical stack) |
| Piano/keys | Attack transient + decaying harmonics |
| Drums | Broadband transients, low bass for kick |
| Pad/strings | Wide frequency spread, soft onset |
| Filter sweep | Diagonal cutoff moving through frequency |

## Verification Workflow

### 1. Establish Reference

For any new feature or composition, first create a reference:

```
reference/
  benchmarks/
    audio/           # MIDI exports
    spectrograms/    # Visual spectrograms
    analysis/        # JSON analysis files
```

### 2. Compare Against Reference

Use the `compareSpectrograms()` function or visual comparison:

```typescript
import { compareSpectrograms } from './src/analysis/spectrogram.js';

const result = compareSpectrograms(
  'reference.wav',
  'current.wav',
  'diff.png'
);

console.log(`Similarity: ${result.similarity * 100}%`);
console.log(`Changed regions: ${result.changedRegions.join(', ')}`);
```

### 3. Automated Verification

Use the benchmark verifier for automated checks:

```typescript
import { verifyBenchmark } from './src/analysis/benchmark-verifier.js';

const result = verifyBenchmark(samples, sampleRate, {
  expectedFrequencyRange: { minFreq: 100, maxFreq: 4000 },
  expectedDynamics: 'crescendo',
});

if (!result.passed) {
  console.log(result.summary);
}
```

## Expected Characteristics by Benchmark

| Benchmark | What to Look For |
|-----------|-----------------|
| synthesis | Each preset has distinct harmonic signature |
| drums | Clear transients, kit differences visible |
| chords | Multiple frequency bands per chord |
| arpeggios | Sequential note onsets, pitch progression |
| articulations | Staccato=short, legato=connected, accents=brighter |
| effects | Reverb=time smear, delay=repeats, filter=cutoff line |
| dynamics | Amplitude variation in brightness |
| timing | Note spacing changes with swing |
| layering | Wider frequency spread, beating from detuning |
| lfo | Periodic modulation visible |
| generative | Each Markov preset makes different patterns |
| transforms | Inversions mirror, retrogrades reverse |
| voice-leading | Smooth chord transitions |
| automation | Continuous parameter changes |
| density-tension | Note density varies according to curve |
| euclidean | Regular rhythmic patterns |

## Troubleshooting

### Issue: No Sound in Spectrogram

- Check if WAV file has non-zero samples
- Verify render completed successfully
- Look for excessive silence detection in verifier

### Issue: Unexpected Frequencies

- Check instrument preset is correct
- Verify key signature is being applied
- Look for detuning or frequency multiplication

### Issue: Timing Looks Off

- Check tempo is correct
- Verify groove/swing settings
- Look for humanize values that are too high

### Issue: Artifacts (clicks/pops)

- Check for abrupt volume changes
- Verify note overlaps are handled correctly
- Look for buffer underruns during render

## Best Practices

1. **Always verify new compositions** against expected characteristics
2. **Use seeded randomness** for reproducible generative content
3. **Compare iterations** to see what changed between versions
4. **Keep reference files** for regression testing
5. **Use frequency balance** to check overall mix

## API Reference

### `generateSpectrogram(samples, sampleRate, options)`

Generates PNG spectrogram from audio samples.

### `compareSpectrograms(wav1Path, wav2Path, outputPath, options)`

Compares two WAV files and generates diff image.

### `verifyBenchmark(samples, sampleRate, options)`

Runs automated verification checks on audio.

### `calculateFrequencyBalance(samples, sampleRate)`

Returns low/mid/high frequency energy distribution.

### `detectArtifacts(samples, sampleRate)`

Checks for DC offset, clipping, clicks, excessive silence.
