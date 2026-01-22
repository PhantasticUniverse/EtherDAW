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
 * New command - create a new EtherScore template
 */
program
  .command('new')
  .description('Create a new EtherScore file from a template')
  .option('-t, --template <name>', 'Template name (minimal, ambient, jazz)', 'minimal')
  .option('-o, --output <file>', 'Output file path', 'song.etherscore.json')
  .action(async (options: { template: string; output: string }) => {
    try {
      const template = getTemplate(options.template);
      await writeFile(
        resolve(options.output),
        JSON.stringify(template, null, 2)
      );
      console.log(`✓ Created ${options.output}`);
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
        const { PRESETS } = await import('./synthesis/instruments.js');
        console.log('\nAvailable Instrument Presets:');
        console.log('=============================');
        const categories = new Map<string, string[]>();
        for (const [name, preset] of Object.entries(PRESETS)) {
          if (!categories.has(preset.category)) {
            categories.set(preset.category, []);
          }
          categories.get(preset.category)!.push(`${name}: ${preset.description}`);
        }
        for (const [category, presets] of categories) {
          console.log(`\n${category.toUpperCase()}:`);
          for (const preset of presets) {
            console.log(`  - ${preset}`);
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

function getTemplate(name: string): object {
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

// Run CLI
program.parse();
