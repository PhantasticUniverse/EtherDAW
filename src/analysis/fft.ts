/**
 * Fast Fourier Transform implementation for audio analysis
 *
 * Radix-2 Cooley-Tukey FFT algorithm
 */

/**
 * Complex number representation
 */
export interface Complex {
  re: number;
  im: number;
}

/**
 * Create a complex number
 */
export function complex(re: number, im: number = 0): Complex {
  return { re, im };
}

/**
 * Multiply two complex numbers
 */
function complexMultiply(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/**
 * Add two complex numbers
 */
function complexAdd(a: Complex, b: Complex): Complex {
  return {
    re: a.re + b.re,
    im: a.im + b.im,
  };
}

/**
 * Subtract two complex numbers
 */
function complexSubtract(a: Complex, b: Complex): Complex {
  return {
    re: a.re - b.re,
    im: a.im - b.im,
  };
}

/**
 * Calculate magnitude of complex number
 */
export function complexMagnitude(c: Complex): number {
  return Math.sqrt(c.re * c.re + c.im * c.im);
}

/**
 * Radix-2 Cooley-Tukey FFT
 * Input length must be a power of 2
 */
export function fft(input: Complex[]): Complex[] {
  const n = input.length;

  // Base case
  if (n === 1) {
    return [input[0]];
  }

  // Check if n is power of 2
  if (n & (n - 1)) {
    throw new Error('FFT input length must be a power of 2');
  }

  // Split into even and odd
  const even: Complex[] = [];
  const odd: Complex[] = [];
  for (let i = 0; i < n; i += 2) {
    even.push(input[i]);
    odd.push(input[i + 1]);
  }

  // Recursive FFT
  const evenFFT = fft(even);
  const oddFFT = fft(odd);

  // Combine
  const result: Complex[] = new Array(n);
  for (let k = 0; k < n / 2; k++) {
    const angle = (-2 * Math.PI * k) / n;
    const twiddle = complex(Math.cos(angle), Math.sin(angle));
    const t = complexMultiply(twiddle, oddFFT[k]);

    result[k] = complexAdd(evenFFT[k], t);
    result[k + n / 2] = complexSubtract(evenFFT[k], t);
  }

  return result;
}

/**
 * Convert real signal to complex
 */
export function realToComplex(signal: number[] | Float32Array): Complex[] {
  const result: Complex[] = new Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    result[i] = complex(signal[i], 0);
  }
  return result;
}

/**
 * Compute magnitude spectrum from FFT result
 * Returns only positive frequencies (first half)
 */
export function magnitudeSpectrum(fftResult: Complex[]): number[] {
  const n = fftResult.length;
  const result: number[] = new Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    result[i] = complexMagnitude(fftResult[i]);
  }
  return result;
}

/**
 * Apply Hann window to signal for better spectral analysis
 */
export function hannWindow(signal: number[] | Float32Array): number[] {
  const n = signal.length;
  const result: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    result[i] = signal[i] * window;
  }
  return result;
}

/**
 * Pad signal to next power of 2
 */
export function padToPowerOf2(signal: number[]): number[] {
  const n = signal.length;
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(n)));
  if (nextPow2 === n) return signal;

  const padded = new Array(nextPow2).fill(0);
  for (let i = 0; i < n; i++) {
    padded[i] = signal[i];
  }
  return padded;
}

/**
 * Compute Short-Time Fourier Transform (STFT)
 * Returns array of magnitude spectra for each time frame
 */
export function stft(
  signal: number[] | Float32Array,
  windowSize: number = 2048,
  hopSize: number = 512
): number[][] {
  const n = signal.length;
  const spectra: number[][] = [];

  for (let start = 0; start + windowSize <= n; start += hopSize) {
    // Extract window
    const window: number[] = new Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
      window[i] = signal[start + i];
    }

    // Apply Hann window
    const windowed = hannWindow(window);

    // Compute FFT
    const fftResult = fft(realToComplex(windowed));

    // Get magnitude spectrum
    const spectrum = magnitudeSpectrum(fftResult);

    spectra.push(spectrum);
  }

  return spectra;
}

/**
 * Convert magnitude to decibels
 */
export function toDecibels(magnitude: number, minDb: number = -80): number {
  if (magnitude <= 0) return minDb;
  const db = 20 * Math.log10(magnitude);
  return Math.max(minDb, db);
}

/**
 * Normalize spectrogram data to 0-1 range
 */
export function normalizeSpectrogram(spectra: number[][]): number[][] {
  // Find global min/max in dB
  let minDb = 0;
  let maxDb = -Infinity;

  const dbSpectra: number[][] = spectra.map(spectrum =>
    spectrum.map(mag => {
      const db = toDecibels(mag);
      if (db > maxDb) maxDb = db;
      return db;
    })
  );

  minDb = -80; // Fixed floor

  // Normalize to 0-1
  const range = maxDb - minDb;
  if (range <= 0) return dbSpectra.map(s => s.map(() => 0));

  return dbSpectra.map(spectrum =>
    spectrum.map(db => Math.max(0, Math.min(1, (db - minDb) / range)))
  );
}
