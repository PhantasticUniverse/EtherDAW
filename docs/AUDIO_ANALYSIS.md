# EtherDAW Audio Analysis System

## Overview

The audio analysis system enables LLMs to "see" what compositions sound like through spectrogram visualization. Since LLMs can analyze images but cannot hear audio, this creates a visual feedback loop for composition development.

**Key capabilities:**
- Generate spectrograms from WAV files (frequency content over time)
- Compare audio files visually to detect changes/regressions
- Generate reference test signals for calibration
- Render MIDI to audio for comparison testing
- Analyze audio statistics (peak, RMS, frequency balance)

## Architecture

```
src/analysis/
├── fft.ts              - Fast Fourier Transform implementation
├── wav-reader.ts       - WAV file parsing
├── spectrogram.ts      - Spectrogram image generation
├── perceptual.ts       - Perceptual metrics (chromagram, centroid, flux, RMS)
├── describe-audio.ts   - Natural language audio descriptions
├── test-signals.ts     - Reference signal generators
├── midi-renderer.ts    - MIDI to audio conversion
└── index.ts            - Module exports
```

## Perceptual Analysis (v0.9)

Beyond spectrograms, the perceptual analysis system provides text-based metrics that let LLMs "understand" audio through numerical and semantic descriptions.

### Metrics

| Metric | Description | LLM Utility |
|--------|-------------|-------------|
| **Chromagram** | 12-semitone pitch class distribution | Shows active pitches, infers key |
| **Spectral Centroid** | Weighted center of frequency (Hz) | Brightness (warm/bright/harsh) |
| **Spectral Flux** | Frame-to-frame spectral change | Onset detection, rhythmic activity |
| **RMS Energy** | Root mean square amplitude (dB) | Loudness measurement |
| **Zero Crossing Rate** | Sign changes per second | Percussive vs tonal character |

### CLI Usage

```bash
# Analyze a WAV file
npx tsx scripts/analyze-wav.ts audio.wav
```

**Output includes:**
- Spectral profile (brightness, texture, energy level)
- Chromagram with pitch class percentages
- Tonality detection with confidence
- Natural language observations
- Character tags (e.g., "warm", "aggressive", "ethereal")

### Programmatic API

```typescript
import { analyzePerceptual } from './src/analysis/perceptual.js';
import { describeAudio } from './src/analysis/describe-audio.js';
import { readWavFile } from './src/analysis/wav-reader.js';

// Load audio
const { mono, sampleRate } = readWavFile('audio.wav');

// Get metrics
const analysis = analyzePerceptual(mono, sampleRate);
// Returns: {
//   chromagram: { labels, chroma, dominant },
//   centroid: number,      // Hz
//   flux: number,          // 0-1
//   rmsDb: number,         // dB
//   zcr: number,           // crossings/sec
//   dynamicRange: number,  // dB
// }

// Get natural language description
const description = describeAudio(analysis);
// Returns: {
//   brightnessText: "Warm (centroid: 680 Hz)",
//   textureText: "Smooth (flux: 8%)",
//   energyText: "Moderate (-21 dB)",
//   tonality: { text, confidence },
//   observations: string[],
//   summary: string,
//   character: string[],
// }
```

### Brightness Categories

| Centroid | Description |
|----------|-------------|
| < 500 Hz | Very warm, bass-focused |
| 500-1000 Hz | Warm, mid-bass focused |
| 1000-2000 Hz | Neutral, balanced |
| 2000-4000 Hz | Bright, treble-forward |
| > 4000 Hz | Harsh, treble-heavy |

### Flux Categories

| Flux | Description |
|------|-------------|
| < 10% | Smooth, sustained (pads, drones) |
| 10-20% | Moderate articulation |
| 20-40% | Active, articulated (melodies) |
| > 40% | Very percussive, choppy |

## CLI Commands

### Generate Spectrogram

```bash
# Basic spectrogram
etherdaw spectrogram audio.wav

# With options
etherdaw spectrogram audio.wav \
  --output analysis.png \
  --width 1200 \
  --height 400 \
  --colormap magma \
  --waveform \
  --stats
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `--output, -o` | `{name}-spectrogram.png` | Output file path |
| `--width` | 1200 | Image width in pixels |
| `--height` | 400 | Image height in pixels |
| `--colormap` | viridis | Color map (viridis, magma, inferno, plasma, grayscale) |
| `--window` | 2048 | FFT window size |
| `--hop` | 512 | Hop size between windows |
| `--waveform` | false | Also generate waveform image |
| `--stats` | false | Show audio statistics |

### Compare Audio Files

```bash
# Compare two WAV files
etherdaw compare original.wav modified.wav --output diff.png
```

**Output includes:**
- Diff image (green = same, red = different)
- Similarity percentage
- Max difference
- Time regions with changes

### Generate Test Signals

```bash
# Tone generators
etherdaw generate sine --frequency 440 --duration 3
etherdaw generate square --frequency 220 --duration 2
etherdaw generate sawtooth --frequency 110 --duration 2
etherdaw generate triangle --frequency 440 --duration 2

