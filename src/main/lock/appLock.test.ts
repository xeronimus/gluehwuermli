import type {SettingsStore} from './SettingsStore';
import {type AppLock, appLockFactory} from './appLock';
import {hashPassword} from './passwordHash';
import type {Settings} from './settings';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const WRONG_PASSWORD_DELAY_MS = 1000;
const PASSWORD = 'laser-off';

let stored: Settings | undefined;
let saved: Settings[];
let limitsEnforced: boolean[];
let failingSave: boolean;

const settingsStore: SettingsStore = {
  load: async () => stored,
  save: async (settings) => {
    if (failingSave) {
      throw new Error('disk full');
    }
    saved.push(settings);
    stored = settings;
  }
};

const createLock = (): AppLock =>
  appLockFactory({
    settingsStore,
    engine: {setLimitsEnforced: (enforced) => limitsEnforced.push(enforced)},
    idleTimeoutMs: IDLE_TIMEOUT_MS,
    wrongPasswordDelayMs: WRONG_PASSWORD_DELAY_MS,
    log: {info: () => {}}
  });

/**
 * scrypt runs outside the fake timers: yields to the event loop until the delay after a wrong password is scheduled,
 * one timer more than before (in Setup mode the idle timer runs already)
 */
async function untilTimerScheduled(timersBefore: number) {
  while (vi.getTimerCount() <= timersBefore) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

beforeEach(async () => {
  // setImmediate stays real for untilTimerScheduled
  vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout', 'Date']});
  stored = {version: 1, password: await hashPassword(PASSWORD)};
  saved = [];
  limitsEnforced = [];
  failingSave = false;
});

afterEach(() => {
  vi.useRealTimers();
});

const SHOW = {mode: 'show', passwordSet: true, channelLocked: true};
const SETUP = {mode: 'setup', passwordSet: true, channelLocked: true};

/** starts a call that checks a wrong password and lets the delay after it pass; resolves to its result */
async function afterWrongPasswordDelay<T>(call: () => Promise<T>): Promise<{settledEarly: boolean; result: T}> {
  let settled = false;
  const timersBefore = vi.getTimerCount();
  const running = call().finally(() => {
    settled = true;
  });
  await untilTimerScheduled(timersBefore);
  await vi.advanceTimersByTimeAsync(WRONG_PASSWORD_DELAY_MS - 1);
  const settledEarly = settled;
  await vi.advanceTimersByTimeAsync(1);
  return {settledEarly, result: await running};
}

describe('after the start', () => {
  test('is in Show mode with the channel lock on', async () => {
    const lock = createLock();

    expect(await lock.status()).toEqual(SHOW);
    expect(lock.isSetupMode()).toBe(false);
    expect(limitsEnforced).toEqual([true]);
  });

  test('is in Show mode without a password when the settings are missing or invalid', async () => {
    stored = undefined;

    expect(await createLock().status()).toEqual({...SHOW, passwordSet: false});
  });
});

describe('unlock', () => {
  test('the first unlock stores a hash of the password, not the password, and unlocks', async () => {
    stored = undefined;
    const lock = createLock();

    expect(await lock.unlock(PASSWORD)).toEqual({type: 'accepted'});

    expect(saved).toHaveLength(1);
    expect(JSON.stringify(saved)).not.toContain(PASSWORD);
    expect(await lock.status()).toEqual(SETUP);
  });

  test('the password stored by the first unlock is needed for the next one', async () => {
    stored = undefined;
    const lock = createLock();
    await lock.unlock(PASSWORD);
    await lock.lock();

    expect(await lock.unlock(PASSWORD)).toEqual({type: 'accepted'});
    expect(saved).toHaveLength(1);
  });

  test('the right password unlocks Setup mode, still with the channel lock on', async () => {
    const lock = createLock();
    const statuses: unknown[] = [];
    lock.onChanged((status) => statuses.push(status));

    expect(await lock.unlock(PASSWORD)).toEqual({type: 'accepted'});

    expect(lock.isSetupMode()).toBe(true);
    expect(statuses).toEqual([SETUP]);
    expect(limitsEnforced).toEqual([true]);
  });

  test('a wrong password stays in Show mode, and only answers after the delay', async () => {
    const lock = createLock();

    const {settledEarly, result} = await afterWrongPasswordDelay(() => lock.unlock('guess'));

    expect(settledEarly).toBe(false);
    expect(result).toEqual({type: 'wrong-password'});
    expect(await lock.status()).toEqual(SHOW);
  });
});

describe('back to Show mode', () => {
  test('lock() returns to Show mode and leaves the channel lock as it is', async () => {
    const lock = createLock();
    await lock.unlock(PASSWORD);
    await lock.liftChannelLock(undefined);

    expect(await lock.lock()).toEqual({...SHOW, channelLocked: false});
    expect(limitsEnforced.at(-1)).toBe(false);
  });

  test('after 10 minutes without input, the channel lock stays as it is', async () => {
    const lock = createLock();
    await lock.unlock(PASSWORD);
    await lock.liftChannelLock(undefined);

    await vi.advanceTimersByTimeAsync(IDLE_TIMEOUT_MS - 1);
    expect(lock.isSetupMode()).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    expect(lock.isSetupMode()).toBe(false);
    expect(limitsEnforced.at(-1)).toBe(false);
  });

  test('activity restarts the idle timer', async () => {
    const lock = createLock();
    await lock.unlock(PASSWORD);

    await vi.advanceTimersByTimeAsync(IDLE_TIMEOUT_MS - 1000);
    lock.registerActivity();
    await vi.advanceTimersByTimeAsync(IDLE_TIMEOUT_MS - 1000);
    expect(lock.isSetupMode()).toBe(true);

    await vi.advanceTimersByTimeAsync(1000);
    expect(lock.isSetupMode()).toBe(false);
  });
});

describe('the channel lock', () => {
  test('is lifted in Setup mode without the password, and turned on again', async () => {
    const lock = createLock();
    await lock.unlock(PASSWORD);

    expect(await lock.liftChannelLock(undefined)).toEqual({type: 'accepted'});
    expect(await lock.status()).toEqual({...SETUP, channelLocked: false});
    expect(await lock.lockChannels()).toEqual(SETUP);
    expect(limitsEnforced).toEqual([true, false, true]);
  });

  test('is lifted in Show mode with the password, staying in Show mode', async () => {
    const lock = createLock();

    expect(await lock.liftChannelLock(PASSWORD)).toEqual({type: 'accepted'});

    expect(await lock.status()).toEqual({...SHOW, channelLocked: false});
    expect(limitsEnforced).toEqual([true, false]);
  });

  test('the first password typed to lift it becomes the password', async () => {
    stored = undefined;
    const lock = createLock();

    expect(await lock.liftChannelLock(PASSWORD)).toEqual({type: 'accepted'});
    expect(saved).toHaveLength(1);
  });

  test('stays on in Show mode with a wrong password, answering after the delay', async () => {
    const lock = createLock();

    const {settledEarly, result} = await afterWrongPasswordDelay(() => lock.liftChannelLock('guess'));

    expect(settledEarly).toBe(false);
    expect(result).toEqual({type: 'wrong-password'});
    expect(limitsEnforced).toEqual([true]);
  });

  test('cannot be lifted in Show mode without a password', async () => {
    const lock = createLock();

    await expect(lock.liftChannelLock(undefined)).rejects.toThrow('needs the password');
    expect(limitsEnforced).toEqual([true]);
  });
});

describe('changing the password', () => {
  const NEW_PASSWORD = 'laser-on';

  test('in Setup mode with the current password stores the new one, staying in Setup mode', async () => {
    const lock = createLock();
    await lock.unlock(PASSWORD);
    await lock.liftChannelLock(undefined);

    expect(await lock.changePassword(PASSWORD, NEW_PASSWORD)).toEqual({type: 'accepted'});

    expect(saved).toHaveLength(1);
    expect(JSON.stringify(saved)).not.toContain(NEW_PASSWORD);
    expect(await lock.status()).toEqual({...SETUP, channelLocked: false});
  });

  test('afterwards only the new password unlocks, also after a restart', async () => {
    const lock = createLock();
    await lock.unlock(PASSWORD);
    await lock.changePassword(PASSWORD, NEW_PASSWORD);
    await lock.lock();

    const {result} = await afterWrongPasswordDelay(() => lock.unlock(PASSWORD));
    expect(result).toEqual({type: 'wrong-password'});
    expect(await lock.unlock(NEW_PASSWORD)).toEqual({type: 'accepted'});

    const restarted = createLock();
    expect(await restarted.liftChannelLock(NEW_PASSWORD)).toEqual({type: 'accepted'});
  });

  test('a wrong current password keeps the password and Setup mode, answering after the delay', async () => {
    const lock = createLock();
    await lock.unlock(PASSWORD);

    const {settledEarly, result} = await afterWrongPasswordDelay(() => lock.changePassword('guess', NEW_PASSWORD));

    expect(settledEarly).toBe(false);
    expect(result).toEqual({type: 'wrong-password'});
    expect(saved).toEqual([]);
    expect(await lock.status()).toEqual(SETUP);
  });

  test('is refused in Show mode', async () => {
    const lock = createLock();

    await expect(lock.changePassword(PASSWORD, NEW_PASSWORD)).rejects.toThrow('needs Setup mode');
    expect(saved).toEqual([]);
  });

  test('is refused when Show mode returns while the change waits in the queue', async () => {
    const lock = createLock();
    await lock.unlock(PASSWORD);
    const timersBefore = vi.getTimerCount();
    const wrongGuess = lock.changePassword('guess', NEW_PASSWORD);
    const refused = expect(lock.changePassword(PASSWORD, NEW_PASSWORD)).rejects.toThrow('needs Setup mode');
    await untilTimerScheduled(timersBefore);

    await lock.lock();
    await vi.advanceTimersByTimeAsync(WRONG_PASSWORD_DELAY_MS);

    expect(await wrongGuess).toEqual({type: 'wrong-password'});
    await refused;
    expect(saved).toEqual([]);
  });

  test('keeps the old password when the new one cannot be stored', async () => {
    const lock = createLock();
    await lock.unlock(PASSWORD);
    failingSave = true;

    await expect(lock.changePassword(PASSWORD, NEW_PASSWORD)).rejects.toThrow('disk full');
    await lock.lock();

    expect(await lock.unlock(PASSWORD)).toEqual({type: 'accepted'});
  });
});
