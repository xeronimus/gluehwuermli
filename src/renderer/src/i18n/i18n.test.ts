import {LOCALES, activateLocale, detectLocale, i18n, isLocale, pickLocale} from './i18n';

// raw, so the test reads the .po files as written, without Node's fs
const poFiles = import.meta.glob<string>('../locales/*/messages.po', {query: '?raw', import: 'default'});

describe('pickLocale', () => {
  test('falls back to English when no candidate is supported', () => {
    expect(pickLocale(['fr', 'it', undefined])).toBe('en');
    expect(pickLocale([])).toBe('en');
  });

  test('takes the first supported candidate', () => {
    expect(pickLocale(['fr', 'de', 'en'])).toBe('de');
  });

  test('a regional tag counts as its base language, in any case', () => {
    expect(pickLocale(['de-CH'])).toBe('de');
    expect(pickLocale(['EN-us'])).toBe('en');
  });
});

describe('detectLocale', () => {
  test('the language chosen in the app wins over the OS language', () => {
    expect(detectLocale({type: 'chosen', locale: 'en'}, ['de-CH'])).toBe('en');
  });

  test('without a choice, the OS language decides', () => {
    expect(detectLocale({type: 'none'}, ['de-CH', 'en-US'])).toBe('de');
  });
});

test('isLocale knows the supported languages only', () => {
  expect(isLocale('de')).toBe(true);
  expect(isLocale('fr')).toBe(false);
});

test.each(LOCALES)('the %s catalog becomes active', (locale) => {
  activateLocale(locale);

  expect(i18n.locale).toBe(locale);
  expect(Object.keys(i18n.messages).length).toBeGreaterThan(0);
});

describe('catalogs', () => {
  test('there is one for every locale', () => {
    expect(Object.keys(poFiles).sort()).toEqual(LOCALES.map((locale) => `../locales/${locale}/messages.po`).sort());
  });

  test.each(Object.entries(poFiles))('%s has no msgid twice', async (_file, load) => {
    const ids = Array.from((await load()).matchAll(/^msgid "(.+)"$/gm), ([, id]) => id);

    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  test.each(LOCALES.filter((locale) => locale !== 'en'))('%s has a translation for every text', async (locale) => {
    const load = poFiles[`../locales/${locale}/messages.po`];
    const po = load ? await load() : '';
    // a msgid followed by an empty msgstr; a multi-line msgstr starts with "" and goes on in the next line
    const missing = Array.from(po.matchAll(/^msgid (".*"\r?\n)+msgstr ""\r?\n(?!")/gm), ([entry]) => entry);

    expect(missing).toEqual([]);
  });

  // the .po as written, so the branches of a plural are checked too
  test('no ß in German: Swiss High German writes ss', async () => {
    const load = poFiles['../locales/de/messages.po'];

    expect(load ? await load() : '').not.toContain('ß');
  });
});
