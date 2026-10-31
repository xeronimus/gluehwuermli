import {REPOSITORY_URL} from '@shared/links';

import {type GuardedWebContents, guardExternalLinks, isAllowedExternalUrl} from './externalLinks';

describe('isAllowedExternalUrl', () => {
  test('allows the repository', () => {
    expect(isAllowedExternalUrl(REPOSITORY_URL)).toBe(true);
    expect(isAllowedExternalUrl('HTTPS://GITHUB.COM/xeronimus/gluehwuermli')).toBe(true);
  });

  test.each([
    'https://github.com/xeronimus/gluehwuermli/issues',
    'https://github.com/xeronimus',
    'http://github.com/xeronimus/gluehwuermli',
    'https://github.com.example.com/xeronimus/gluehwuermli',
    'https://example.com/?next=https://github.com/xeronimus/gluehwuermli',
    'file:///C:/Windows/System32/cmd.exe',
    'not a url',
    ''
  ])('refuses %s', (url) => {
    expect(isAllowedExternalUrl(url)).toBe(false);
  });
});

describe('guardExternalLinks', () => {
  type NavigateListener = (event: {url: string; preventDefault: () => void}) => void;

  let opened: string[];
  let warnings: unknown[][];
  let windowOpenHandler: (details: {url: string}) => {action: 'deny'};
  let navigateListener: NavigateListener;

  const log = {warn: (...message: unknown[]) => warnings.push(message)};

  const contents: GuardedWebContents = {
    setWindowOpenHandler: (handler) => {
      windowOpenHandler = handler;
    },
    on: (_event: 'will-navigate', listener: NavigateListener) => {
      navigateListener = listener;
    }
  };

  /** whether the guard prevented the navigation */
  const navigate = (url: string) => {
    let prevented = false;
    navigateListener({
      url,
      preventDefault: () => {
        prevented = true;
      }
    });
    return prevented;
  };

  beforeEach(() => {
    opened = [];
    warnings = [];
    const openExternal = async (url: string) => {
      opened.push(url);
    };
    guardExternalLinks(contents, openExternal, log);
  });

  test('a new window is always denied, the repository opens in the browser instead', () => {
    expect(windowOpenHandler({url: REPOSITORY_URL})).toEqual({action: 'deny'});
    expect(opened).toEqual([REPOSITORY_URL]);
  });

  test('a new window for any other page is denied and opens nothing', () => {
    expect(windowOpenHandler({url: 'https://example.com'})).toEqual({action: 'deny'});
    expect(opened).toEqual([]);
    expect(warnings).toHaveLength(1);
  });

  test('navigating away is always prevented, the repository opens in the browser instead', () => {
    expect(navigate(REPOSITORY_URL)).toBe(true);
    expect(opened).toEqual([REPOSITORY_URL]);
  });

  test('navigating to any other page is prevented and opens nothing', () => {
    expect(navigate('https://example.com')).toBe(true);
    expect(opened).toEqual([]);
  });

  test('a failing browser is logged, not thrown', async () => {
    guardExternalLinks(contents, () => Promise.reject(new Error('no browser')), log);

    windowOpenHandler({url: REPOSITORY_URL});
    await Promise.resolve();

    expect(warnings).toHaveLength(1);
  });
});
