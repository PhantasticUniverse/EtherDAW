/**
 * Node.js Audio Module for EtherDAW
 *
 * Provides audio playback capabilities in Node.js environment.
 */

export {
  playWavFile,
  isAudioAvailable,
  getAudioPlayerName,
  getTempWavPath,
  cleanupTempFile,
  type AudioPlayerOptions,
  type PlaybackInstance,
} from './audio-context.js';

export {
  NodePlayer,
  createNodePlayer,
  renderTimeline,
  renderPattern,
  type NodePlayerState,
  type NodePlayerCallbacks,
  type RenderOptions,
} from './player.js';
