import type {TempoStatus} from '@shared/ipc';
import {NO_TAPS, type TapSequence, type Tempo, bpmOf, tempoOf, withTap} from '@shared/tapTempo';

import type TempoService from '@/data/service/TempoService';

const NO_TEMPO: TempoStatus = {type: 'none'};

const statusAt = (tempo: Tempo, nowMs: number): TempoStatus => {
  const remainder = (nowMs - tempo.downbeatMs) % tempo.beatMs;
  return {
    type: 'set',
    bpm: bpmOf(tempo),
    beatMs: tempo.beatMs,
    sinceBeatMs: remainder < 0 ? remainder + tempo.beatMs : remainder
  };
};

/**
 * a TempoService without the main process: the renderer opened in a plain browser, or a test. It taps like main's
 * tempo clock, on the clock it is given, so the pad works without Electron
 */
export function inMemoryTempoServiceFactory(now: () => number): TempoService {
  const listeners = new Set<(status: TempoStatus) => void>();
  let sequence: TapSequence = NO_TAPS;
  let tempo: Tempo | undefined;

  return {
    tap: () => {
      const tapMs = now();
      sequence = withTap(sequence, tapMs);
      const tapped = tempoOf(sequence);
      if (tapped === undefined || tapped.downbeatMs !== tapMs) {
        return;
      }
      tempo = tapped;
      const status = statusAt(tapped, tapMs);
      listeners.forEach((listener) => listener(status));
    },
    getStatus: async () => (tempo === undefined ? NO_TEMPO : statusAt(tempo, now())),
    onStatusChanged: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
