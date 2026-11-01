import type {LockStatus, PasswordResult} from '@shared/ipc';
import {createSerialQueue} from '@shared/serialQueue';

import type {DmxEngine} from '@/dmx/dmxEngine';

import type {SettingsStore} from './SettingsStore';
import {hashPassword, verifyPassword} from './passwordHash';
import {type PasswordHash, SETTINGS_VERSION} from './settings';

export interface AppLockLog {
  info: (...message: unknown[]) => void;
}

/**
 * Two independent locks, enforced here and not in the renderer (ADR 3), both on after every start:
 * - the mode: Show mode, or Setup mode unlocked with the password. Setup mode returns to Show mode with lock() and
 *   after `idleTimeoutMs` without activity.
 * - the channel lock: the engine caps the locked channels. Lifting it needs the password in Show mode (in Setup mode
 *   it was typed already); it stays lifted until lockChannels(), e.g. for a show where the laser hangs high enough.
 */
export interface AppLock {
  /** waits for the stored settings, to tell whether a password is set */
  status: () => Promise<LockStatus>;
  isSetupMode: () => boolean;
  /** with no password stored yet, stores this one and unlocks; rejects if it can't be stored */
  unlock: (password: string) => Promise<PasswordResult>;
  /** back to Show mode; the channel lock stays as it is */
  lock: () => Promise<LockStatus>;
  /** rejects in Show mode without a password; with no password stored yet, stores this one */
  liftChannelLock: (password: string | undefined) => Promise<PasswordResult>;
  lockChannels: () => Promise<LockStatus>;
  /**
   * rejects in Show mode, and when the new password can't be stored (the old one stays valid then). Leaves the mode and
   * the channel lock as they are
   */
  changePassword: (currentPassword: string, newPassword: string) => Promise<PasswordResult>;
  /** restarts the idle timer while in Setup mode; ignored in Show mode */
  registerActivity: () => void;
  /** returns the function that removes the listener again */
  onChanged: (listener: (status: LockStatus) => void) => () => void;
}

export interface AppLockDependencies {
  settingsStore: SettingsStore;
  engine: Pick<DmxEngine, 'setLimitsEnforced'>;
  idleTimeoutMs: number;
  /** after a wrong password, so guessing takes a while */
  wrongPasswordDelayMs: number;
  log: AppLockLog;
}

const ACCEPTED: PasswordResult = {type: 'accepted'};
const WRONG_PASSWORD: PasswordResult = {type: 'wrong-password'};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function appLockFactory({
  settingsStore,
  engine,
  idleTimeoutMs,
  wrongPasswordDelayMs,
  log
}: AppLockDependencies): AppLock {
  const listeners = new Set<(status: LockStatus) => void>();
  let setupMode = false;
  let channelLocked = true;
  let passwordHash: PasswordHash | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  // load() never rejects; a missing or invalid file is no password
  const settingsLoaded = settingsStore.load().then((settings) => {
    passwordHash = settings?.password;
  });
  // two password checks at once must not both store a first password
  const runSerially = createSerialQueue();

  engine.setLimitsEnforced(channelLocked);

  const currentStatus = (): LockStatus => ({
    mode: setupMode ? 'setup' : 'show',
    passwordSet: passwordHash !== undefined,
    channelLocked
  });

  const status = async () => {
    await settingsLoaded;
    return currentStatus();
  };

  const notifyChanged = () => {
    const changed = currentStatus();
    listeners.forEach((listener) => listener(changed));
  };

  const setChannelLocked = (locked: boolean) => {
    if (channelLocked === locked) {
      return;
    }
    log.info(locked ? 'channel lock on' : 'channel lock lifted');
    channelLocked = locked;
    engine.setLimitsEnforced(locked);
    notifyChanged();
  };

  const stopIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = undefined;
  };

  const lock = async () => {
    stopIdleTimer();
    if (setupMode) {
      log.info('back to Show mode');
      setupMode = false;
      notifyChanged();
    }
    return status();
  };

  const restartIdleTimer = () => {
    stopIdleTimer();
    idleTimer = setTimeout(() => {
      log.info(`no input for ${idleTimeoutMs} ms`);
      void lock();
    }, idleTimeoutMs);
  };

  const enterSetupMode = () => {
    if (!setupMode) {
      log.info('unlocked Setup mode');
      setupMode = true;
      notifyChanged();
    }
    restartIdleTimer();
  };

  /** saved first: if the save fails, the password in use stays the one before */
  const storePassword = async (password: string) => {
    const hashed = await hashPassword(password);
    await settingsStore.save({version: SETTINGS_VERSION, password: hashed});
    passwordHash = hashed;
  };

  /** a wrong password answers only after the delay */
  const isStoredPassword = async (password: string, stored: PasswordHash): Promise<boolean> => {
    if (await verifyPassword(password, stored)) {
      return true;
    }
    await wait(wrongPasswordDelayMs);
    return false;
  };

  /** the first password typed becomes the password */
  const checkPassword = (password: string): Promise<boolean> =>
    runSerially(async () => {
      await settingsLoaded;
      if (!passwordHash) {
        await storePassword(password);
        return true;
      }
      return isStoredPassword(password, passwordHash);
    });

  const replacePassword = (currentPassword: string, newPassword: string): Promise<boolean> =>
    runSerially(async () => {
      await settingsLoaded;
      if (!passwordHash) {
        // Setup mode is only reached by setting or typing the password
        throw new Error('there is no password to change');
      }
      if (!(await isStoredPassword(currentPassword, passwordHash))) {
        return false;
      }
      // the idle timer may have locked the app while this call waited in the queue
      if (!setupMode) {
        throw new Error('changing the password needs Setup mode');
      }
      await storePassword(newPassword);
      log.info('password changed');
      return true;
    });

  return {
    status,
    isSetupMode: () => setupMode,
    unlock: async (password) => {
      if (!(await checkPassword(password))) {
        return WRONG_PASSWORD;
      }
      enterSetupMode();
      return ACCEPTED;
    },
    lock,
    liftChannelLock: async (password) => {
      if (!setupMode) {
        if (password === undefined) {
          throw new Error('lifting the channel lock in Show mode needs the password');
        }
        if (!(await checkPassword(password))) {
          return WRONG_PASSWORD;
        }
      }
      setChannelLocked(false);
      return ACCEPTED;
    },
    lockChannels: async () => {
      setChannelLocked(true);
      return status();
    },
    changePassword: async (currentPassword, newPassword) => {
      if (!setupMode) {
        throw new Error('changing the password needs Setup mode');
      }
      return (await replacePassword(currentPassword, newPassword)) ? ACCEPTED : WRONG_PASSWORD;
    },
    registerActivity: () => {
      if (setupMode) {
        restartIdleTimer();
      }
    },
    onChanged: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
