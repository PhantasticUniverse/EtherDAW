/**
 * Node.js Audio Context Setup
 *
 * Provides audio playback capabilities for Node.js environment.
 * Since Tone.js requires Web Audio API (browser), we use a render-then-play approach:
 * 1. Render compositions to WAV using offline synthesis
 * 2. Play WAV files using system audio utilities
 *
 * Supported platforms:
 * - macOS: afplay
 * - Linux: aplay, paplay, or play (sox)
 * - Windows: powershell Start-Process
 */

import { spawn, ChildProcess } from 'child_process';
import { platform } from 'os';
import { existsSync, unlinkSync } from 'fs';

/**
 * Audio player options
 */
export interface AudioPlayerOptions {
  /** Volume (0-1, default 1) */
  volume?: number;
  /** Whether to loop playback */
  loop?: boolean;
}

/**
 * Active playback instance
 */
export interface PlaybackInstance {
  /** Stop the playback */
  stop: () => void;
  /** Check if still playing */
  isPlaying: () => boolean;
  /** Promise that resolves when playback ends */
  finished: Promise<void>;
}

/**
 * Get the appropriate audio player command for the current platform
 */
function getAudioCommand(): { command: string; args: (file: string, volume: number) => string[] } | null {
  const os = platform();

  switch (os) {
    case 'darwin':
      // macOS: afplay
      return {
        command: 'afplay',
        args: (file, volume) => ['-v', volume.toString(), file],
      };

    case 'linux':
      // Linux: try paplay (PulseAudio), aplay (ALSA), or play (SoX)
      // Check which is available - for now, default to paplay
      return {
        command: 'paplay',
        args: (file, _volume) => [file], // paplay doesn't support volume directly
      };

    case 'win32':
      // Windows: use PowerShell
      return {
        command: 'powershell',
        args: (file, _volume) => [
          '-c',
          `(New-Object Media.SoundPlayer '${file}').PlaySync()`,
        ],
      };

    default:
      return null;
  }
}

/**
 * Play a WAV file using system audio
 */
export function playWavFile(filePath: string, options: AudioPlayerOptions = {}): PlaybackInstance {
  const { volume = 1, loop = false } = options;

  const audioCmd = getAudioCommand();
  if (!audioCmd) {
    throw new Error(`Unsupported platform: ${platform()}`);
  }

  let process: ChildProcess | null = null;
  let isRunning = false;
  let shouldLoop = loop;

  const startPlayback = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!existsSync(filePath)) {
        reject(new Error(`Audio file not found: ${filePath}`));
        return;
      }

      const args = audioCmd.args(filePath, volume);
      process = spawn(audioCmd.command, args, { stdio: 'ignore' });
      isRunning = true;

      process.on('close', (code) => {
        isRunning = false;
        if (code === 0) {
          if (shouldLoop && process) {
            startPlayback().then(resolve).catch(reject);
          } else {
            resolve();
          }
        } else if (code === null) {
          // Process was killed
          resolve();
        } else {
          reject(new Error(`Audio playback failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        isRunning = false;
        reject(error);
      });
    });
  };

  const finished = startPlayback();

  return {
    stop: () => {
      shouldLoop = false;
      if (process) {
        process.kill('SIGTERM');
        process = null;
      }
    },
    isPlaying: () => isRunning,
    finished,
  };
}

/**
 * Check if system audio playback is available
 */
export function isAudioAvailable(): boolean {
  return getAudioCommand() !== null;
}

/**
 * Get the current platform's audio player name
 */
export function getAudioPlayerName(): string | null {
  const cmd = getAudioCommand();
  return cmd ? cmd.command : null;
}

/**
 * Create a temporary WAV file path
 */
export function getTempWavPath(prefix = 'etherdaw'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const tmpdir = process.env.TMPDIR || process.env.TEMP || '/tmp';
  return `${tmpdir}/${prefix}-${timestamp}-${random}.wav`;
}

/**
 * Clean up a temporary file
 */
export function cleanupTempFile(filePath: string): void {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
}
