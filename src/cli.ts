#!/usr/bin/env node
/**
 * EtherDAW CLI - Command-line interface for EtherDAW
 */

import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { resolve, basename, extname } from 'path';

const program = new Command();

program
  .name('etherdaw')
  .description('A DAW designed for LLMs to compose music')
  .version('0.1.0');

/**
 * REPL command - start interactive environment (v0.82)
 */
program
  .command('repl')
  .description('Start the interactive EtherREPL environment')
  .option('-f, --file <file>', 'Load a file on startup')
  .action(async (options: { file?: string }) => {
    try {
      const { startREPL } = await import('./cli/repl.js');
      await startREPL({
        initialFile: options.file,
        showWelcome: true,
      });
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Play command - play an EtherScore file (v0.82)
 */
program
  .command('play <file>')
  .description('Play an EtherScore file through system audio')
  .option('-l, --loop', 'Loop playback')
  .action(async (file: string, options: { loop?: boolean }) => {
    try {
      const { createNodePlayer } = await import('./node/player.js');
      const { isAudioAvailable } = await import('./node/audio-context.js');

      if (!isAudioAvailable()) {
        console.error('Audio playback not available on this system');
        process.exit(1);
      }

      const player = createNodePlayer();

      player.setCallbacks({
        onProgress: (msg) => console.log(msg),
        onStateChange: (state) => {
          if (state === 'stopped') {
            console.log('Playback stopped');
          }
        },
        onError: (err) => console.error('Playback error:', err.message),
      });

      console.log(`Loading: ${file}`);
      await player.loadFile(file);

      const duration = player.getDuration();
      console.log(`Duration: ${formatDuration(duration)}`);
      console.log('Press Ctrl+C to stop\n');

      await player.play({ loop: options.loop });

      // Wait for playback to complete
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (player.getState() === 'stopped') {
            clearInterval(check);
            resolve();
          }
        }, 100);

        // Handle Ctrl+C
        process.on('SIGINT', () => {
          player.stop();
          clearInterval(check);
          resolve();
        });
      });

      player.dispose();
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Preview command - preview a specific pattern (v0.82)
 */
program
  .command('preview <file>')
  .description('Preview a specific pattern from an EtherScore file')
  .option('-p, --pattern <name>', 'Pattern name to preview')
  .option('-l, --loop', 'Loop playback')
  .action(async (file: string, options: { pattern?: string; loop?: boolean }) => {
    try {
      const { createNodePlayer } = await import('./node/player.js');
      const { isAudioAvailable } = await import('./node/audio-context.js');

      if (!isAudioAvailable()) {
        console.error('Audio playback not available on this system');
        process.exit(1);
      }

      const player = createNodePlayer();

      player.setCallbacks({
        onProgress: (msg) => console.log(msg),
        onStateChange: (state) => {
          if (state === 'stopped') {
            console.log('Playback stopped');
          }
        },
        onError: (err) => console.error('Playback error:', err.message),
      });

      console.log(`Loading: ${file}`);
      await player.loadFile(file);

      // If no pattern specified, list available patterns
      if (!options.pattern) {
        const patterns = player.getPatterns();
        console.log('\nAvailable patterns:');
        for (const p of patterns) {
          console.log(`  - ${p}`);
        }
        console.log('\nUse --pattern <name> to preview a specific pattern');
        player.dispose();
        return;
      }

      console.log(`Previewing pattern: ${options.pattern}`);
      console.log('Press Ctrl+C to stop\n');

      await player.playPattern(options.pattern, { loop: options.loop });

      // Wait for playback to complete
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (player.getState() === 'stopped') {
            clearInterval(check);
            resolve();
          }
        }, 100);

        // Handle Ctrl+C
        process.on('SIGINT', () => {
          player.stop();
          clearInterval(check);
          resolve();
        });
      });

      player.dispose();
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Validate command - check EtherScore syntax
 */
program
  .command('validate <file>')
  .description('Validate an EtherScore file')
  .action(async (file: string) => {
    try {
      const { validateFull } = await import('./schema/validator.js');
      const { validateScore } = await import('./engine/compiler.js');

      const content = await readFile(resolve(file), 'utf-8');
      const score = JSON.parse(content);

      // Schema validation
      const schemaResult = validateFull(score);
      if (!schemaResult.valid) {
        console.error('Schema validation failed:');
        for (const error of schemaResult.errors) {
          console.error(`  ${error.path}: ${error.message}`);
        }
        process.exit(1);
      }

      // Semantic validation
      const errors = validateScore(score);
      if (errors.length > 0) {
        console.error('Semantic validation errors:');
        for (const error of errors) {
          console.error(`  ${error}`);
        }
        process.exit(1);
      }

      console.log('✓ Valid EtherScore file');
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Info command - show details about an EtherScore
 */
program
  .command('info <file>')
  .description('Show information about an EtherScore file')
  .action(async (file: string) => {
    try {
      const { validateOrThrow } = await import('./schema/validator.js');
      const { analyze } = await import('./engine/compiler.js');

      const content = await readFile(resolve(file), 'utf-8');
      const score = validateOrThrow(JSON.parse(content));
      const info = analyze(score);

      console.log('\nEtherScore Info');
      console.log('===============');
      if (score.meta?.title) console.log(`Title: ${score.meta.title}`);
      if (score.meta?.composer) console.log(`Composer: ${score.meta.composer}`);
      if (score.meta?.mood) console.log(`Mood: ${score.meta.mood}`);
      console.log(`Tempo: ${score.settings.tempo} BPM`);
      console.log(`Key: ${score.settings.key || 'Not specified'}`);
      console.log(`Time Signature: ${score.settings.timeSignature || '4/4'}`);
      console.log();
      console.log(`Sections: ${info.totalSections}`);
      console.log(`Total Bars: ${info.totalBars}`);
      console.log(`Duration: ${formatDuration(info.durationSeconds)}`);
      console.log(`Patterns: ${info.patterns.length}`);
      console.log(`Instruments: ${info.instruments.join(', ') || 'None'}`);
      console.log();
      console.log('Arrangement:');
      for (const section of info.sections) {
        console.log(`  - ${section.name} (${section.bars} bars)`);
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Compile command - compile to timeline (for debugging)
 */
program
  .command('compile <file>')
  .description('Compile an EtherScore and show compilation stats')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (file: string, options: { verbose?: boolean }) => {
    try {
      const { validateOrThrow } = await import('./schema/validator.js');
      const { compile } = await import('./engine/compiler.js');

      const content = await readFile(resolve(file), 'utf-8');
      const score = validateOrThrow(JSON.parse(content));
      const result = compile(score);

      console.log('\nCompilation Result');
      console.log('==================');
      console.log(`Sections compiled: ${result.stats.totalSections}`);
      console.log(`Total bars: ${result.stats.totalBars}`);
      console.log(`Total notes: ${result.stats.totalNotes}`);
      console.log(`Duration: ${formatDuration(result.stats.durationSeconds)}`);
      console.log(`Instruments: ${result.stats.instruments.join(', ')}`);

      if (result.warnings.length > 0) {
        console.log('\nWarnings:');
        for (const warning of result.warnings) {
          console.log(`  ⚠ ${warning}`);
        }
      }

      if (options.verbose) {
        console.log('\nTimeline Events:');
        for (const event of result.timeline.events.slice(0, 20)) {
          if (event.type === 'note') {
            console.log(`  ${event.time.toFixed(2)}b: ${event.pitch} (${event.duration.toFixed(2)}b) [${event.instrument}]`);
          }
        }
        if (result.timeline.events.length > 20) {
          console.log(`  ... and ${result.timeline.events.length - 20} more events`);
        }
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Export command - export to MIDI, WAV, or ABC
 */
program
  .command('export <file>')
  .description('Export an EtherScore to MIDI, WAV, or ABC format')
  .option('-f, --format <format>', 'Output format (midi, wav, abc)', 'midi')
  .option('-o, --output <file>', 'Output file path')
  .action(async (file: string, options: { format: string; output?: string }) => {
    try {
      const { validateOrThrow } = await import('./schema/validator.js');
      const { compile } = await import('./engine/compiler.js');

      const content = await readFile(resolve(file), 'utf-8');
      const score = validateOrThrow(JSON.parse(content));
      const { timeline } = compile(score);

      const inputName = basename(file, extname(file));
      let outputPath: string;
      let outputData: Buffer | string;

      switch (options.format.toLowerCase()) {
        case 'midi': {
          const { exportToMidiBytes } = await import('./output/midi-export.js');
          outputPath = options.output || `${inputName}.mid`;
          const bytes = exportToMidiBytes(timeline, { name: score.meta?.title });
          outputData = Buffer.from(bytes);
          break;
        }

        case 'abc': {
          const { exportScoreToAbc } = await import('./output/abc-export.js');
          outputPath = options.output || `${inputName}.abc`;
          outputData = exportScoreToAbc(score, timeline);
          break;
        }

        case 'wav': {
          console.log('WAV export requires browser environment with Tone.js.');
          console.log('Use the programmatic API for WAV export.');
          process.exit(1);
          return;
        }

        default:
          console.error(`Unknown format: ${options.format}`);
          process.exit(1);
          return;
      }

      await writeFile(resolve(outputPath), outputData);
      console.log(`✓ Exported to ${outputPath}`);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * New command - create a new EtherScore template (v0.82: added techno, lofi, ambient)
 */
program
  .command('new')
  .description('Create a new EtherScore file from a template')
  .option('-t, --template <name>', 'Template name (minimal, techno, lofi, ambient, jazz)', 'minimal')
  .option('-o, --output <file>', 'Output file path', 'song.etherscore.json')
  .option('--list', 'List available templates')
  .action(async (options: { template: string; output: string; list?: boolean }) => {
    try {
      if (options.list) {
        console.log('\nAvailable Templates:');
        console.log('====================');
        console.log('  minimal  - Basic starting point');
        console.log('  techno   - Driving 4/4 techno template');
        console.log('  lofi     - Chill lo-fi hip-hop template');
        console.log('  ambient  - Ethereal ambient template');
        console.log('  jazz     - Jazz standard template');
        return;
      }

      const template = await getTemplate(options.template);
      await writeFile(
        resolve(options.output),
        JSON.stringify(template, null, 2)
      );
      console.log(`✓ Created ${options.output} from "${options.template}" template`);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * List command - list available presets, scales, etc.
 */
program
  .command('list <type>')
  .description('List available presets, scales, chords, or grooves')
  .action(async (type: string) => {
    switch (type.toLowerCase()) {
      case 'presets':
      case 'instruments': {
        const { PRESET_REGISTRY, getCategories } = await import('./presets/index.js');
        console.log('\nAvailable Instrument Presets:');
        console.log('=============================');
        const categories = new Map<string, string[]>();
        for (const [name, preset] of Object.entries(PRESET_REGISTRY)) {
          if (!categories.has(preset.category)) {
            categories.set(preset.category, []);
          }
          categories.get(preset.category)!.push(`${name}: ${preset.description}`);
        }
        // Sort categories by predefined order
        const categoryOrder = getCategories();
        for (const category of categoryOrder) {
          const presets = categories.get(category);
          if (presets && presets.length > 0) {
            console.log(`\n${category.toUpperCase()} (${presets.length}):`);
            for (const preset of presets.sort()) {
              console.log(`  - ${preset}`);
            }
          }
        }
        break;
      }

      case 'scales': {
        const { getAvailableScales } = await import('./theory/scales.js');
        console.log('\nAvailable Scales:');
        console.log('=================');
        for (const scale of getAvailableScales()) {
          console.log(`  - ${scale}`);
        }
        break;
      }

      case 'chords': {
        const { getAvailableQualities } = await import('./theory/chords.js');
        console.log('\nAvailable Chord Qualities:');
        console.log('==========================');
        for (const quality of getAvailableQualities()) {
          console.log(`  - ${quality || '(major)'}`);
        }
        break;
      }

      case 'grooves': {
        const { getAvailableGrooves, GROOVE_TEMPLATES } = await import('./theory/rhythm.js');
        console.log('\nAvailable Grooves:');
        console.log('==================');
        for (const name of getAvailableGrooves()) {
          const groove = GROOVE_TEMPLATES[name];
          console.log(`  - ${name}: ${groove.name}`);
        }
        break;
      }

      default:
        console.error(`Unknown type: ${type}`);
        console.log('Available types: presets, scales, chords, grooves');
        process.exit(1);
    }
  });

// Helper functions

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function getTemplate(name: string): Promise<object> {
  // v0.82: Load templates from templates/ directory for techno, lofi, ambient
  const fileTemplates = ['techno', 'lofi', 'ambient'];
  if (fileTemplates.includes(name)) {
    const { readFile: readFileAsync } = await import('fs/promises');
    const { dirname, join } = await import('path');
    const { fileURLToPath } = await import('url');

    // Try to find templates directory relative to this file or cwd
    const possiblePaths = [
      join(process.cwd(), 'templates', `${name}.etherscore.json`),
      join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', `${name}.etherscore.json`),
    ];

    for (const templatePath of possiblePaths) {
      try {
        const content = await readFileAsync(templatePath, 'utf-8');
        return JSON.parse(content);
      } catch {
        // Try next path
      }
    }
    throw new Error(`Template "${name}" not found`);
  }

  const templates: Record<string, object> = {
    minimal: {
      meta: {
        title: 'Untitled',
      },
      settings: {
        tempo: 120,
        key: 'C major',
        timeSignature: '4/4',
      },
      instruments: {
        synth: { preset: 'synth' },
      },
      patterns: {
        main: {
          notes: ['C4:q', 'E4:q', 'G4:q', 'C5:q'],
        },
      },
      sections: {
        intro: {
          bars: 4,
          tracks: {
            synth: { pattern: 'main', repeat: 4 },
          },
        },
      },
      arrangement: ['intro'],
    },

    ambient: {
      meta: {
        title: 'Ambient Journey',
        mood: 'ethereal',
      },
      settings: {
        tempo: 70,
        key: 'D minor',
        timeSignature: '4/4',
      },
      instruments: {
        pad: { preset: 'ambient_pad', effects: [{ type: 'reverb', wet: 0.7 }] },
        bass: { preset: 'sub_bass' },
      },
      patterns: {
        pad_chords: {
          chords: ['Dm:w', 'Am:w', 'Bb:w', 'Gm:w'],
        },
        bass_line: {
          notes: ['D2:h', 'r:h', 'A2:h', 'r:h'],
        },
      },
      sections: {
        intro: {
          bars: 8,
          tracks: {
            pad: { pattern: 'pad_chords', velocity: 0.5 },
          },
        },
        main: {
          bars: 16,
          tracks: {
            pad: { pattern: 'pad_chords', repeat: 2, velocity: 0.6 },
            bass: { pattern: 'bass_line', repeat: 4, velocity: 0.7 },
          },
        },
      },
      arrangement: ['intro', 'main', 'intro'],
    },

    jazz: {
      meta: {
        title: 'Jazz Standard',
        mood: 'smooth',
      },
      settings: {
        tempo: 130,
        key: 'F major',
        timeSignature: '4/4',
        swing: 0.6,
      },
      instruments: {
        piano: { preset: 'electric_piano' },
        bass: { preset: 'pluck_bass' },
      },
      patterns: {
        comping: {
          chords: ['Fmaj7:h', 'Gm7:h', 'Am7:h', 'Gm7:h'],
        },
        walking_bass: {
          notes: ['F2:q', 'G2:q', 'A2:q', 'Bb2:q', 'C3:q', 'D3:q', 'E3:q', 'F3:q'],
        },
      },
      sections: {
        head: {
          bars: 8,
          tracks: {
            piano: { pattern: 'comping', repeat: 2, velocity: 0.7 },
            bass: { pattern: 'walking_bass', velocity: 0.8 },
          },
        },
      },
      arrangement: ['head', 'head'],
    },
  };

  if (!templates[name]) {
    throw new Error(`Unknown template: ${name}. Available: ${Object.keys(templates).join(', ')}`);
  }

  return templates[name];
}

/**
 * Spectrogram command - analyze audio visually
 */
program
  .command('spectrogram <file>')
  .description('Generate a spectrogram image from a WAV file')
  .option('-o, --output <file>', 'Output PNG file path')
  .option('--width <pixels>', 'Image width', '1200')
  .option('--height <pixels>', 'Image height', '400')
  .option('--colormap <name>', 'Color map (viridis, magma, inferno, plasma, grayscale)', 'viridis')
  .option('--window <samples>', 'FFT window size', '2048')
  .option('--hop <samples>', 'Hop size', '512')
  .option('--waveform', 'Also generate waveform image')
  .option('--stats', 'Show audio statistics')
  .action(async (file: string, options: {
    output?: string;
    width: string;
    height: string;
    colormap: string;
    window: string;
    hop: string;
    waveform?: boolean;
    stats?: boolean;
  }) => {
    try {
      const { generateSpectrogramFromFile, generateWaveformPng } = await import('./analysis/spectrogram.js');
      const { readWavFile, getAudioStats } = await import('./analysis/wav-reader.js');
      const { writeFile: writeFileAsync } = await import('fs/promises');

      const inputName = basename(file, extname(file));
      const outputPath = options.output || `${inputName}-spectrogram.png`;

      console.log(`Analyzing: ${file}`);

      // Generate spectrogram
      const spectrogramPng = generateSpectrogramFromFile(resolve(file), {
        width: parseInt(options.width),
        height: parseInt(options.height),
        colorMap: options.colormap as 'viridis' | 'magma' | 'inferno' | 'plasma' | 'grayscale',
        windowSize: parseInt(options.window),
        hopSize: parseInt(options.hop),
      });

      await writeFileAsync(resolve(outputPath), spectrogramPng);
      console.log(`✓ Spectrogram saved to ${outputPath}`);

      // Optionally generate waveform
      if (options.waveform) {
        const wavData = readWavFile(resolve(file));
        const waveformPng = generateWaveformPng(wavData.mono, {
          width: parseInt(options.width),
          height: 150,
        });
        const waveformPath = outputPath.replace('.png', '-waveform.png');
        await writeFileAsync(resolve(waveformPath), waveformPng);
        console.log(`✓ Waveform saved to ${waveformPath}`);
      }

      // Optionally show stats
      if (options.stats) {
        const wavData = readWavFile(resolve(file));
        const stats = getAudioStats(wavData.mono);
        console.log('\nAudio Statistics:');
        console.log(`  Sample Rate: ${wavData.sampleRate} Hz`);
        console.log(`  Duration: ${formatDuration(wavData.duration)}`);
        console.log(`  Channels: ${wavData.numChannels}`);
        console.log(`  Peak: ${stats.peakDb.toFixed(1)} dB`);
        console.log(`  RMS: ${stats.rmsDb.toFixed(1)} dB`);
        console.log(`  Crest Factor: ${stats.crestFactor.toFixed(2)}`);
        console.log(`  DC Offset: ${(stats.dcOffset * 100).toFixed(3)}%`);
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Compare command - compare two audio files visually
 */
program
  .command('compare <file1> <file2>')
  .description('Compare two WAV files and generate difference visualization')
  .option('-o, --output <file>', 'Output PNG file path', 'comparison.png')
  .option('--width <pixels>', 'Image width', '1200')
  .option('--height <pixels>', 'Image height', '400')
  .action(async (file1: string, file2: string, options: {
    output: string;
    width: string;
    height: string;
  }) => {
    try {
      const { compareWavFiles } = await import('./analysis/spectrogram.js');
      const { writeFile: writeFileAsync } = await import('fs/promises');

      console.log(`Comparing: ${file1} vs ${file2}`);

      const result = compareWavFiles(
        resolve(file1),
        resolve(file2),
        {
          width: parseInt(options.width),
          height: parseInt(options.height),
        }
      );

      await writeFileAsync(resolve(options.output), result.diffImage);
      console.log(`✓ Comparison saved to ${options.output}`);
      console.log(`  Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`  Max difference: ${(result.maxDifference * 100).toFixed(1)}%`);

      if (result.changedRegions.length > 0) {
        console.log('\n  Changed regions:');
        for (const region of result.changedRegions) {
          console.log(`    - ${region}`);
        }
      }

      if (result.similarity < 0.95) {
        console.log('\n⚠ Significant differences detected!');
      } else {
        console.log('\n✓ Files are very similar');
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Generate test signals
 */
program
  .command('generate <type>')
  .description('Generate test signals (sine, sweep, noise, metronome, scale, a440)')
  .option('-o, --output <file>', 'Output WAV file path')
  .option('-d, --duration <seconds>', 'Duration in seconds', '3')
  .option('-f, --frequency <hz>', 'Frequency in Hz (for sine)', '440')
  .option('--start-freq <hz>', 'Start frequency for sweep', '20')
  .option('--end-freq <hz>', 'End frequency for sweep', '20000')
  .option('--bpm <tempo>', 'BPM for metronome', '120')
  .option('--sample-rate <hz>', 'Sample rate', '44100')
  .action(async (type: string, options: {
    output?: string;
    duration: string;
    frequency: string;
    startFreq: string;
    endFreq: string;
    bpm: string;
    sampleRate: string;
  }) => {
    try {
      const testSignals = await import('./analysis/test-signals.js');

      const duration = parseFloat(options.duration);
      const sampleRate = parseInt(options.sampleRate);
      let samples: Float32Array;
      let defaultName: string;

      switch (type.toLowerCase()) {
        case 'sine':
          samples = testSignals.generateSine(parseFloat(options.frequency), duration, sampleRate);
          defaultName = `sine-${options.frequency}hz.wav`;
          break;

        case 'square':
          samples = testSignals.generateSquare(parseFloat(options.frequency), duration, sampleRate);
          defaultName = `square-${options.frequency}hz.wav`;
          break;

        case 'sawtooth':
        case 'saw':
          samples = testSignals.generateSawtooth(parseFloat(options.frequency), duration, sampleRate);
          defaultName = `saw-${options.frequency}hz.wav`;
          break;

        case 'triangle':
          samples = testSignals.generateTriangle(parseFloat(options.frequency), duration, sampleRate);
          defaultName = `triangle-${options.frequency}hz.wav`;
          break;

        case 'sweep':
          samples = testSignals.generateSweep(
            parseFloat(options.startFreq),
            parseFloat(options.endFreq),
            duration,
            sampleRate
          );
          defaultName = `sweep-${options.startFreq}-${options.endFreq}hz.wav`;
          break;

        case 'white':
        case 'whitenoise':
          samples = testSignals.generateWhiteNoise(duration, sampleRate);
          defaultName = 'white-noise.wav';
          break;

        case 'pink':
        case 'pinknoise':
          samples = testSignals.generatePinkNoise(duration, sampleRate);
          defaultName = 'pink-noise.wav';
          break;

        case 'brown':
        case 'brownnoise':
          samples = testSignals.generateBrownNoise(duration, sampleRate);
          defaultName = 'brown-noise.wav';
          break;

        case 'metronome':
        case 'click':
          samples = testSignals.generateMetronome(parseInt(options.bpm), duration, sampleRate);
          defaultName = `metronome-${options.bpm}bpm.wav`;
          break;

        case 'scale':
          samples = testSignals.generateScale(60, 0.5, sampleRate);
          defaultName = 'scale-c-major.wav';
          break;

        case 'a440':
        case 'tuning':
          samples = testSignals.generateA440(duration, sampleRate);
          defaultName = 'a440-tuning.wav';
          break;

        case 'testtones':
          samples = testSignals.generateTestTones(duration, sampleRate);
          defaultName = 'test-tones.wav';
          break;

        default:
          console.error(`Unknown signal type: ${type}`);
          console.log('Available types: sine, square, sawtooth, triangle, sweep,');
          console.log('                 white, pink, brown, metronome, scale, a440, testtones');
          process.exit(1);
          return;
      }

      const outputPath = options.output || defaultName;
      testSignals.writeWavFile(samples, resolve(outputPath), sampleRate);
      console.log(`✓ Generated ${outputPath} (${formatDuration(duration)})`);

      // Generate spectrogram for visual reference
      const spectrogramPath = outputPath.replace('.wav', '-spectrogram.png');
      const { generateSpectrogramFromFile } = await import('./analysis/spectrogram.js');
      const png = generateSpectrogramFromFile(resolve(outputPath), { width: 800, height: 300 });
      const { writeFile: writeFileAsync } = await import('fs/promises');
      await writeFileAsync(resolve(spectrogramPath), png);
      console.log(`✓ Spectrogram saved to ${spectrogramPath}`);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * MIDI to audio - render MIDI to WAV for comparison
 */
program
  .command('midi-render <file>')
  .description('Render a MIDI file to WAV using basic synthesis')
  .option('-o, --output <file>', 'Output WAV file path')
  .option('--sample-rate <hz>', 'Sample rate', '44100')
  .action(async (file: string, options: {
    output?: string;
    sampleRate: string;
  }) => {
    try {
      const { renderMidiToWav } = await import('./analysis/midi-renderer.js');

      const inputName = basename(file, extname(file));
      const outputPath = options.output || `${inputName}.wav`;
      const sampleRate = parseInt(options.sampleRate);

      console.log(`Rendering MIDI: ${file}`);
      await renderMidiToWav(resolve(file), resolve(outputPath), sampleRate);
      console.log(`✓ Rendered to ${outputPath}`);

      // Also generate spectrogram
      const spectrogramPath = outputPath.replace('.wav', '-spectrogram.png');
      const { generateSpectrogramFromFile } = await import('./analysis/spectrogram.js');
      const { writeFile: writeFileAsync } = await import('fs/promises');
      const png = generateSpectrogramFromFile(resolve(outputPath), { width: 800, height: 300 });
      await writeFileAsync(resolve(spectrogramPath), png);
      console.log(`✓ Spectrogram saved to ${spectrogramPath}`);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Run CLI
program.parse();
