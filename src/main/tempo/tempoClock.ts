import type {TempoStatus} from '@shared/ipc';
import {NO_TAPS, type TapSequence, type Tempo, bpmOf, tempoOf, withTap} from '@shared/tapTempo';

export interface TempoClockLog {
  info: (...message: unknown[]) => void;
  warn: (...message: unknown[]) => void;
}

/**
 * The tapped tempo, in main next to the chase player (doc/chases.md): main timestamps each tap with its own monotonic
 * clock, the one the player reads, so beat times and chase anchors compare directly. No tempo until the first valid
 * tap sequence; after that a tempo never goes away, the first taps of a new sequence keep the old one. Not saved
 */
export interface TempoClock {
  tap: () => void;
  /** the last valid tempo */
  tempo: () => Tempo | undefined;
  /** the tempo as the renderer sees it, the time since the last beat taken now */
  status: () => TempoStatus;
  /** whenever an accepted tap sets a tempo; returns the function that removes the listener */
  onTempoChanged: (listener: (tempo: Tempo) => void) => () => void;
}

export interface TempoClockDependencies {
  /** a monotonic clock in milliseconds, the chase player's */
  now: () => number;
  log: TempoClockLog;
}

const NO_TEMPO: TempoStatus = {type: 'none'};

/** never negative: the modulo of a time before the downbeat is taken from the beat before */
const sinceBeatMs = (tempo: Tempo, ms: number): number => {
  const remainder = (ms - tempo.downbeatMs) % tempo.beatMs;
  return remainder < 0 ? remainder + tempo.beatMs : remainder;
};

export function tempoClockFactory({now, log}: TempoClockDependencies): TempoClock {
  let sequence: TapSequence = NO_TAPS;
  let tempo: Tempo | undefined;
  const listeners = new Set<(tempo: Tempo) => void>();

  const notify = (changed: Tempo) =>
    listeners.forEach((listener) => {
      try {
        listener(changed);
      } catch (error) {
        log.warn('a tempo listener failed', error);
      }
    });

  return {
    tap: () => {
      const tapMs = now();
      sequence = withTap(sequence, tapMs);
      const tapped = tempoOf(sequence);
      // an ignored tap leaves the sequence's last tap where it was: no new tempo
      if (tapped === undefined || tapped.downbeatMs !== tapMs) {
        return;
      }
      tempo = tapped;
      log.info(`tempo ${bpmOf(tapped).toFixed(1)} BPM`);
      notify(tapped);
    },
    tempo: () => tempo,
    status: () =>
      tempo === undefined
        ? NO_TEMPO
        : {type: 'set', bpm: bpmOf(tempo), beatMs: tempo.beatMs, sinceBeatMs: sinceBeatMs(tempo, now())},
    onTempoChanged: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
