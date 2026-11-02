import {type ChosenLocale, parseSetLocaleRequest} from '@shared/ipc';

import type {AppSettings} from '@/settings/appSettings';

export interface LocaleIpcHandlers {
  get: () => Promise<ChosenLocale>;
  /** rejects for an invalid request and if the settings can't be stored */
  set: (payload: unknown) => Promise<void>;
}

/**
 * What the locale IPC channels do, without Electron: the language chosen in the app, kept in the settings. Not tied to
 * the mode, the language is how the app is shown, it changes nothing that is sent.
 */
export function localeIpcHandlers(settings: Pick<AppSettings, 'load' | 'update'>): LocaleIpcHandlers {
  return {
    get: async () => {
      const {locale} = await settings.load();
      return locale ? {type: 'chosen', locale} : {type: 'none'};
    },
    set: async (payload) => {
      const request = parseSetLocaleRequest(payload);
      if (!request) {
        throw new Error('invalid set-locale request');
      }
      await settings.update({locale: request.locale});
    }
  };
}