# Frequency sweep
etherdaw generate sweep --start-freq 20 --end-freq 20000 --duration 10

# Noise generators
etherdaw generate white --duration 5
etherdaw generate pink --duration 5
etherdaw generate brown --duration 5

# Reference signals
etherdaw generate a440 --duration 3           # A440 tuning reference
etherdaw generate metronome --bpm 120 --duration 10
etherdaw generate scale                        # C major scale
etherdaw generate testtones                    # 100, 1000, 10000 Hz
```

### Render MIDI to Audio

```bash
# Render MIDI file
etherdaw midi-render melody.mid --output melody.wav
```

## Programmatic API

### Spectrogram Generation

```typescript
import { generateSpectrogram, generateSpectrogramFromFile } from 'etherdaw/analysis';

// From samples
const result = generateSpectrogram(samples, sampleRate, {
  width: 1200,
  height: 400,
  colorMap: 'viridis',
  windowSize: 2048,
  hopSize: 512,
  minFreq: 20,
  maxFreq: 20000,
  logScale: true,
});
// Returns: { image: Buffer, width, height, timePerPixel, freqPerPixel }

// From file (convenience)
const png = generateSpectrogramFromFile('audio.wav', options);
// Returns: Buffer (PNG data)
```

### Audio Comparison

```typescript
import { compareWavFiles } from 'etherdaw/analysis';

const result = compareWavFiles('original.wav', 'modified.wav', {
  width: 1200,
  height: 400,
});
// Returns: {
//   diffImage: Buffer,
//   similarity: number,      // 0-1, higher = more similar
//   maxDifference: number,   // 0-1
//   changedRegions: string[] // e.g., ["2.3s - 5.1s"]
// }
```

### Test Signal Generation

```typescript
import {
  generateSine,
  generateSquare,
  generateSawtooth,
  generateTriangle,
  generateWhiteNoise,
  generatePinkNoise,
  generateBrownNoise,
  generateSweep,
  generateMetronome,
  generateA440,
  generateScale,
  writeWavFile,
} from 'etherdaw/analysis';

// Generate a 440 Hz sine wave
const samples = generateSine(440, 3, 44100);  // freq, duration, sampleRate
writeWavFile(samples, 'sine-440.wav', 44100);

// Generate frequency sweep
const sweep = generateSweep(20, 20000, 10, 44100, 0.8, true);  // logarithmic
writeWavFile(sweep, 'sweep.wav', 44100);

// Generate metronome at 120 BPM
const click = generateMetronome(120, 30, 44100, 4);  // bpm, duration, rate, beatsPerMeasure
writeWavFile(click, 'metronome.wav', 44100);

// Mix multiple signals
import { mixSignals, concatenateSignals, applyFades } from 'etherdaw/analysis';

const mixed = mixSignals([signal1, signal2], [0.5, 0.5]);  // Equal mix
const sequence = concatenateSignals([intro, main, outro], 0.5);  // 0.5s gaps
const faded = applyFades(samples, 0.01, 0.1);  // 10ms fade in, 100ms fade out
```

### MIDI Rendering

```typescript
import { parseMidiFile, renderMidiToWav, createMaryHadALittleLamb } from 'etherdaw/analysis';

// Parse MIDI to analyze
const midi = parseMidiFile('song.mid');
// Returns: { format, ticksPerBeat, tempo, notes, durationSeconds }

// Render to audio
await renderMidiToWav('song.mid', 'song.wav', 44100);

// Create test MIDI file
createMaryHadALittleLamb('mary.mid');  // Creates known reference melody
```

### WAV Reading and Analysis

```typescript
import { readWavFile, getAudioStats, resample } from 'etherdaw/analysis';

// Read WAV file
const wav = readWavFile('audio.wav');
// Returns: {
//   sampleRate, numChannels, bitsPerSample, numSamples, duration,
//   channels: Float32Array[],  // Per-channel data
//   mono: Float32Array,        // Mono mixdown
// }

// Get statistics
const stats = getAudioStats(wav.mono);
// Returns: {
//   peak, rms, peakDb, rmsDb, crestFactor, dcOffset
// }

