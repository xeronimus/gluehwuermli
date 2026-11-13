import {PAGE_LOCALES, publishedUrlOf, relativeLink} from './pageLocales';

const [english, german] = PAGE_LOCALES;

test('the pages link each other relatively, so the build also works served from any folder', () => {
  expect(relativeLink(english, german)).toBe('./de/');
  expect(relativeLink(german, english)).toBe('../');
  expect(relativeLink(german, german)).toBe('../de/');
});

test('English is published at the root, German in de/', () => {
  expect(publishedUrlOf(english)).toBe('https://xeronimus.github.io/gluehwuermli/');
  expect(publishedUrlOf(german)).toBe('https://xeronimus.github.io/gluehwuermli/de/');
});
