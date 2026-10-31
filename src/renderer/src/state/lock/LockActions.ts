import {LockState, LockStatusState} from './LockState';

export type LockStateSetter = (
  partial: LockState | Partial<LockState> | ((state: LockState) => LockState | Partial<LockState>),
  replace?: false,
  action?: string
) => void;

export interface LockActions {
  setLockStatus: (lockStatus: LockStatusState) => void;
  setLockError: (lockError: string | undefined) => void;
}

export const getLockActions = (set: LockStateSetter): LockActions => ({
  setLockStatus: (lockStatus) => set({lockStatus}, undefined, 'lock/setLockStatus'),
  setLockError: (lockError) => set({lockError}, undefined, 'lock/setLockError')
});
