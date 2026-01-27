/**
 * Browser Bridge for EtherDAW v0.9.5.1
 *
 * WebSocket bridge between the REPL and browser player.
 * Enables real-time audio playback via the browser's Web Audio API.
 *
 * Protocol:
 * - REPL starts WebSocket server on localhost:3847
 * - player.html connects as client
 * - REPL sends commands (play, stop, load, etc.)
 * - Browser sends status updates
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Message types for REPL -> Browser
 */
export interface BridgeCommand {
  type: 'play' | 'stop' | 'load' | 'playNotes' | 'setTempo' | 'seek' | 'setVolume';
  payload?: unknown;
}

/**
 * Message types for Browser -> REPL
 */
export interface BridgeStatus {
  type: 'connected' | 'playing' | 'stopped' | 'loaded' | 'error' | 'position';
  payload?: unknown;
}

/**
 * Bridge connection status
 */
export type BridgeConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * Browser bridge configuration
 */
export interface BridgeConfig {
  /** WebSocket port (default: 3847) */
  port?: number;
  /** HTTP port for player serving (default: 3848) */
  httpPort?: number;
  /** Auto-open browser (default: true) */
  autoOpen?: boolean;
}

/**
 * Bridge event callbacks
 */
export interface BridgeCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onPlaying?: () => void;
  onStopped?: () => void;
  onError?: (error: string) => void;
  onPosition?: (time: number) => void;
}

/**
 * Safely open a URL in the default browser
 */
function openBrowser(url: string): void {
  const command = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'cmd' : 'xdg-open';

  if (process.platform === 'win32') {
    // Windows needs special handling
    execFile(command, ['/c', 'start', '', url], (error) => {
      if (error) {
        console.error('Failed to open browser:', error.message);
      }
    });
  } else {
    execFile(command, [url], (error) => {
      if (error) {
        console.error('Failed to open browser:', error.message);
      }
    });
  }
}

/**
 * Browser Bridge class
 */
export class BrowserBridge {
  private wss: WebSocketServer | null = null;
  private httpServer: ReturnType<typeof createServer> | null = null;
  private client: WebSocket | null = null;
  private callbacks: BridgeCallbacks = {};
  private config: Required<BridgeConfig>;
  private status: BridgeConnectionStatus = 'disconnected';

  constructor(config: BridgeConfig = {}) {
    this.config = {
      port: config.port ?? 3847,
      httpPort: config.httpPort ?? 3848,
      autoOpen: config.autoOpen ?? true,
    };
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: BridgeCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Get connection status
   */
  getStatus(): BridgeConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.client?.readyState === WebSocket.OPEN;
  }

