import type {LockStatus, PasswordResult} from '@shared/ipc';

import logger from '@/data/service/Logger';
import {lockService} from '@/data/service/services';

import {useAppStore} from '../store';
import {applyLockStatus} from './lockSubscription';

/**
 * what a password form shows: `failed` when the main process couldn't be asked or couldn't store a new password (the
 * reason is in lockError)
 */
export type PasswordOutcome = PasswordResult['type'] | 'failed';

/** asks the main process, then shows the status it is in now; a failure ends up in lockError */
function useLockCall() {
  const setLockError = useAppStore((state) => state.setLockError);

  return async <T>(call: () => Promise<T>, failure: string): Promise<T | undefined> => {
    try {
      setLockError(undefined);
      const result = await call();
      applyLockStatus(await lockService.getStatus());
      return result;
    } catch (error) {
      logger.error(failure, error);
      setLockError(failure);
      return undefined;
    }
  };
}

const outcomeOf = (result: PasswordResult | undefined): PasswordOutcome => result?.type ?? 'failed';

export function useActionUnlock() {
  const lockCall = useLockCall();
  return async (password: string): Promise<PasswordOutcome> =>
    outcomeOf(await lockCall(() => lockService.unlock(password), 'Could not unlock'));
}

/** back to Show mode; the channel lock stays as it is */
export function useActionLock() {
  const lockCall = useLockCall();
  return async (): Promise<LockStatus | undefined> => lockCall(() => lockService.lock(), 'Could not lock');
}

/** the password is only needed in Show mode */
export function useActionLiftChannelLock() {
  const lockCall = useLockCall();
  return async (password: string | undefined): Promise<PasswordOutcome> =>
    outcomeOf(await lockCall(() => lockService.liftChannelLock(password), 'Could not lift the channel lock'));
}

export function useActionLockChannels() {
  const lockCall = useLockCall();
  return async (): Promise<LockStatus | undefined> =>
    lockCall(() => lockService.lockChannels(), 'Could not turn the channel lock on');
}
