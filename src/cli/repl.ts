/**
 * EtherREPL - Interactive composition environment
 *
 * A Read-Eval-Print Loop for live coding and composing with EtherDAW.
 *
 * Commands:
 *   load <file>              Load an EtherScore file
 *   play [pattern]           Play composition or specific pattern
 *   stop                     Stop playback
 *   tempo <bpm>              Set tempo
 *   transpose <pattern> <n>  Transpose pattern by n semitones
 *   list [patterns|...]      List patterns, instruments, or sections
 *   info                     Show composition info
 *   save [file]              Save composition
 *   export <file.wav>        Export to WAV
 *   help                     Show help
 *   quit                     Exit REPL
 */

import * as readline from 'readline';
import { createSession, type REPLSession } from './repl/state.js';
import { executeCommand } from './repl/commands.js';
import { isAudioAvailable, getAudioPlayerName } from '../node/audio-context.js';

/**
 * REPL configuration
 */
export interface REPLConfig {
  /** File to load on startup */
  initialFile?: string;
  /** Custom prompt */
  prompt?: string;
  /** Welcome message */
  showWelcome?: boolean;
}

/**
 * Print the welcome banner
 */
function printWelcome(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                       EtherREPL                           ║
║              Interactive Composition Environment          ║
╚═══════════════════════════════════════════════════════════╝

Type "help" for available commands, "quit" to exit.
`);

  // Check audio availability
  if (isAudioAvailable()) {
    const playerName = getAudioPlayerName();
    console.log(`Audio: ${playerName} (ready)\n`);
  } else {
    console.log('Audio: Not available (render-only mode)\n');
  }
}

/**
 * Get the prompt string
 */
function getPrompt(session: REPLSession): string {
  const state = session.getState();

  // Build prompt parts
  const parts: string[] = [];

  // File indicator
  if (state.score) {
    const title = state.score.meta?.title || 'untitled';
    const short = title.length > 20 ? title.slice(0, 17) + '...' : title;
    parts.push(short);
  }

  // Modified indicator
  if (state.modified) {
    parts.push('*');
  }

  // Playing indicator
  const playerState = session.getPlayer().getState();
  if (playerState === 'playing') {
    parts.push('▶');
  } else if (playerState === 'rendering') {
    parts.push('⏳');
  }

  if (parts.length > 0) {
    return `ether [${parts.join(' ')}]> `;
  }
  return 'ether> ';
}

/**
 * Start the REPL
 */
export async function startREPL(config: REPLConfig = {}): Promise<void> {
  const session = createSession();

  // Show welcome message
  if (config.showWelcome !== false) {
    printWelcome();
  }

  // Load initial file if provided
  if (config.initialFile) {
    console.log(`Loading: ${config.initialFile}`);
    try {
      await session.load(config.initialFile);
      const meta = session.getMetadata();
      console.log(`Loaded: ${meta.title || config.initialFile}`);
      console.log(`  Tempo: ${meta.tempo} BPM`);
      console.log(`  Key: ${meta.key || 'Not specified'}`);
      console.log();
    } catch (error) {
      console.error(`Failed to load: ${(error as Error).message}`);
      console.log();
    }
  }

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: getPrompt(session),
    terminal: true,
  });

  // Handle line input
  const handleLine = async (line: string): Promise<boolean> => {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      return false;
    }

    // Execute command
    const result = await executeCommand(session, trimmed);

    // Show result
    if (result.message) {
      if (result.success) {
        console.log(result.message);
      } else {
        console.error(`Error: ${result.message}`);
      }
    }

    return result.shouldExit === true;
  };

  // Track if we're processing a command (for piped input)
  let processing = false;
  const commandQueue: string[] = [];

  const processNextCommand = async (): Promise<void> => {
    if (processing || commandQueue.length === 0) return;

    processing = true;
    const line = commandQueue.shift()!;

    try {
      const shouldExit = await handleLine(line);
      if (shouldExit) {
        rl.close();
        processing = false;
        return;
      }
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
    }

    // Update prompt (might have changed after command)
    rl.setPrompt(getPrompt(session));
    processing = false;

    // Process next command if queued, otherwise show prompt
    if (commandQueue.length > 0) {
      await processNextCommand();
    } else {
      rl.prompt();
    }
  };

  // Main loop
  return new Promise((resolve) => {
    rl.on('line', async (line) => {
      // Queue the command and process sequentially
      commandQueue.push(line);
      await processNextCommand();
    });

    rl.on('close', () => {
      console.log('\nGoodbye!');
      session.dispose();
      resolve();
    });

    // Handle Ctrl+C gracefully
    rl.on('SIGINT', () => {
      const player = session.getPlayer();
      if (player.getState() === 'playing') {
        // Stop playback on first Ctrl+C
        player.stop();
        console.log('\nPlayback stopped');
        rl.setPrompt(getPrompt(session));
        rl.prompt();
      } else if (session.isModified()) {
        console.log('\nUnsaved changes. Use "quit!" to discard or "save" first.');
        rl.prompt();
      } else {
        console.log('\n');
        rl.close();
      }
    });

    // Start prompt
    rl.prompt();
  });
}

/**
 * Export for CLI integration
 */
export { createSession, type REPLSession };
