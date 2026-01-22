/**
 * REPL Command Implementations
 *
 * Defines all available commands in the EtherREPL.
 */

import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { REPLSession } from './state.js';

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
            let suffix = '';
            if (mod?.transpose) suffix += ` [transpose: ${mod.transpose > 0 ? '+' : ''}${mod.transpose}]`;
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
