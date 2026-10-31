import type {LockStatus} from '@shared/ipc';

import type LockService from '@/data/service/LockService';

/**
 * a LockService without the main process: a plain browser, or a test. Starts locked like the app, accepts any
 * password and never locks itself for being idle
 */
export function inMemoryLockServiceFactory(): LockService {
  const listeners = new Set<(status: LockStatus) => void>();
  let status: LockStatus = {mode: 'show', passwordSet: false, channelLocked: true};

  const setStatus = (change: Partial<LockStatus>) => {
    status = {...status, ...change};
    listeners.forEach((listener) => listener(status));
    return status;
  };

  return {
    getStatus: async () => status,
    unlock: async () => {
      setStatus({mode: 'setup', passwordSet: true});
      return {type: 'accepted'};
    },
    lock: async () => setStatus({mode: 'show'}),
    liftChannelLock: async (password) => {
      if (status.mode === 'show' && password === undefined) {
        throw new Error('lifting the channel lock in Show mode needs the password');
      }
      setStatus({channelLocked: false, passwordSet: true});
      return {type: 'accepted'};
    },
    lockChannels: async () => setStatus({channelLocked: true}),
    reportActivity: () => {},
    onChanged: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
