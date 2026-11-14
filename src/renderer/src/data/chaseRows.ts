import {passCount} from '@shared/chases';
import {
  CHASE_SPEED_DEFAULT,
  type Chase,
  type ChaseRepeat,
  type ChaseSpeed,
  type ChaseStatus,
  type ChaseSyncStatus
} from '@shared/ipc';

/**
 * What a chase's row in the Show view shows, from the chase and the player's status in main. Numbers and codes only,
 * the row says them in the UI language.
 */

/** where the chase is in its play: step and pass counted from 1, as the row shows them */
export interface ChasePosition {
  readonly stepNumber: number;
  readonly stepCount: number;
  readonly passNumber: number;
  /** Infinity for a chase that loops until stopped */
  readonly passCount: number;
}

/**
 * - `playing`: this chase runs or is paused, the row is highlighted
 * - `dimmed`: another chase runs or is paused; Start still works and replaces it
 * - `idle`: no chase plays
 */
export type ChaseRowState =
  | {readonly type: 'playing'; readonly paused: boolean; readonly position: ChasePosition}
  | {readonly type: 'dimmed'}
  | {readonly type: 'idle'};

export type ChaseControl = 'start' | 'pause' | 'resume' | 'stop';

/** the repeat as the row shows it: `1×`, `8×` or `∞`, the same in every language */
export function repeatLabel(repeat: ChaseRepeat): string {
  const passes = passCount(repeat);
  return Number.isFinite(passes) ? `${passes}×` : '∞';
}

/** a chase row's sync switch and speed: as main keeps them, else not synced at 1× */
export interface ChaseSyncShown {
  readonly synced: boolean;
  readonly speed: ChaseSpeed;
}

export function syncSettingOf(chaseSync: ChaseSyncStatus, chaseId: string): ChaseSyncShown {
  const setting = chaseSync.chases.find((chase) => chase.chaseId === chaseId);
  return setting === undefined
    ? {synced: false, speed: CHASE_SPEED_DEFAULT}
    : {synced: setting.synced, speed: setting.speed};
}

/** a speed as its button shows it: `½×`, `1×`, `2×` or `4×`, the same in every language */
export const speedLabel = (speed: ChaseSpeed): string => `${speed === 0.5 ? '½' : speed}×`;

/** the row of this chase while the player has that status; a status of a chase the project doesn't list dims no row */
export function chaseRowState(chase: Chase, status: ChaseStatus, chases: readonly Chase[]): ChaseRowState {
  if (status.type === 'idle') {
    return {type: 'idle'};
  }
  if (status.chaseId !== chase.id) {
    return chases.some(({id}) => id === status.chaseId) ? {type: 'dimmed'} : {type: 'idle'};
  }
  return {
    type: 'playing',
    paused: status.type === 'paused',
    position: {
      stepNumber: status.stepIndex + 1,
      stepCount: chase.steps.length,
      passNumber: status.passIndex + 1,
      passCount: passCount(chase.repeat)
    }
  };
}

/** the buttons of the row: Start when not playing, Pause or Resume and Stop when running or paused */
export function chaseRowControls(rowState: ChaseRowState): readonly ChaseControl[] {
  if (rowState.type !== 'playing') {
    return ['start'];
  }
  return rowState.paused ? ['resume', 'stop'] : ['pause', 'stop'];
}

/** a chase played once has only one pass, so the row doesn't count it */
export const showsPass = (position: ChasePosition): boolean => position.passCount !== 1;

/** the narrowest a step box gets before the row shows `step 12 / 100` instead */
export const STEP_BOX_MIN_WIDTH_PX = 4;
/** the space between two step boxes */
export const STEP_BOX_GAP_PX = 2;

/** whether the step boxes fit into this width, each at least the minimum width */
export const stepBoxesFit = (stepCount: number, availableWidthPx: number): boolean =>
  stepCount * STEP_BOX_MIN_WIDTH_PX + (stepCount - 1) * STEP_BOX_GAP_PX <= availableWidthPx;
