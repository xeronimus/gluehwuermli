import type {TempoStatus} from '@shared/ipc';

/** the tap pad's beat mark: a CSS animation one beat long, started partway so it blinks on the beat */
export interface BeatAnimation {
  readonly durationMs: number;
  /** zero or negative: how far into the beat the animation starts */
  readonly delayMs: number;
}

/**
 * the beat mark's animation at `nowMs` for a status that arrived at `receivedAtMs` (both on the renderer's clock);
 * none without a tempo. No timer: the animation repeats on its own, a new status restarts it
 */
export function beatAnimation(status: TempoStatus, receivedAtMs: number, nowMs: number): BeatAnimation | undefined {
  if (status.type === 'none') {
    return undefined;
  }
  const intoBeatMs = (status.sinceBeatMs + Math.max(0, nowMs - receivedAtMs)) % status.beatMs;
  return {durationMs: status.beatMs, delayMs: -intoBeatMs};
}

/** the tempo as the pad shows it, whole beats per minute; none without a tempo */
export const shownBpm = (status: TempoStatus): number | undefined =>
  status.type === 'set' ? Math.round(status.bpm) : undefined;
