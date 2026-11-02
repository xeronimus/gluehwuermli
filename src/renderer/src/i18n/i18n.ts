import {type Messages, i18n} from '@lingui/core';

import type {ChosenLocale, Locale} from '@shared/ipc';

/** the source language first: its texts are the ones in the code */
export const LOCALES: readonly Locale[] = ['en', 'de'];

const FALLBACK_LOCALE: Locale = 'en';

/** the name of each language in itself, as the switch shows it */
export const LOCALE_LABELS: Record<Locale, string> = {en: 'EN', de: 'DE'};

// @lingui/vite-plugin compiles the .po files when they are imported. Eager: the catalogs are part of the bundle, so
// switching can't fail on a chunk that doesn't load (I18nProvider renders nothing without an active language)
const catalogs = import.meta.glob<{messages: Messages}>('../locales/*/messages.po', {eager: true});

export const isLocale = (value: string): value is Locale => LOCALES.some((locale) => locale === value);

/** the first candidate that is a supported language, by its base language (`de-CH` is `de`); English otherwise */
export function pickLocale(candidates: readonly (string | undefined)[]): Locale {
  for (const candidate of candidates) {
    const base = candidate?.split('-')[0]?.toLowerCase();
    if (base && isLocale(base)) {
      return base;
    }
  }
  return FALLBACK_LOCALE;
}

/** the language chosen in the app, otherwise the OS language (Electron passes it on as navigator.languages) */
export const detectLocale = (chosen: ChosenLocale, osLanguages: readonly string[]): Locale =>
  pickLocale([chosen.type === 'chosen' ? chosen.locale : undefined, ...osLanguages]);

/** switches every text to the locale's catalog, without a reload; sets `<html lang>` too */
export function activateLocale(locale: Locale): void {
  const catalog = catalogs[`../locales/${locale}/messages.po`];
  if (!catalog) {
    throw new Error(`no catalog for the locale ${locale}`);
  }
  i18n.loadAndActivate({locale, messages: catalog.messages});
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}

export {i18n};
