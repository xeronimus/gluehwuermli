import {renderToStaticMarkup} from 'react-dom/server';

import {type Messages, setupI18n} from '@lingui/core';
import {I18nProvider} from '@lingui/react';

import LandingPage from './LandingPage';
import {PAGE_LOCALES} from './pageLocales';

export {PAGE_LOCALES};

// the app's catalogs, compiled by @lingui/vite-plugin: the manual's topics and the page's own texts
const catalogs = import.meta.glob<{messages: Messages}>('../../src/renderer/src/locales/*/messages.po', {eager: true});

/** the whole page in one language, as an HTML document; build.mts writes it to the language's folder */
export function renderPage(locale: string): string {
  const page = PAGE_LOCALES.find((candidate) => candidate.locale === locale);
  const catalog = catalogs[`../../src/renderer/src/locales/${locale}/messages.po`];
  if (!page || !catalog) {
    throw new Error(`no page or no catalog for the locale ${locale}`);
  }
  const i18n = setupI18n({locale, messages: {[locale]: catalog.messages}});
  const markup = renderToStaticMarkup(
    <I18nProvider i18n={i18n}>
      <LandingPage page={page} />
    </I18nProvider>
  );
  return `<!doctype html>\n${markup}\n`;
}
