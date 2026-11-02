import type {ChosenLocale, Locale} from '@shared/ipc';

import logger from '@/data/service/Logger';
import {appService} from '@/data/service/services';
import {activateLocale, detectLocale} from '@/i18n/i18n';

const NO_CHOICE: ChosenLocale = {type: 'none'};

/**
 * Before the first render: the language chosen in the app, otherwise the OS language. Never rejects, a settings file
 * that can't be read shows the app in the OS language.
 */
export async function activateStartLocale(): Promise<void> {
  const chosen = await appService.getLocale().catch((error: unknown) => {
    logger.error('reading the chosen language failed', error);
    return NO_CHOICE;
  });
  await activateLocale(detectLocale(chosen, navigator.languages));
}

/**
 * switches every text without a reload, then remembers the choice for the next start; a choice that can't be stored
 * is logged and still applies until the app closes
 */
export function useActionChangeLocale() {
  return async (locale: Locale) => {
    await activateLocale(locale);
    try {
      await appService.setLocale(locale);
    } catch (error) {
      logger.error(`storing the language ${locale} failed`, error);
    }
  };
}