  /**
   * Start the bridge server
   */
  async start(): Promise<string> {
    if (this.wss) {
      return `Already running on port ${this.config.port}`;
    }

    this.status = 'connecting';

    // Start HTTP server for player.html
    this.httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      await this.handleHttpRequest(req, res);
    });

    await new Promise<void>((resolve) => {
      this.httpServer!.listen(this.config.httpPort, () => resolve());
    });

    // Start WebSocket server
    this.wss = new WebSocketServer({ port: this.config.port });

    this.wss.on('connection', (ws: WebSocket) => {
      this.client = ws;
      this.status = 'connected';
      this.callbacks.onConnected?.();

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as BridgeStatus;
          this.handleMessage(message);
        } catch {
          // Ignore invalid messages
        }
      });

      ws.on('close', () => {
        this.client = null;
        this.status = 'disconnected';
        this.callbacks.onDisconnected?.();
      });

      ws.on('error', (error: Error) => {
        this.callbacks.onError?.(error.message);
      });
    });

    const playerUrl = `http://localhost:${this.config.httpPort}/player`;

    // Auto-open browser if configured
    if (this.config.autoOpen) {
      openBrowser(playerUrl);
    }

    return `Bridge started. Player at: ${playerUrl}\nWebSocket on port ${this.config.port}`;
  }

  /**
   * Stop the bridge server
   */
  async stop(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
    this.status = 'disconnected';
  }

  /**
   * Send command to browser
   */
  send(command: BridgeCommand): boolean {
    if (!this.isConnected()) {
      return false;
    }
    try {
      this.client!.send(JSON.stringify(command));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Play notes in browser
   * @param notes Note string like "C4:q E4:q G4:h"
   * @param preset Instrument preset to use
   * @param tempo BPM
   */
  playNotes(notes: string, preset: string = 'fm_epiano', tempo: number = 120): boolean {
    return this.send({
      type: 'playNotes',
      payload: { notes, preset, tempo },
    });
  }

  /**
   * Load composition in browser
   */
  loadComposition(score: object): boolean {
    return this.send({
      type: 'load',
      payload: score,
    });
  }

  /**
   * Play composition in browser
   */
  play(): boolean {
    return this.send({ type: 'play' });
  }

  /**
   * Stop playback in browser
   */
  stopPlayback(): boolean {
    return this.send({ type: 'stop' });
  }

  /**
   * Set tempo in browser
   */
  setTempo(tempo: number): boolean {
    return this.send({ type: 'setTempo', payload: tempo });
  }

  /**
   * Seek to position
   */
  seek(seconds: number): boolean {
    return this.send({ type: 'seek', payload: seconds });
  }

  /**
   * Handle message from browser
   */
  private handleMessage(message: BridgeStatus): void {
    switch (message.type) {
      case 'connected':
        this.callbacks.onConnected?.();
        break;
      case 'playing':
        this.callbacks.onPlaying?.();
        break;
      case 'stopped':
        this.callbacks.onStopped?.();
        break;
      case 'error':
        this.callbacks.onError?.(message.payload as string);
        break;
      case 'position':
        this.callbacks.onPosition?.(message.payload as number);
        break;
    }
  }

  /**
   * Handle HTTP request for player
   */
  private async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = req.url || '/';

    if (url === '/player' || url === '/player.html') {
      // Serve player.html with WebSocket connection injected
      try {
        const playerPath = resolve(__dirname, '../../player.html');
        let html = await readFile(playerPath, 'utf-8');

        // Inject WebSocket bridge connection script
        const bridgeScript = `
<script>
// EtherDAW Browser Bridge Connection
(function() {
  const ws = new WebSocket('ws://localhost:${this.config.port}');

  ws.onopen = () => {
    console.log('Bridge connected');
    ws.send(JSON.stringify({ type: 'connected' }));
  };

  ws.onmessage = async (event) => {
    try {
      const cmd = JSON.parse(event.data);
      switch (cmd.type) {
        case 'playNotes':
          await playNotesFromBridge(cmd.payload);
          break;
        case 'load':
          loadCompositionFromBridge(cmd.payload);
          break;
        case 'play':
          document.getElementById('playButton')?.click();
          break;
        case 'stop':
          document.getElementById('stopButton')?.click();
          break;
        case 'setTempo':
          if (window.player) {
            window.player.setPlaybackRate(cmd.payload / (window.player.getBaseTempo() || 120));
          }
          break;
        case 'seek':
          if (window.player) {
            window.player.seek(cmd.payload);
          }
          break;
      }
    } catch (e) {
      console.error('Bridge command error:', e);
    }
  };

  ws.onclose = () => {
    console.log('Bridge disconnected');
  };

  // Play notes instantly using Tone.js
  async function playNotesFromBridge(payload) {
    if (typeof Tone === 'undefined') return;

    await Tone.start();
    const { notes, preset, tempo } = payload;

    // Parse notes and create a simple synth
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    Tone.Transport.bpm.value = tempo;

    // Parse note string
    const noteList = notes.split(/\\s+/).filter(n => n);
    let time = 0;
    const beatDuration = 60 / tempo;

    const durations = { w: 4, h: 2, q: 1, '8': 0.5, '16': 0.25, '32': 0.125 };

    for (const note of noteList) {
      if (note === '|') continue;
      const match = note.match(/^([A-Gr][#b]?\\d):([whq\\d]+)(\\.?)/);
      if (!match) continue;

      const [, pitch, dur, dot] = match;
      let beats = durations[dur] || parseFloat(dur) || 1;
      if (dot) beats *= 1.5;

      if (!pitch.startsWith('r')) {
        const now = Tone.now();
        synth.triggerAttackRelease(pitch, beats * beatDuration, now + time);
      }
      time += beats * beatDuration;
    }

    // Send playing status
    ws.send(JSON.stringify({ type: 'playing' }));

    // Send stopped after playback
    setTimeout(() => {
      ws.send(JSON.stringify({ type: 'stopped' }));
      synth.dispose();
    }, time * 1000 + 100);
  }

  // Load composition from bridge
  function loadCompositionFromBridge(score) {
    // Store the score for the player to use
    window.bridgeScore = score;
    console.log('Composition loaded from bridge:', score.meta?.title || 'untitled');
    ws.send(JSON.stringify({ type: 'loaded' }));
  }

  window.bridgeWs = ws;
})();
</script>
`;

        // Insert before </body>
        html = html.replace('</body>', bridgeScript + '</body>');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } catch {
        res.writeHead(500);
        res.end('Error loading player');
      }
    } else if (url.startsWith('/src/') || url.endsWith('.js')) {
      // Serve JS files
      try {
        const filePath = resolve(__dirname, '../..', url.slice(1));
        const content = await readFile(filePath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }
}

/**
 * Global bridge instance
 */
let globalBridge: BrowserBridge | null = null;

/**
 * Get or create the global browser bridge
 */
export function getBrowserBridge(config?: BridgeConfig): BrowserBridge {
  if (!globalBridge) {
    globalBridge = new BrowserBridge(config);
  }
  return globalBridge;
}

/**
 * Check if bridge is available
 */
export function isBridgeAvailable(): boolean {
  return globalBridge?.isConnected() ?? false;
}
