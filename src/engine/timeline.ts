/**
 * Timeline class for sequencing musical events
 */

import type {
  Timeline as TimelineType,
  TimelineEvent,
  NoteEvent,
  ChordEvent,
  TempoEvent,
  KeyEvent,
  EtherScoreSettings,
} from '../schema/types.js';
import { beatsToSeconds } from '../parser/note-parser.js';

/**
 * Builder class for constructing timelines
 */
export class TimelineBuilder {
  private events: TimelineEvent[] = [];
  private instruments: Set<string> = new Set();
  private settings: EtherScoreSettings;
  private currentTempo: number;

  constructor(settings: EtherScoreSettings) {
    this.settings = settings;
    this.currentTempo = settings.tempo;
  }

  /**
   * Add a note event
   * v0.4: Supports optional expression fields via options parameter
   */
  addNote(
    pitch: string,
    startBeat: number,
    durationBeats: number,
    velocity: number,
    instrument: string,
    options?: {
      timingOffset?: number;
      probability?: number;
      portamento?: boolean;
      humanize?: number;
    }
  ): this {
    this.instruments.add(instrument);

    const timeSeconds = this.beatsToTime(startBeat);
    const durationSeconds = beatsToSeconds(durationBeats, this.currentTempo);

    const event: NoteEvent = {
      type: 'note',
      time: startBeat,
      timeSeconds,
      pitch,
      duration: durationBeats,
      durationSeconds,
      velocity,
      instrument,
    };

    // Add v0.4 expression fields if provided
    if (options) {
      if (options.timingOffset !== undefined) event.timingOffset = options.timingOffset;
      if (options.probability !== undefined) event.probability = options.probability;
      if (options.portamento !== undefined) event.portamento = options.portamento;
      if (options.humanize !== undefined) event.humanize = options.humanize;
    }

    this.events.push(event);
    return this;
  }

  /**
   * Add multiple notes as a chord
   */
  addChord(
    pitches: string[],
    startBeat: number,
    durationBeats: number,
    velocity: number,
    instrument: string
  ): this {
    this.instruments.add(instrument);

    const timeSeconds = this.beatsToTime(startBeat);
    const durationSeconds = beatsToSeconds(durationBeats, this.currentTempo);

    const notes: NoteEvent[] = pitches.map(pitch => ({
      type: 'note' as const,
      time: startBeat,
      timeSeconds,
      pitch,
      duration: durationBeats,
      durationSeconds,
      velocity,
      instrument,
    }));

    const event: ChordEvent = {
      type: 'chord',
      time: startBeat,
      timeSeconds,
      notes,
    };

    this.events.push(event);
    return this;
  }

  /**
   * Add a tempo change
   */
  addTempoChange(beat: number, tempo: number): this {
    const event: TempoEvent = {
      type: 'tempo',
      time: beat,
      timeSeconds: this.beatsToTime(beat),
      tempo,
    };

    this.events.push(event);
    this.currentTempo = tempo;
    return this;
  }

  /**
   * Add a key change
   */
  addKeyChange(beat: number, key: string): this {
    const event: KeyEvent = {
      type: 'key',
      time: beat,
      timeSeconds: this.beatsToTime(beat),
      key,
    };

    this.events.push(event);
    return this;
  }

  /**
   * Convert beats to seconds considering tempo
   */
  private beatsToTime(beats: number): number {
    return beatsToSeconds(beats, this.currentTempo);
  }

  /**
   * Build the final timeline
   */
  build(): TimelineType {
    // Sort events by time
    const sortedEvents = [...this.events].sort((a, b) => a.time - b.time);

    // Calculate total duration
    let totalBeats = 0;
    for (const event of sortedEvents) {
      if (event.type === 'note') {
        totalBeats = Math.max(totalBeats, event.time + event.duration);
      } else if (event.type === 'chord') {
        for (const note of event.notes) {
          totalBeats = Math.max(totalBeats, note.time + note.duration);
        }
      }
    }

    // Recalculate all times with proper tempo changes
    const processedEvents = this.recalculateTimes(sortedEvents);
    const totalSeconds = this.calculateTotalSeconds(processedEvents, totalBeats);

    return {
      events: processedEvents,
      totalBeats,
      totalSeconds,
      instruments: Array.from(this.instruments),
      settings: this.settings,
    };
  }

