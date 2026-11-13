import {LANDING_PAGE_URL, REPOSITORY_URL, isOpenableExternalUrl} from './links';

describe('isOpenableExternalUrl', () => {
  test.each([
    REPOSITORY_URL,
    LANDING_PAGE_URL,
    'HTTPS://GITHUB.COM/xeronimus/gluehwuermli',
    'https://www.example.com/manual.pdf#page=4',
    'http://192.168.1.20/setup'
  ])('opens %s', (url) => {
    expect(isOpenableExternalUrl(url)).toBe(true);
  });

  test.each([
    'file:///C:/Windows/System32/cmd.exe',
    'javascript:alert(1)',
    'mailto:a@b.c',
    'ms-settings:',
    '/foo',
    'foo.pdf',
    '#dip',
    'not a url',
    ''
  ])('refuses %s', (url) => {
    expect(isOpenableExternalUrl(url)).toBe(false);
  });
});
