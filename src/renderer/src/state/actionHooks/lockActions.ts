import type {MessageDescriptor} from '@lingui/core';
import {msg} from '@lingui/core/macro';

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

/**
 * asks the main process, then shows the status it is in now; a failure ends up in lockError and is logged as
 * "`action` failed" (in English: a production build keeps only the hashed id of `failure`)
 */
function useLockCall() {
  const setLockError = useAppStore((state) => state.setLockError);

  return async <T>(call: () => Promise<T>, action: string, failure: MessageDescriptor): Promise<T | undefined> => {
    try {
      setLockError(undefined);
      const result = await call();
      applyLockStatus(await lockService.getStatus());
      return result;
    } catch (error) {
      logger.error(`${action} failed`, error);
      setLockError(failure);
      return undefined;
    }
  };
}

const outcomeOf = (result: PasswordResult | undefined): PasswordOutcome => result?.type ?? 'failed';

export function useActionUnlock() {
  const lockCall = useLockCall();
  return async (password: string): Promise<PasswordOutcome> =>
    outcomeOf(await lockCall(() => lockService.unlock(password), 'unlocking', msg`Could not unlock`));
}

/** back to Show mode; the channel lock stays as it is */
export function useActionLock() {
  const lockCall = useLockCall();
  return async (): Promise<LockStatus | undefined> =>
    lockCall(() => lockService.lock(), 'locking', msg`Could not lock`);
}

/** the password is only needed in Show mode */
export function useActionLiftChannelLock() {
  const lockCall = useLockCall();
  return async (password: string | undefined): Promise<PasswordOutcome> =>
    outcomeOf(
      await lockCall(
        () => lockService.liftChannelLock(password),
        'lifting the channel lock',
        msg`Could not lift the channel lock`
      )
    );
}

/** Setup mode only; the current password is checked by the main process */
export function useActionChangePassword() {
  const lockCall = useLockCall();
  return async (currentPassword: string, newPassword: string): Promise<PasswordOutcome> =>
    outcomeOf(
      await lockCall(
        () => lockService.changePassword(currentPassword, newPassword),
        'changing the password',
        msg`Could not change the password`
      )
    );
}

export function useActionLockChannels() {
  const lockCall = useLockCall();
  return async (): Promise<LockStatus | undefined> =>
    lockCall(() => lockService.lockChannels(), 'turning the channel lock on', msg`Could not turn the channel lock on`);
}
