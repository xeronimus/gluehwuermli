import {REPOSITORY_URL} from '@shared/links';

import {type GuardedWebContents, guardExternalLinks} from './externalLinks';

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

  test('a new window for a web page is denied, the page opens in the browser instead', () => {
    expect(windowOpenHandler({url: 'https://example.com/'})).toEqual({action: 'deny'});
    expect(opened).toEqual(['https://example.com/']);
  });

  test('a new window for a local file is denied and opens nothing', () => {
    expect(windowOpenHandler({url: 'file:///C:/Windows'})).toEqual({action: 'deny'});
    expect(opened).toEqual([]);
    expect(warnings).toHaveLength(1);
  });

  test('navigating away is always prevented, the repository opens in the browser instead', () => {
    expect(navigate(REPOSITORY_URL)).toBe(true);
    expect(opened).toEqual([REPOSITORY_URL]);
  });

  test('navigating to a local file is prevented and opens nothing', () => {
    expect(navigate('file:///C:/Windows')).toBe(true);
    expect(opened).toEqual([]);
  });

  test('a failing browser is logged, not thrown', async () => {
    guardExternalLinks(contents, () => Promise.reject(new Error('no browser')), log);

    windowOpenHandler({url: REPOSITORY_URL});
    await Promise.resolve();

    expect(warnings).toHaveLength(1);
  });
});
