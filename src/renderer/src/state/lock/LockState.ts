import type {LockStatus} from '@shared/ipc';

/** until the main process answered: shown like Show mode, so nothing is editable before it is known */
export type LockStatusState = {readonly mode: 'loading'} | LockStatus;

export interface LockState {
  /** mirrors the main process's mode and channel lock (useLockSubscription) */
  lockStatus: LockStatusState;
  /** a failure talking to the main process about the lock, not a wrong password (UnlockForm shows that one) */
  lockError: string | undefined;
}

export const getDefaultLockState = (): LockState => ({
  lockStatus: {mode: 'loading'},
  lockError: undefined
});
