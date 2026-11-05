import {type BlackoutOnQuit, parseBlackoutOnQuit} from '@shared/ipc';

import type {AppSettings} from '@/settings/appSettings';

export interface BlackoutOnQuitIpcHandlers {
  get: () => Promise<BlackoutOnQuit>;
  /** rejects for an invalid request, in Show mode, and if the settings can't be stored */
  set: (payload: unknown) => Promise<void>;
}

export interface BlackoutOnQuitIpcDependencies {
  settings: Pick<AppSettings, 'load' | 'update'>;
  isSetupMode: () => boolean;
}

/**
 * What the blackout-on-quit IPC channels do, without Electron: the setting, kept in the settings, off unless stored.
 * Changing it needs Setup mode, it decides what the rig shows after the app is gone.
 */
export function blackoutOnQuitIpcHandlers({
  settings,
  isSetupMode
}: BlackoutOnQuitIpcDependencies): BlackoutOnQuitIpcHandlers {
  return {
    get: async () => {
      const {blackoutOnQuit} = await settings.load();
      return {enabled: blackoutOnQuit === true};
    },
    set: async (payload) => {
      const request = parseBlackoutOnQuit(payload);
      if (!request) {
        throw new Error('invalid set-blackout-on-quit request');
      }
      if (!isSetupMode()) {
        throw new Error('changing the blackout on quit is refused in Show mode');
      }
      await settings.update({blackoutOnQuit: request.enabled});
    }
  };
}
