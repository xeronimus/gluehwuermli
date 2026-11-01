import {createSerialQueue} from '@shared/serialQueue';

import type {SettingsStore} from './SettingsStore';
import {EMPTY_SETTINGS, type Settings, type SettingsChange} from './settings';

/**
 * The one owner of settings.json: the lock and the output each change their part, and every change is merged into the
 * settings as a whole, so storing the password never drops the port and the other way round.
 */
export interface AppSettings {
  /** waits for the stored settings; empty ones if nothing usable is stored. Never rejects */
  load: () => Promise<Settings>;

  /**
   * merges the change into the current settings and stores them; rejects if they can't be stored, and the settings stay
   * the ones before. Overlapping updates run one after the other, each on the result of the one before
   */
  update: (change: SettingsChange) => Promise<void>;
}

export function appSettingsFactory(store: SettingsStore): AppSettings {
  // load() never rejects
  let current: Promise<Settings> = store.load().then((settings) => settings ?? EMPTY_SETTINGS);
  const runSerially = createSerialQueue();

  const update = (change: SettingsChange) =>
    runSerially(async () => {
      const next: Settings = {...(await current), ...change};
      await store.save(next);
      current = Promise.resolve(next);
    });

  return {load: () => current, update};
}