  /**
   * Recalculate times considering tempo changes
   */
  private recalculateTimes(events: TimelineEvent[]): TimelineEvent[] {
    let currentTempo = this.settings.tempo;
    let currentBeat = 0;
    let currentTime = 0;

    // Extract tempo events
    const tempoEvents = events
      .filter((e): e is TempoEvent => e.type === 'tempo')
      .sort((a, b) => a.time - b.time);

    // Process each event
    return events.map(event => {
      // Find applicable tempo
      for (const tempoEvent of tempoEvents) {
        if (tempoEvent.time <= event.time && tempoEvent.time > currentBeat) {
          // Add time for beats before this tempo change
          currentTime += beatsToSeconds(tempoEvent.time - currentBeat, currentTempo);
          currentBeat = tempoEvent.time;
          currentTempo = tempoEvent.tempo;
        }
      }

      // Calculate time for this event
      const beatsSinceLastChange = event.time - currentBeat;
      const timeSeconds = currentTime + beatsToSeconds(beatsSinceLastChange, currentTempo);

      // Update event with correct time
      const updated = { ...event, timeSeconds };

      if (event.type === 'note') {
        (updated as NoteEvent).durationSeconds = beatsToSeconds(event.duration, currentTempo);
      } else if (event.type === 'chord') {
        (updated as ChordEvent).notes = event.notes.map(note => ({
          ...note,
          timeSeconds,
          durationSeconds: beatsToSeconds(note.duration, currentTempo),
        }));
      }

      return updated;
    });
  }

  /**
   * Calculate total seconds for the timeline
   */
  private calculateTotalSeconds(events: TimelineEvent[], totalBeats: number): number {
    let maxTime = 0;

    for (const event of events) {
      if (event.type === 'note') {
        maxTime = Math.max(maxTime, event.timeSeconds + event.durationSeconds);
      } else if (event.type === 'chord') {
        for (const note of event.notes) {
          maxTime = Math.max(maxTime, note.timeSeconds + note.durationSeconds);
        }
      }
    }

    return maxTime;
  }
}

/**
 * Get all note events from a timeline (flattens chords)
 */
export function getAllNotes(timeline: TimelineType): NoteEvent[] {
  const notes: NoteEvent[] = [];

  for (const event of timeline.events) {
    if (event.type === 'note') {
      notes.push(event);
    } else if (event.type === 'chord') {
      notes.push(...event.notes);
    }
  }

  return notes.sort((a, b) => a.time - b.time);
}

/**
 * Filter timeline events by instrument
 */
export function filterByInstrument(timeline: TimelineType, instrument: string): TimelineEvent[] {
  return timeline.events.filter(event => {
    if (event.type === 'note') {
      return event.instrument === instrument;
    }
    if (event.type === 'chord') {
      return event.notes.some(note => note.instrument === instrument);
    }
    return true; // Keep tempo and key changes
  });
}

/**
 * Merge multiple timelines
 */
export function mergeTimelines(timelines: TimelineType[]): TimelineType {
  if (timelines.length === 0) {
    throw new Error('Cannot merge empty array of timelines');
  }

  const allEvents: TimelineEvent[] = [];
  const allInstruments = new Set<string>();
  let maxBeats = 0;
  let maxSeconds = 0;

  for (const timeline of timelines) {
    allEvents.push(...timeline.events);
    timeline.instruments.forEach(i => allInstruments.add(i));
    maxBeats = Math.max(maxBeats, timeline.totalBeats);
    maxSeconds = Math.max(maxSeconds, timeline.totalSeconds);
  }

  return {
    events: allEvents.sort((a, b) => a.time - b.time),
    totalBeats: maxBeats,
    totalSeconds: maxSeconds,
    instruments: Array.from(allInstruments),
    settings: timelines[0].settings,
  };
}

/**
 * Offset all events in a timeline by a beat amount
 */
export function offsetTimeline(timeline: TimelineType, beatOffset: number): TimelineType {
  const offsetEvents = timeline.events.map(event => {
    const newEvent = { ...event, time: event.time + beatOffset };

    if (event.type === 'chord') {
      (newEvent as ChordEvent).notes = event.notes.map(note => ({
        ...note,
        time: note.time + beatOffset,
      }));
    }

    return newEvent;
  });

  return {
    ...timeline,
    events: offsetEvents,
    totalBeats: timeline.totalBeats + beatOffset,
  };
}
