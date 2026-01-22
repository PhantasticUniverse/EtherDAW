/**
 * REPL Command Implementations
 *
 * Defines all available commands in the EtherREPL.
 */

import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { REPLSession, TransformType, TransformRecord } from './state.js';

/**
 * Command result
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  shouldExit?: boolean;
}

/**
 * Command definition
 */
export interface CommandDef {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  execute: (session: REPLSession, args: string[]) => Promise<CommandResult>;
}

/**
 * Parse command line into command and arguments
 */
export function parseCommand(line: string): { command: string; args: string[] } {
  const parts = line.trim().split(/\s+/);
  const command = parts[0]?.toLowerCase() || '';
  const args = parts.slice(1);
  return { command, args };
}

/**
 * All available commands
 */
export const COMMANDS: CommandDef[] = [
  // Load command
  {
    name: 'load',
    aliases: ['l', 'open'],
    description: 'Load an EtherScore file',
    usage: 'load <file>',
    execute: async (session, args) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: load <file>' };
      }

      const filePath = args.join(' ');
      try {
        await session.load(filePath);
        const meta = session.getMetadata();
        return {
          success: true,
          message: `Loaded: ${meta.title || filePath}\n  Tempo: ${meta.tempo} BPM\n  Key: ${meta.key || 'Not specified'}`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to load: ${(error as Error).message}`,
        };
      }
    },
  },

  // Play command
  {
    name: 'play',
    aliases: ['p'],
    description: 'Play the composition or a specific pattern',
    usage: 'play [pattern]',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded. Use: load <file>' };
      }

      const player = session.getPlayer();

      if (player.getState() === 'playing') {
        return { success: false, message: 'Already playing. Use stop first.' };
      }

      try {
        if (args.length > 0) {
          const patternName = args[0];
          if (!session.getPatterns().includes(patternName)) {
            return {
              success: false,
              message: `Pattern not found: ${patternName}\nAvailable: ${session.getPatterns().join(', ')}`,
            };
          }
          await player.playPattern(patternName, { loop: true });
          return { success: true, message: `Playing pattern: ${patternName} (looping)` };
        } else {
          await player.play();
          return { success: true, message: 'Playing composition...' };
        }
      } catch (error) {
        return { success: false, message: `Playback failed: ${(error as Error).message}` };
      }
    },
  },

  // Stop command
  {
    name: 'stop',
    aliases: ['s'],
    description: 'Stop playback',
    usage: 'stop',
    execute: async (session) => {
      const player = session.getPlayer();
      player.stop();
      return { success: true, message: 'Stopped' };
    },
  },

  // Tempo command
  {
    name: 'tempo',
    aliases: ['bpm'],
    description: 'Set tempo in BPM',
    usage: 'tempo <bpm>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length === 0) {
        return { success: true, message: `Current tempo: ${session.getTempo()} BPM` };
      }

      const tempo = parseInt(args[0]);
      if (isNaN(tempo) || tempo < 20 || tempo > 300) {
        return { success: false, message: 'Tempo must be between 20 and 300 BPM' };
      }

      session.setTempo(tempo);
      return { success: true, message: `Tempo set to ${tempo} BPM` };
    },
  },

  // Transpose command
  {
    name: 'transpose',
    aliases: ['tr'],
    description: 'Transpose a pattern by semitones',
    usage: 'transpose <pattern> <semitones>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 2) {
        return { success: false, message: 'Usage: transpose <pattern> <semitones>' };
      }

      const patternName = args[0];
      const semitones = parseInt(args[1]);

      if (!session.getPatterns().includes(patternName)) {
        return {
          success: false,
          message: `Pattern not found: ${patternName}`,
        };
      }

      if (isNaN(semitones)) {
        return { success: false, message: 'Semitones must be a number' };
      }

      session.setPatternMod(patternName, { transpose: semitones });
      const direction = semitones > 0 ? 'up' : 'down';
      return {
        success: true,
        message: `Pattern "${patternName}" transposed ${Math.abs(semitones)} semitones ${direction}`,
      };
    },
  },

  // Stretch command
  {
    name: 'stretch',
    aliases: ['st'],
    description: 'Stretch pattern durations by factor',
    usage: 'stretch <pattern> <factor>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 2) {
        return { success: false, message: 'Usage: stretch <pattern> <factor>' };
      }

      const patternName = args[0];
      const factor = parseFloat(args[1]);

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      if (isNaN(factor) || factor <= 0) {
        return { success: false, message: 'Factor must be a positive number' };
      }

      session.setPatternMod(patternName, { stretch: factor });
      const description = factor > 1 ? 'stretched' : 'compressed';
      return {
        success: true,
        message: `Pattern "${patternName}" ${description} by ${factor}x`,
      };
    },
  },

  // Velocity command
  {
    name: 'velocity',
    aliases: ['vel', 'v'],
    description: 'Scale pattern velocity',
    usage: 'velocity <pattern> <scale>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 2) {
        return { success: false, message: 'Usage: velocity <pattern> <scale>' };
      }

      const patternName = args[0];
      const scale = parseFloat(args[1]);

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      if (isNaN(scale) || scale < 0 || scale > 2) {
        return { success: false, message: 'Scale must be between 0 and 2' };
      }

      session.setPatternMod(patternName, { velocity: scale });
      return {
        success: true,
        message: `Pattern "${patternName}" velocity scaled to ${(scale * 100).toFixed(0)}%`,
      };
    },
  },

  // Reverse command
  {
    name: 'reverse',
    aliases: ['rev'],
    description: 'Reverse note order in pattern',
    usage: 'reverse <pattern>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 1) {
        return { success: false, message: 'Usage: reverse <pattern>' };
      }

      const patternName = args[0];

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      session.setPatternMod(patternName, { reverse: true });
      return {
        success: true,
        message: `Pattern "${patternName}" reversed`,
      };
    },
  },

  // Invert command
  {
    name: 'invert',
    aliases: ['inv'],
    description: 'Invert melody around pivot pitch',
    usage: 'invert <pattern> [pivot]',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 1) {
        return { success: false, message: 'Usage: invert <pattern> [pivot]' };
      }

      const patternName = args[0];
      const pivot = args[1] || 'C4'; // Default pivot

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      session.setPatternMod(patternName, { invert: pivot });
      return {
        success: true,
        message: `Pattern "${patternName}" inverted around ${pivot}`,
      };
    },
  },

  // Shuffle command
  {
    name: 'shuffle',
    aliases: ['shuf'],
    description: 'Randomize note order in pattern',
    usage: 'shuffle <pattern>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 1) {
        return { success: false, message: 'Usage: shuffle <pattern>' };
      }

      const patternName = args[0];

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      session.setPatternMod(patternName, { shuffle: true });
      return {
        success: true,
        message: `Pattern "${patternName}" shuffled`,
      };
    },
  },

  // Rotate command
  {
    name: 'rotate',
    aliases: ['rot'],
    description: 'Rotate pattern by n positions',
    usage: 'rotate <pattern> <n>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 2) {
        return { success: false, message: 'Usage: rotate <pattern> <n>' };
      }

      const patternName = args[0];
      const n = parseInt(args[1]);

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      if (isNaN(n)) {
        return { success: false, message: 'n must be an integer' };
      }

      session.setPatternMod(patternName, { rotate: n });
      return {
        success: true,
        message: `Pattern "${patternName}" rotated by ${n} position${Math.abs(n) !== 1 ? 's' : ''}`,
      };
    },
  },

  // Slice command
  {
    name: 'slice',
    aliases: ['sl'],
    description: 'Extract a slice of notes from pattern',
    usage: 'slice <pattern> <start> <end>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 3) {
        return { success: false, message: 'Usage: slice <pattern> <start> <end>' };
      }

      const patternName = args[0];
      const start = parseInt(args[1]);
      const end = parseInt(args[2]);

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      if (isNaN(start) || isNaN(end)) {
        return { success: false, message: 'Start and end must be integers' };
      }

      session.setPatternMod(patternName, { slice: { start, end } });
      return {
        success: true,
        message: `Pattern "${patternName}" sliced [${start}:${end}]`,
      };
    },
  },

  // Every command (combinator)
  {
    name: 'every',
    aliases: [],
    description: 'Apply transform every N cycles',
    usage: 'every <n> <transform> <pattern> [params]',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 3) {
        return { success: false, message: 'Usage: every <n> <transform> <pattern> [params]' };
      }

      const n = parseInt(args[0]);
      const transformType = args[1].toLowerCase();
      const patternName = args[2];
      const extraParams = args.slice(3);

      if (isNaN(n) || n < 1) {
        return { success: false, message: 'n must be a positive integer' };
      }

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      // Parse transform and params
      const { transform, params, error } = parseTransformWithParams(transformType, extraParams);
      if (error) {
        return { success: false, message: error };
      }

      session.addCombinator(patternName, {
        type: 'every',
        n,
        transform,
        params,
      });

      return {
        success: true,
        message: `Every ${n} cycles: ${transformType} "${patternName}"`,
      };
    },
  },

  // Sometimes command (combinator)
  {
    name: 'sometimes',
    aliases: ['prob'],
    description: 'Apply transform with probability',
    usage: 'sometimes <transform> <pattern> [probability] [params]',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 2) {
        return { success: false, message: 'Usage: sometimes <transform> <pattern> [probability]' };
      }

      const transformType = args[0].toLowerCase();
      const patternName = args[1];
      let probability = 0.5;
      let extraParams = args.slice(2);

      // Check if third arg is a probability (0-1 or percentage)
      if (args[2]) {
        const probArg = parseFloat(args[2]);
        if (!isNaN(probArg)) {
          probability = probArg > 1 ? probArg / 100 : probArg;
          extraParams = args.slice(3);
        }
      }

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      const { transform, params, error } = parseTransformWithParams(transformType, extraParams);
      if (error) {
        return { success: false, message: error };
      }

      session.addCombinator(patternName, {
        type: 'sometimes',
        probability,
        transform,
        params,
      });

      return {
        success: true,
        message: `Sometimes (${(probability * 100).toFixed(0)}%): ${transformType} "${patternName}"`,
      };
    },
  },

  // Parallel command (info about parallel playback)
  {
    name: 'parallel',
    aliases: ['par'],
    description: 'Play multiple patterns together (creates temporary section)',
    usage: 'parallel <pattern1> <pattern2> [...]',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 2) {
        return { success: false, message: 'Usage: parallel <pattern1> <pattern2> [...]' };
      }

      // Verify all patterns exist
      const patterns = session.getPatterns();
      for (const p of args) {
        if (!patterns.includes(p) && !session.isVariable(p)) {
          return { success: false, message: `Pattern not found: ${p}` };
        }
      }

      // For now, explain the limitation
      // In a future version, we could dynamically create a section
      return {
        success: true,
        message: `Parallel playback: ${args.join(', ')}\n` +
          `Note: For true parallel playback, create a section that includes both patterns.\n` +
          `Example in EtherScore:\n` +
          `  "combined": { "bars": 4, "tracks": {\n` +
          `    "${args[0]}": { "pattern": "${args[0]}" },\n` +
          `    "${args[1]}": { "pattern": "${args[1]}" }\n` +
          `  }}`,
      };
    },
  },

  // Reset command (clear pattern modifications)
  {
    name: 'reset',
    aliases: ['clear'],
    description: 'Clear all modifications from a pattern',
    usage: 'reset <pattern>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 1) {
        return { success: false, message: 'Usage: reset <pattern>' };
      }

      const patternName = args[0];

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      session.clearPatternMod(patternName);
      return {
        success: true,
        message: `Pattern "${patternName}" reset to original`,
      };
    },
  },

  // List command
  {
    name: 'list',
    aliases: ['ls'],
    description: 'List patterns, instruments, or sections',
    usage: 'list [patterns|instruments|sections]',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      const type = args[0]?.toLowerCase() || 'patterns';

      switch (type) {
        case 'patterns':
        case 'p': {
          const patterns = session.getPatterns();
          if (patterns.length === 0) {
            return { success: true, message: 'No patterns defined' };
          }
          let output = 'Patterns:\n';
          for (const p of patterns) {
            const mod = session.getPatternMod(p);
            const mods: string[] = [];
            if (mod?.transpose) mods.push(`tr:${mod.transpose > 0 ? '+' : ''}${mod.transpose}`);
            if (mod?.stretch) mods.push(`st:${mod.stretch}x`);
            if (mod?.velocity) mods.push(`vel:${(mod.velocity * 100).toFixed(0)}%`);
            if (mod?.reverse) mods.push('rev');
            if (mod?.invert) mods.push(`inv:${mod.invert}`);
            if (mod?.shuffle) mods.push('shuf');
            if (mod?.rotate) mods.push(`rot:${mod.rotate}`);
            if (mod?.slice) mods.push(`sl:${mod.slice.start}-${mod.slice.end}`);
            const suffix = mods.length > 0 ? ` [${mods.join(', ')}]` : '';
            output += `  - ${p}${suffix}\n`;
          }
          return { success: true, message: output.trimEnd() };
        }

        case 'instruments':
        case 'i': {
          const instruments = session.getInstruments();
          if (instruments.length === 0) {
            return { success: true, message: 'No instruments defined' };
          }
          return {
            success: true,
            message: `Instruments:\n  - ${instruments.join('\n  - ')}`,
          };
        }

        case 'sections':
        case 's': {
          const sections = session.getSections();
          if (sections.length === 0) {
            return { success: true, message: 'No sections defined' };
          }
          return {
            success: true,
            message: `Sections:\n  - ${sections.join('\n  - ')}`,
          };
        }

        default:
          return {
            success: false,
            message: 'Usage: list [patterns|instruments|sections]',
          };
      }
    },
  },

  // Info command
  {
    name: 'info',
    aliases: ['i'],
    description: 'Show composition info',
    usage: 'info',
    execute: async (session) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      const meta = session.getMetadata();
      const player = session.getPlayer();
      const duration = player.getDuration();
      const modified = session.isModified() ? ' (modified)' : '';

      let output = `${meta.title || 'Untitled'}${modified}\n`;
      if (meta.composer) output += `  Composer: ${meta.composer}\n`;
      output += `  Tempo: ${meta.tempo} BPM\n`;
      output += `  Key: ${meta.key || 'Not specified'}\n`;
      output += `  Duration: ${formatDuration(duration)}\n`;
      output += `  Patterns: ${session.getPatterns().length}\n`;
      output += `  Sections: ${session.getSections().length}\n`;
      output += `  Instruments: ${session.getInstruments().length}`;

      return { success: true, message: output };
    },
  },

  // Save command
  {
    name: 'save',
    aliases: ['w'],
    description: 'Save the composition',
    usage: 'save [file]',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      const score = session.getModifiedScore();
      if (!score) {
        return { success: false, message: 'Failed to get modified score' };
      }

      let outputPath: string;
      if (args.length > 0) {
        outputPath = args.join(' ');
      } else {
        outputPath = session.getFilePath() || 'composition.etherscore.json';
      }

      try {
        await writeFile(resolve(outputPath), JSON.stringify(score, null, 2));
        session.setModified(false);
        return { success: true, message: `Saved to ${outputPath}` };
      } catch (error) {
        return { success: false, message: `Failed to save: ${(error as Error).message}` };
      }
    },
  },

  // Export command
  {
    name: 'export',
    aliases: ['e'],
    description: 'Export to WAV file',
    usage: 'export <file.wav>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length === 0) {
        return { success: false, message: 'Usage: export <file.wav>' };
      }

      const outputPath = args.join(' ');
      const player = session.getPlayer();

      try {
        await player.exportWav(outputPath);
        return { success: true, message: `Exported to ${outputPath}` };
      } catch (error) {
        return { success: false, message: `Export failed: ${(error as Error).message}` };
      }
    },
  },

  // Set command (pattern variables)
  {
    name: 'set',
    aliases: ['let', 'var'],
    description: 'Create a pattern variable with transforms',
    usage: 'set <name> = <pattern> | <transform> | ...',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      // Join args and parse "name = expr"
      const fullExpr = args.join(' ');
      const equalsIndex = fullExpr.indexOf('=');

      if (equalsIndex === -1) {
        return { success: false, message: 'Usage: set <name> = <pattern> | <transform> | ...' };
      }

      const varName = fullExpr.slice(0, equalsIndex).trim();
      const expr = fullExpr.slice(equalsIndex + 1).trim();

      if (!varName || !expr) {
        return { success: false, message: 'Usage: set <name> = <pattern> | <transform> | ...' };
      }

      // Check for reserved names
      if (session.getPatterns().includes(varName)) {
        return { success: false, message: `"${varName}" conflicts with an existing pattern name` };
      }

      // Parse the pipe expression
      const { source, transforms, error } = parsePipeExpression(expr);
      if (error) {
        return { success: false, message: error };
      }

      // Verify source pattern exists
      if (!session.getPatterns().includes(source) && !session.isVariable(source)) {
        return {
          success: false,
          message: `Source pattern not found: ${source}`,
        };
      }

      // Convert to TransformRecord format
      const transformRecords: TransformRecord[] = transforms.map((t, i) => ({
        type: t.type,
        params: t.params,
        appliedAt: Date.now() + i, // Ensure ordering
      }));

      session.setVariable(varName, source, transformRecords);

      const transformDesc = transforms.length > 0
        ? transforms.map(t => t.type).join(' | ')
        : 'no transforms';

      return {
        success: true,
        message: `Created variable: ${varName} = ${source} | ${transformDesc}`,
      };
    },
  },

  // Variables command (list pattern variables)
  {
    name: 'vars',
    aliases: ['variables'],
    description: 'List all pattern variables',
    usage: 'vars',
    execute: async (session) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      const vars = session.getVariables();

      if (vars.length === 0) {
        return { success: true, message: 'No pattern variables defined' };
      }

      let output = 'Pattern variables:\n';
      for (const name of vars) {
        const variable = session.getVariable(name);
        if (variable) {
          const transformsDesc = variable.transforms.length > 0
            ? variable.transforms.map(t => t.type).join(' | ')
            : 'no transforms';
          output += `  ${name} = ${variable.sourcePattern} | ${transformsDesc}\n`;
        }
      }

      return { success: true, message: output.trimEnd() };
    },
  },

  // Preview command - visual pattern preview
  {
    name: 'preview',
    aliases: ['pre', 'viz'],
    description: 'Visual preview of pattern with pitch contour',
    usage: 'preview <pattern>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 1) {
        return { success: false, message: 'Usage: preview <pattern>' };
      }

      const patternName = args[0];

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      const modifiedScore = session.getModifiedScore();
      if (!modifiedScore) {
        return { success: false, message: 'Failed to get modified score' };
      }

      const pattern = modifiedScore.patterns[patternName];
      if (!pattern) {
        return { success: false, message: 'Pattern not in modified score' };
      }

      const tempo = session.getTempo();

      if (pattern.notes) {
        return { success: true, message: visualizeNotePattern(patternName, pattern.notes, tempo) };
      } else if (pattern.chords) {
        return { success: true, message: visualizeChordPattern(patternName, pattern.chords, tempo) };
      } else if (pattern.drums) {
        return { success: true, message: `${patternName}: (drum pattern - use 'show' for hits)` };
      } else {
        return { success: true, message: `${patternName}: (generative pattern)` };
      }
    },
  },

  // Describe command - verbal description of a pattern
  {
    name: 'describe',
    aliases: ['feel', 'vibe'],
    description: 'Get a verbal description of how a pattern feels',
    usage: 'describe <pattern>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 1) {
        return { success: false, message: 'Usage: describe <pattern>' };
      }

      const patternName = args[0];

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      const modifiedScore = session.getModifiedScore();
      if (!modifiedScore) {
        return { success: false, message: 'Failed to get modified score' };
      }

      const pattern = modifiedScore.patterns[patternName];
      if (!pattern) {
        return { success: false, message: 'Pattern not in modified score' };
      }

      if (pattern.notes) {
        return { success: true, message: describeNotePattern(patternName, pattern.notes) };
      } else if (pattern.chords) {
        return { success: true, message: describeChordPattern(patternName, pattern.chords) };
      } else {
        return { success: true, message: `${patternName}: (cannot describe this pattern type)` };
      }
    },
  },

  // Suggest command - generate variations
  {
    name: 'suggest',
    aliases: ['var', 'variation'],
    description: 'Suggest transform variations of a pattern',
    usage: 'suggest <pattern>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 1) {
        return { success: false, message: 'Usage: suggest <pattern>' };
      }

      const patternName = args[0];

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      // Generate suggestions
      const suggestions = [
        `${patternName} | transpose 5        (up a fourth - brighter)`,
        `${patternName} | transpose -3       (down a minor third - darker)`,
        `${patternName} | reverse            (retrograde - mirror image)`,
        `${patternName} | invert C4          (inverted - flipped contour)`,
        `${patternName} | rotate 2           (start from note 3)`,
        `${patternName} | transpose 7 | reverse  (up a fifth, reversed)`,
      ];

      let output = `Variations of "${patternName}":\n\n`;
      suggestions.forEach((s, i) => {
        output += `  ${i + 1}. set v${i + 1} = ${s}\n`;
      });
      output += `\nTry: set myvar = ${patternName} | <transform>`;

      return { success: true, message: output };
    },
  },

  // Show command (debug)
  {
    name: 'show',
    aliases: ['cat'],
    description: 'Show pattern with transforms applied',
    usage: 'show <pattern>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 1) {
        return { success: false, message: 'Usage: show <pattern>' };
      }

      const patternName = args[0];

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      // Get the modified score to see the transformed pattern
      const modifiedScore = session.getModifiedScore();
      if (!modifiedScore) {
        return { success: false, message: 'Failed to get modified score' };
      }

      const pattern = modifiedScore.patterns[patternName];
      if (!pattern) {
        return { success: false, message: 'Pattern not in modified score' };
      }

      let output = `${patternName}:\n`;
      if (pattern.notes) {
        const notes = pattern.notes;
        output += `  notes: [${notes.slice(0, 10).join(', ')}${notes.length > 10 ? '...' : ''}]\n`;
        output += `  (${notes.length} notes total)`;
      } else if (pattern.chords) {
        const chords = Array.isArray(pattern.chords) ? pattern.chords : [pattern.chords];
        output += `  chords: [${chords.join(', ')}]`;
      } else if (pattern.drums) {
        output += `  drums: [hit-based pattern]`;
      } else if (pattern.euclidean) {
        output += `  euclidean: ${pattern.euclidean.hits}/${pattern.euclidean.steps}`;
      } else if (pattern.markov) {
        output += `  markov: ${pattern.markov.preset || 'custom'}`;
      }

      return { success: true, message: output };
    },
  },

  // Explain command (debug)
  {
    name: 'explain',
    aliases: ['exp'],
    description: 'List all transforms applied to a pattern',
    usage: 'explain <pattern>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 1) {
        return { success: false, message: 'Usage: explain <pattern>' };
      }

      const patternName = args[0];

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      const history = session.getTransformHistory(patternName);

      if (history.length === 0) {
        return { success: true, message: `${patternName}: no transforms applied` };
      }

      let output = `${patternName}:\n`;
      history.forEach((transform, index) => {
        const desc = describeTransform(transform);
        output += `  ${index + 1}. ${desc}\n`;
      });

      return { success: true, message: output.trimEnd() };
    },
  },

  // Diff command (debug)
  {
    name: 'diff',
    aliases: [],
    description: 'Compare original vs transformed pattern',
    usage: 'diff <pattern>',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      if (args.length < 1) {
        return { success: false, message: 'Usage: diff <pattern>' };
      }

      const patternName = args[0];

      if (!session.getPatterns().includes(patternName)) {
        return { success: false, message: `Pattern not found: ${patternName}` };
      }

      const state = session.getState();
      const originalPattern = state.score?.patterns[patternName];
      const modifiedScore = session.getModifiedScore();
      const modifiedPattern = modifiedScore?.patterns[patternName];

      if (!originalPattern || !modifiedPattern) {
        return { success: false, message: 'Could not compare patterns' };
      }

      const mod = session.getPatternMod(patternName);
      if (!mod || Object.keys(mod).length <= 1) { // Only transformHistory
        return { success: true, message: `${patternName}: no changes (original = current)` };
      }

      let output = `${patternName}:\n`;

      const getNotesPreview = (pattern: { notes?: string | string[] }) => {
        if (!pattern.notes) return '(no notes)';
        const notes = Array.isArray(pattern.notes) ? pattern.notes : pattern.notes.split(/\s+/);
        return `[${notes.slice(0, 6).join(', ')}${notes.length > 6 ? '...' : ''}]`;
      };

      output += `  Original: ${getNotesPreview(originalPattern)}\n`;
      output += `  Current:  ${getNotesPreview(modifiedPattern)}`;

      return { success: true, message: output };
    },
  },

  // Spectrum command - frequency band visualization
  {
    name: 'spectrum',
    aliases: ['freq', 'bands'],
    description: 'Show frequency band distribution of a section',
    usage: 'spectrum [section]',
    execute: async (session, args) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      const modifiedScore = session.getModifiedScore();
      if (!modifiedScore) {
        return { success: false, message: 'Failed to get modified score' };
      }

      // Get section or use all
      let targetSection: string | undefined;
      if (args.length > 0) {
        targetSection = args[0];
        if (!session.getSections().includes(targetSection)) {
          return { success: false, message: `Section not found: ${targetSection}\nAvailable: ${session.getSections().join(', ')}` };
        }
      }

      // Collect all MIDI notes from section(s)
      const midiNotes: { midi: number; duration: number; instrument: string }[] = [];

      const noteMap: Record<string, number> = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
      const durationBeats: Record<string, number> = { 'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25, '32': 0.125 };

      const parseNoteToMidi = (note: string): { midi: number; duration: number } | null => {
        const match = note.match(/^([A-G])([#b]?)(\d):(\d+|[whq])(\.?)/);
        if (!match) return null;
        const [, pitchName, acc, oct, dur, dot] = match;
        const octave = parseInt(oct);
        let midi = (octave + 1) * 12 + (noteMap[pitchName] || 0);
        if (acc === '#') midi += 1;
        if (acc === 'b') midi -= 1;
        let duration = durationBeats[dur] || 1;
        if (dot) duration *= 1.5;
        return { midi, duration };
      };

      const sectionsToAnalyze = targetSection
        ? [targetSection]
        : modifiedScore.arrangement || Object.keys(modifiedScore.sections || {});

      for (const sectionName of sectionsToAnalyze) {
        const section = modifiedScore.sections?.[sectionName];
        if (!section?.tracks) continue;

        for (const [instrument, track] of Object.entries(section.tracks)) {
          const patternName = track.pattern || (track.patterns ? track.patterns[0] : undefined);
          if (!patternName) continue;

          const pattern = modifiedScore.patterns?.[patternName];
          if (!pattern) continue;

          // Parse notes
          if (pattern.notes) {
            const notes = Array.isArray(pattern.notes) ? pattern.notes : (pattern.notes as string).split(/\s+/);
            for (const note of notes) {
              if (note.startsWith('r')) continue; // Skip rests
              const parsed = parseNoteToMidi(note);
              if (parsed) {
                midiNotes.push({ ...parsed, instrument });
              }
            }
          }

          // Parse chords
          if (pattern.chords) {
            const chords = Array.isArray(pattern.chords) ? pattern.chords : [pattern.chords];
            for (const chord of chords) {
              // Extract root note from chord
              const match = chord.match(/^([A-G])([#b]?)(\d?)/);
              if (match) {
                const [, pitchName, acc] = match;
                // Chords usually in octave 3-4 range
                let midi = 48 + (noteMap[pitchName] || 0);
                if (acc === '#') midi += 1;
                if (acc === 'b') midi -= 1;
                midiNotes.push({ midi, duration: 1, instrument });
              }
            }
          }
        }
      }

      if (midiNotes.length === 0) {
        return { success: true, message: 'No pitched content found to analyze' };
      }

      // Define frequency bands (MIDI note ranges)
      const bands = [
        { name: 'Sub',   min: 0,  max: 36, hz: '20-80Hz',     symbol: '░' },    // Below C2
        { name: 'Bass',  min: 36, max: 48, hz: '80-250Hz',    symbol: '▒' },    // C2-B2
        { name: 'Low',   min: 48, max: 60, hz: '250-500Hz',   symbol: '▓' },    // C3-B3
        { name: 'Mid',   min: 60, max: 72, hz: '500-2kHz',    symbol: '█' },    // C4-B4
        { name: 'High',  min: 72, max: 84, hz: '2k-6kHz',     symbol: '▄' },    // C5-B5
        { name: 'Air',   min: 84, max: 127, hz: '6k-20kHz',   symbol: '▀' },    // Above C5
      ];

      // Count weighted notes in each band
      const bandCounts: number[] = bands.map(() => 0);
      let maxCount = 0;

      for (const note of midiNotes) {
        for (let i = 0; i < bands.length; i++) {
          if (note.midi >= bands[i].min && note.midi < bands[i].max) {
            bandCounts[i] += note.duration;
            maxCount = Math.max(maxCount, bandCounts[i]);
            break;
          }
        }
      }

      // Build visualization
      const barWidth = 30;
      let output = targetSection
        ? `Spectrum: ${targetSection}\n`
        : `Spectrum: Full composition\n`;
      output += '─'.repeat(50) + '\n';

      for (let i = bands.length - 1; i >= 0; i--) { // High to low
        const band = bands[i];
        const count = bandCounts[i];
        const normalized = maxCount > 0 ? count / maxCount : 0;
        const barLen = Math.round(normalized * barWidth);
        const bar = band.symbol.repeat(barLen) + ' '.repeat(barWidth - barLen);
        const pct = (normalized * 100).toFixed(0).padStart(3);
        output += `${band.name.padEnd(5)} ${band.hz.padEnd(10)} │${bar}│ ${pct}%\n`;
      }

      output += '─'.repeat(50) + '\n';
      output += `Notes analyzed: ${midiNotes.length}`;

      // Add balance assessment
      const bassEnergy = bandCounts[0] + bandCounts[1] + bandCounts[2];
      const highEnergy = bandCounts[3] + bandCounts[4] + bandCounts[5];
      const total = bassEnergy + highEnergy;

      if (total > 0) {
        const bassRatio = bassEnergy / total;
        output += '\n\n';
        if (bassRatio > 0.7) {
          output += 'Balance: Bass-heavy (warm, grounded)';
        } else if (bassRatio < 0.3) {
          output += 'Balance: Treble-heavy (bright, airy)';
        } else {
          output += 'Balance: Balanced (full spectrum)';
        }
      }

      return { success: true, message: output };
    },
  },

  // Timeline command - time-domain visualization
  {
    name: 'timeline',
    aliases: ['tl', 'time'],
    description: 'Show composition timeline with section flow',
    usage: 'timeline',
    execute: async (session) => {
      if (!session.isLoaded()) {
        return { success: false, message: 'No composition loaded' };
      }

      const modifiedScore = session.getModifiedScore();
      if (!modifiedScore) {
        return { success: false, message: 'Failed to get modified score' };
      }

      const tempo = modifiedScore.settings?.tempo || 120;
      const arrangement = modifiedScore.arrangement || Object.keys(modifiedScore.sections || {});
      const sections = modifiedScore.sections || {};

      if (arrangement.length === 0) {
        return { success: true, message: 'No arrangement defined' };
      }

      // Calculate timing and gather data
      interface SectionInfo {
        name: string;
        bars: number;
        startTime: number;
        endTime: number;
        instruments: string[];
        energy: number; // 0-1 based on track count and velocity
      }

      const sectionData: SectionInfo[] = [];
      let currentTime = 0;
      const beatsPerBar = 4; // Assume 4/4
      const secondsPerBeat = 60 / tempo;

      for (const sectionName of arrangement) {
        const section = sections[sectionName];
        if (!section) continue;

        const bars = section.bars || 4;
        const duration = bars * beatsPerBar * secondsPerBeat;
        const instruments = section.tracks ? Object.keys(section.tracks) : [];

        // Calculate energy based on track count and average velocity
        let totalVel = 0;
        let velCount = 0;
        if (section.tracks) {
          for (const track of Object.values(section.tracks)) {
            totalVel += (track as { velocity?: number }).velocity || 0.5;
            velCount++;
          }
        }
        const avgVel = velCount > 0 ? totalVel / velCount : 0;
        const energy = Math.min(1, (instruments.length / 5) * avgVel);

        sectionData.push({
          name: sectionName,
          bars,
          startTime: currentTime,
          endTime: currentTime + duration,
          instruments,
          energy,
        });

        currentTime += duration;
      }

      const totalDuration = currentTime;
      const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      // Build timeline visualization
      const timelineWidth = 50;
      let output = `Timeline: ${formatTime(totalDuration)} total\n`;
      output += '═'.repeat(70) + '\n';

      // Energy waveform over time
      output += 'Energy:\n';
      output += '┌' + '─'.repeat(timelineWidth) + '┐\n';

      // Build energy row (3 rows for amplitude)
      const energyRows: string[][] = [[], [], []];
      for (let x = 0; x < timelineWidth; x++) {
        const time = (x / timelineWidth) * totalDuration;
        // Find section at this time
        const section = sectionData.find(s => time >= s.startTime && time < s.endTime);
        const energy = section?.energy || 0;

        if (energy > 0.66) {
          energyRows[0].push('█');
          energyRows[1].push('█');
          energyRows[2].push('█');
        } else if (energy > 0.33) {
          energyRows[0].push(' ');
          energyRows[1].push('▄');
          energyRows[2].push('█');
        } else if (energy > 0) {
          energyRows[0].push(' ');
          energyRows[1].push(' ');
          energyRows[2].push('▄');
        } else {
          energyRows[0].push(' ');
          energyRows[1].push(' ');
          energyRows[2].push(' ');
        }
      }

      output += '│' + energyRows[0].join('') + '│\n';
      output += '│' + energyRows[1].join('') + '│\n';
      output += '│' + energyRows[2].join('') + '│\n';
      output += '└' + '─'.repeat(timelineWidth) + '┘\n';
      output += ` 0:00${''.padEnd(timelineWidth - 10)}${formatTime(totalDuration)}\n\n`;

      // Section breakdown
      output += 'Sections:\n';
      for (const section of sectionData) {
        const barWidth = Math.max(1, Math.round((section.endTime - section.startTime) / totalDuration * 30));
        const bar = '█'.repeat(barWidth);
        const instList = section.instruments.length > 0
          ? section.instruments.slice(0, 3).join(', ') + (section.instruments.length > 3 ? '...' : '')
          : '(silence)';

        output += `  ${formatTime(section.startTime)} │${bar.padEnd(30)}│ ${section.name}\n`;
        output += `         │${''.padEnd(30)}│   ${section.bars} bars, ${instList}\n`;
      }
      output += `  ${formatTime(totalDuration)} │${'─'.repeat(30)}│ end\n`;

      // Arc description
      output += '\nArc: ';
      const energies = sectionData.map(s => s.energy);
      const maxEnergyIdx = energies.indexOf(Math.max(...energies));
      const maxEnergySection = sectionData[maxEnergyIdx];

      if (maxEnergyIdx < sectionData.length / 3) {
        output += 'Front-loaded (early peak)';
      } else if (maxEnergyIdx > (sectionData.length * 2) / 3) {
        output += 'Build-up (late climax)';
      } else {
        output += 'Classic arc (middle peak)';
      }
      output += ` - peaks at "${maxEnergySection?.name || 'unknown'}"`;

      return { success: true, message: output };
    },
  },

  // Help command
  {
    name: 'help',
    aliases: ['h', '?'],
    description: 'Show help',
    usage: 'help [command]',
    execute: async (_, args) => {
      if (args.length > 0) {
        const cmdName = args[0].toLowerCase();
        const cmd = COMMANDS.find(c =>
          c.name === cmdName || c.aliases.includes(cmdName)
        );
        if (cmd) {
          let output = `${cmd.name}: ${cmd.description}\n`;
          output += `  Usage: ${cmd.usage}\n`;
          if (cmd.aliases.length > 0) {
            output += `  Aliases: ${cmd.aliases.join(', ')}`;
          }
          return { success: true, message: output };
        }
        return { success: false, message: `Unknown command: ${cmdName}` };
      }

      let output = 'EtherREPL Commands:\n\n';
      for (const cmd of COMMANDS) {
        output += `  ${cmd.name.padEnd(12)} ${cmd.description}\n`;
      }
      output += '\nUse "help <command>" for more details';
      return { success: true, message: output };
    },
  },

  // Quit command
  {
    name: 'quit',
    aliases: ['q', 'exit'],
    description: 'Exit the REPL',
    usage: 'quit',
    execute: async (session) => {
      if (session.isModified()) {
        return {
          success: false,
          message: 'Unsaved changes. Use "save" first or "quit!" to discard',
        };
      }
      return { success: true, shouldExit: true };
    },
  },

  // Quit force command
  {
    name: 'quit!',
    aliases: ['q!'],
    description: 'Exit without saving',
    usage: 'quit!',
    execute: async () => {
      return { success: true, shouldExit: true };
    },
  },
];

/**
 * Find command by name or alias
 */
export function findCommand(name: string): CommandDef | undefined {
  const lower = name.toLowerCase();
  return COMMANDS.find(cmd =>
    cmd.name === lower || cmd.aliases.includes(lower)
  );
}

/**
 * Execute a command
 */
export async function executeCommand(
  session: REPLSession,
  line: string
): Promise<CommandResult> {
  const { command, args } = parseCommand(line);

  if (!command) {
    return { success: true }; // Empty line
  }

  const cmd = findCommand(command);
  if (!cmd) {
    return {
      success: false,
      message: `Unknown command: ${command}. Type "help" for available commands.`,
    };
  }

  session.addHistory(line);
  return cmd.execute(session, args);
}

/**
 * Format duration as MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Valid transform types for combinators
 */
const VALID_TRANSFORMS: TransformType[] = [
  'transpose', 'stretch', 'velocity', 'reverse', 'invert', 'shuffle', 'rotate', 'slice'
];

/**
 * Parse a transform type and parameters for combinators
 */
function parseTransformWithParams(
  transformType: string,
  extraParams: string[]
): { transform: TransformType; params: Record<string, unknown>; error?: string } {
  const transform = transformType as TransformType;

  if (!VALID_TRANSFORMS.includes(transform)) {
    return {
      transform: 'reverse',
      params: {},
      error: `Unknown transform: ${transformType}. Valid: ${VALID_TRANSFORMS.join(', ')}`,
    };
  }

  const params: Record<string, unknown> = {};

  // Parse params based on transform type
  switch (transform) {
    case 'transpose':
      params.semitones = extraParams[0] ? parseInt(extraParams[0]) : 0;
      break;
    case 'stretch':
      params.factor = extraParams[0] ? parseFloat(extraParams[0]) : 2;
      break;
    case 'velocity':
      params.scale = extraParams[0] ? parseFloat(extraParams[0]) : 0.8;
      break;
    case 'invert':
      params.pivot = extraParams[0] || 'C4';
      break;
    case 'rotate':
      params.n = extraParams[0] ? parseInt(extraParams[0]) : 1;
      break;
    case 'slice':
      params.start = extraParams[0] ? parseInt(extraParams[0]) : 0;
      params.end = extraParams[1] ? parseInt(extraParams[1]) : undefined;
      break;
    // reverse, shuffle don't need params
  }

  return { transform, params };
}

/**
 * Parse a pipe expression like "pattern | transform1 | transform2 args"
 */
function parsePipeExpression(expr: string): {
  source: string;
  transforms: { type: TransformType; params: Record<string, unknown> }[];
  error?: string;
} {
  const parts = expr.split('|').map(p => p.trim());
  const source = parts[0];
  const transforms: { type: TransformType; params: Record<string, unknown> }[] = [];

  for (let i = 1; i < parts.length; i++) {
    const transformParts = parts[i].split(/\s+/);
    const transformType = transformParts[0];
    const extraParams = transformParts.slice(1);

    const { transform, params, error } = parseTransformWithParams(transformType, extraParams);
    if (error) {
      return { source, transforms, error };
    }
    transforms.push({ type: transform, params });
  }

  return { source, transforms };
}

/**
 * Describe a transform for the explain command
 */
function describeTransform(transform: { type: string; params: Record<string, unknown> }): string {
  // Check if this is a combinator
  const combinator = transform.params.combinator as string | undefined;
  let prefix = '';

  if (combinator === 'every') {
    const n = transform.params.n as number;
    prefix = `every ${n} cycles: `;
  } else if (combinator === 'sometimes') {
    const prob = transform.params.probability as number;
    prefix = `sometimes (${((prob ?? 0.5) * 100).toFixed(0)}%): `;
  }

  let desc: string;
  switch (transform.type) {
    case 'transpose': {
      const semi = (transform.params.transpose ?? transform.params.semitones) as number;
      desc = `transpose ${semi > 0 ? '+' : ''}${semi} semitones`;
      break;
    }
    case 'stretch': {
      const factor = (transform.params.stretch ?? transform.params.factor) as number;
      desc = `stretch ${factor}x (${factor > 1 ? 'slower' : 'faster'})`;
      break;
    }
    case 'velocity': {
      const scale = (transform.params.velocity ?? transform.params.scale) as number;
      desc = `velocity ${(scale * 100).toFixed(0)}%`;
      break;
    }
    case 'reverse':
      desc = 'reverse (notes in reverse order)';
      break;
    case 'invert': {
      const pivot = (transform.params.invert ?? transform.params.pivot) as string;
      desc = `invert around ${pivot}`;
      break;
    }
    case 'shuffle':
      desc = 'shuffle (randomized note order)';
      break;
    case 'rotate': {
      const n = (transform.params.rotate ?? transform.params.n) as number;
      desc = `rotate by ${n} position${Math.abs(n) !== 1 ? 's' : ''}`;
      break;
    }
    case 'slice': {
      const slice = transform.params.slice as { start: number; end: number } | undefined;
      if (slice) {
        desc = `slice [${slice.start}:${slice.end}]`;
      } else {
        desc = `slice [${transform.params.start}:${transform.params.end}]`;
      }
      break;
    }
    default:
      desc = `${transform.type}`;
  }

  return prefix + desc;
}

/**
 * Visualize a note pattern with ASCII pitch contour
 */
function visualizeNotePattern(name: string, notes: string[], tempo: number): string {
  // Duration map
  const durationBeats: Record<string, number> = {
    'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25, '32': 0.125
  };

  // Parse notes to get pitches and durations
  const parsed: { pitch: string; midi: number; beats: number; isRest: boolean }[] = [];
  let minMidi = 127, maxMidi = 0;

  for (const note of notes) {
    const match = note.match(/^([A-Gr])([#b]?)(\d)?:(\d+|[whq])(\.?)/);
    if (!match) continue;

    const [, pitchName, acc, oct, dur, dot] = match;
    const isRest = pitchName.toLowerCase() === 'r';
    let beats = durationBeats[dur] || 1;
    if (dot) beats *= 1.5;

    if (isRest) {
      parsed.push({ pitch: 'r', midi: 0, beats, isRest: true });
    } else {
      const octave = parseInt(oct || '4');
      const noteMap: Record<string, number> = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
      let midi = (octave + 1) * 12 + (noteMap[pitchName.toUpperCase()] || 0);
      if (acc === '#') midi += 1;
      if (acc === 'b') midi -= 1;

      minMidi = Math.min(minMidi, midi);
      maxMidi = Math.max(maxMidi, midi);

      const fullPitch = `${pitchName}${acc}${octave}`;
      parsed.push({ pitch: fullPitch, midi, beats, isRest: false });
    }
  }

  if (parsed.length === 0) return `${name}: (empty pattern)`;

  // Build visualization
  const height = 8; // rows for pitch
  const midiRange = maxMidi - minMidi || 1;
  const totalBeats = parsed.reduce((sum, n) => sum + n.beats, 0);
  const width = Math.min(60, Math.max(20, Math.floor(totalBeats * 4)));

  // Characters for visualization
  const filled = '█';
  const half = '▄';
  const empty = ' ';
  const rest = '·';

  // Build the grid
  const grid: string[][] = Array(height).fill(null).map(() => Array(width).fill(empty));

  let xPos = 0;
  for (const note of parsed) {
    const noteWidth = Math.max(1, Math.floor((note.beats / totalBeats) * width));

    if (note.isRest) {
      // Show rest as dots at the middle
      const midRow = Math.floor(height / 2);
      for (let x = 0; x < noteWidth && xPos + x < width; x++) {
        grid[midRow][xPos + x] = rest;
      }
    } else {
      // Map MIDI to row (inverted: higher pitch = lower row number)
      const row = Math.floor((1 - (note.midi - minMidi) / midiRange) * (height - 1));
      const clampedRow = Math.max(0, Math.min(height - 1, row));

      // Draw the note
      for (let x = 0; x < noteWidth && xPos + x < width; x++) {
        grid[clampedRow][xPos + x] = x === 0 ? filled : half;
      }
    }

    xPos += noteWidth;
  }

  // Build output
  let output = `${name} @ ${tempo} BPM\n`;
  output += '┌' + '─'.repeat(width) + '┐\n';
  for (const row of grid) {
    output += '│' + row.join('') + '│\n';
  }
  output += '└' + '─'.repeat(width) + '┘\n';

  // Add note names below
  const noteNames = parsed.filter(n => !n.isRest).map(n => n.pitch).slice(0, 10);
  output += `  ${noteNames.join(' ')}${parsed.filter(n => !n.isRest).length > 10 ? '...' : ''}`;

  return output;
}

/**
 * Describe a note pattern in words
 */
function describeNotePattern(name: string, notes: string[]): string {
  const durationBeats: Record<string, number> = {
    'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25, '32': 0.125
  };

  // Parse notes
  const pitches: number[] = [];
  const durations: number[] = [];
  let restCount = 0;

  for (const note of notes) {
    const match = note.match(/^([A-Gr])([#b]?)(\d)?:(\d+|[whq])(\.?)/);
    if (!match) continue;

    const [, pitchName, acc, oct, dur, dot] = match;
    let beats = durationBeats[dur] || 1;
    if (dot) beats *= 1.5;
    durations.push(beats);

    if (pitchName.toLowerCase() === 'r') {
      restCount++;
    } else {
      const octave = parseInt(oct || '4');
      const noteMap: Record<string, number> = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
      let midi = (octave + 1) * 12 + (noteMap[pitchName.toUpperCase()] || 0);
      if (acc === '#') midi += 1;
      if (acc === 'b') midi -= 1;
      pitches.push(midi);
    }
  }

  if (pitches.length === 0) return `${name}: (all rests)`;

  // Analyze
  const range = Math.max(...pitches) - Math.min(...pitches);
  const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  // Direction analysis
  let ascendingCount = 0, descendingCount = 0;
  for (let i = 1; i < pitches.length; i++) {
    if (pitches[i] > pitches[i - 1]) ascendingCount++;
    else if (pitches[i] < pitches[i - 1]) descendingCount++;
  }

  // Build description
  let output = `${name}:\n`;

  // Contour
  if (ascendingCount > descendingCount * 1.5) {
    output += '  Contour: Rising - creates anticipation, energy building\n';
  } else if (descendingCount > ascendingCount * 1.5) {
    output += '  Contour: Falling - creates resolution, settling down\n';
  } else if (pitches.length > 2) {
    output += '  Contour: Arched - rises then falls, complete phrase shape\n';
  } else {
    output += '  Contour: Flat - static, drone-like stability\n';
  }

  // Range
  if (range <= 4) {
    output += '  Range: Narrow (≤4 semitones) - intimate, focused\n';
  } else if (range <= 12) {
    output += '  Range: Medium (octave) - expressive, singable\n';
  } else {
    output += '  Range: Wide (>octave) - dramatic, expansive\n';
  }

  // Register
  if (avgPitch > 72) { // Above C5
    output += '  Register: High - bright, ethereal, exposed\n';
  } else if (avgPitch < 48) { // Below C3
    output += '  Register: Low - dark, grounded, powerful\n';
  } else {
    output += '  Register: Middle - warm, natural, comfortable\n';
  }

  // Rhythm
  if (avgDuration >= 2) {
    output += '  Rhythm: Slow/sustained - spacious, contemplative\n';
  } else if (avgDuration <= 0.5) {
    output += '  Rhythm: Fast/active - energetic, driving\n';
  } else {
    output += '  Rhythm: Moderate - balanced, flowing\n';
  }

  // Density
  const restRatio = restCount / notes.length;
  if (restRatio > 0.3) {
    output += '  Density: Sparse - breathing room, space\n';
  } else if (restRatio < 0.1) {
    output += '  Density: Dense - continuous, relentless\n';
  }

  return output.trimEnd();
}

/**
 * Describe a chord pattern in words
 */
function describeChordPattern(name: string, chords: string[]): string {
  let output = `${name}:\n`;

  const chordTypes: string[] = [];
  for (const chord of chords) {
    const match = chord.match(/^([A-G][#b]?)([^:]*)/);
    if (match) {
      const [, , type] = match;
      if (type && !chordTypes.includes(type)) chordTypes.push(type);
    }
  }

  // Analyze chord qualities
  const hasMajor = chordTypes.some(t => t === '' || t.includes('maj'));
  const hasMinor = chordTypes.some(t => t.includes('m') && !t.includes('maj'));
  const hasSeventh = chordTypes.some(t => t.includes('7'));
  const hasExtended = chordTypes.some(t => t.includes('9') || t.includes('11') || t.includes('13'));

  if (hasMinor && !hasMajor) {
    output += '  Quality: Minor - melancholic, introspective\n';
  } else if (hasMajor && !hasMinor) {
    output += '  Quality: Major - bright, resolved, stable\n';
  } else if (hasMajor && hasMinor) {
    output += '  Quality: Mixed major/minor - emotional complexity\n';
  }

  if (hasSeventh) {
    output += '  Color: Seventh chords - jazzy, sophisticated\n';
  }
  if (hasExtended) {
    output += '  Color: Extended harmony - lush, modern\n';
  }

  output += `  Progression: ${chords.length} chord${chords.length > 1 ? 's' : ''}\n`;

  return output.trimEnd();
}

/**
 * Visualize a chord pattern
 */
function visualizeChordPattern(name: string, chords: string[], tempo: number): string {
  let output = `${name} @ ${tempo} BPM\n`;
  output += '┌' + '─'.repeat(40) + '┐\n';

  for (const chord of chords) {
    const match = chord.match(/^([A-G][#b]?[^:]*):([whq\d]+)(\.?)/);
    if (match) {
      const [, chordName, dur, dot] = match;
      const durStr = `${dur}${dot}`.padEnd(3);
      const bar = '█'.repeat(Math.min(30, chordName.length * 3));
      output += `│ ${chordName.padEnd(8)} ${durStr} ${bar.padEnd(28)}│\n`;
    }
  }

  output += '└' + '─'.repeat(40) + '┘';
  return output;
}