// Resample
const resampled = resample(samples, 48000, 44100);  // 48kHz to 44.1kHz
```

### FFT Analysis

```typescript
import {
  fft,
  stft,
  realToComplex,
  magnitudeSpectrum,
  hannWindow,
  normalizeSpectrogram,
  toDecibels,
} from 'etherdaw/analysis';

// Single FFT frame
const complexInput = realToComplex(samples.slice(0, 2048));
const fftResult = fft(complexInput);
const magnitudes = magnitudeSpectrum(fftResult);

// Short-Time Fourier Transform (spectrogram data)
const spectra = stft(samples, 2048, 512);  // windowSize, hopSize
const normalized = normalizeSpectrogram(spectra);  // 0-1 range

// Apply window function
const windowed = hannWindow(samples);

// Convert to dB
const db = toDecibels(magnitude, -80);  // min -80 dB floor
```

## Color Maps

Available color maps for spectrogram visualization:

| Name | Description | Best for |
|------|-------------|----------|
| `viridis` | Perceptually uniform, purple to yellow | General analysis |
| `magma` | Dark to bright, purple to yellow | Audio visualization |
| `inferno` | Black through red to yellow | High contrast |
| `plasma` | Purple to yellow | Scientific data |
| `grayscale` | Simple black to white | Print-friendly |

## Use Cases

### 1. Regression Testing

Compare audio output before and after code changes:

```bash
# Render composition
etherdaw export composition.json -f wav -o original.wav

# Make changes, re-render
etherdaw export composition.json -f wav -o modified.wav

# Compare
etherdaw compare original.wav modified.wav -o diff.png
```

If similarity < 95%, investigate the changes.

### 2. Composition Development

Generate spectrograms to visually analyze compositions:

```bash
# Analyze rendered output
etherdaw spectrogram my-composition.wav --stats --waveform
```

Look for:
- **Frequency balance**: Is bass/mid/high well distributed?
- **Dynamics**: Are there quiet and loud sections?
- **Clipping**: Are peaks above 0 dB?
- **DC offset**: Is there unwanted DC bias?

### 3. Reference Comparison

Compare your composition against reference audio:

```bash
# Generate reference (Mary Had a Little Lamb)
etherdaw generate mary --output reference.wav

# Compose the same melody in EtherScore
# Render and compare
etherdaw compare reference.wav my-version.wav
```

### 4. Calibration

Use test signals to verify audio quality:

```bash
# Test frequency response
etherdaw generate sweep --start-freq 20 --end-freq 20000 --duration 10

# Test timing accuracy
etherdaw generate metronome --bpm 120 --duration 30

# Test pitch accuracy
etherdaw generate a440 --duration 3
```

## Reading Spectrograms

A spectrogram shows frequency (vertical axis) over time (horizontal axis), with color indicating amplitude.

**Visual patterns:**

| Pattern | Meaning |
|---------|---------|
| Horizontal lines | Sustained tones/notes |
| Vertical lines | Transients (drums, attacks) |
| Curved lines | Pitch bends, vibrato |
| Bright low frequencies | Bass energy |
| Noise (random speckling) | Noise, reverb tails |
| Harmonic stacks | Rich timbres (many horizontal lines) |

**Frequency landmarks:**
- **20-80 Hz**: Sub bass
- **80-250 Hz**: Bass
- **250-500 Hz**: Low mids
- **500-2000 Hz**: Mids (vocal range)
- **2000-6000 Hz**: Upper mids (presence)
- **6000-20000 Hz**: Highs (brilliance, air)

## Technical Details

### FFT Implementation

Uses Radix-2 Cooley-Tukey algorithm:
- Input must be power of 2 (automatically padded)
- Window function: Hann window
- Returns positive frequencies only (Nyquist)

### WAV Support

Supported formats:
- PCM: 8-bit unsigned, 16-bit signed, 24-bit, 32-bit
- IEEE float: 32-bit
- Channels: Mono, stereo, multi-channel

### PNG Encoding

Built-in PNG encoder (no external dependencies):
- RGB color (8-bit per channel)
- Zlib compression
- CRC32 checksums

### Limitations

- FFT window size must be power of 2
- MIDI renderer uses simple sine synthesis (not production quality)
- Spectrogram frequency resolution trades off with time resolution
- Large files may be slow to process

## Future Enhancements

Planned for future versions:
- **LUFS metering**: Loudness measurement per EBU R128
- **True peak detection**: Clipping analysis
- **Stereo field analysis**: L/R balance, width
- **Pitch tracking**: Melody extraction
- **Beat detection**: Tempo and rhythm analysis
- **Batch processing**: Analyze multiple files
- **Interactive viewer**: HTML-based spectrogram exploration
