import {type BlackoutOnQuit, parseBlackoutOnQuit} from '@shared/ipc';

import type {AppSettings} from '@/settings/appSettings';

export interface BlackoutOnQuitIpcHandlers {
  get: () => Promise<BlackoutOnQuit>;
  /** rejects for an invalid request and if the settings can't be stored */
  set: (payload: unknown) => Promise<void>;
}

/**
 * What the blackout-on-quit IPC channels do, without Electron: the setting, kept in the settings, off unless stored.
 * Not tied to the mode, like the port: a blackout only makes quitting safer, and the operator closing the app at the end
 * of a show decides how the rig is left.
 */
export function blackoutOnQuitIpcHandlers(settings: Pick<AppSettings, 'load' | 'update'>): BlackoutOnQuitIpcHandlers {
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
      await settings.update({blackoutOnQuit: request.enabled});
    }
  };
}
