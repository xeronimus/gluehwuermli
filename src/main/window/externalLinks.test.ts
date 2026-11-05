import {REPOSITORY_URL} from '@shared/links';

import {type GuardedWebContents, guardExternalLinks, isAppPage} from './externalLinks';

const DEV_SERVER_URL = 'http://localhost:5173/';
const BUILT_PAGE_URL = 'file:///C:/Program%20Files/Gluehwuermli/resources/app.asar/out/renderer/index.html';

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
    guardExternalLinks(contents, DEV_SERVER_URL, openExternal, log);
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

  test("the dev server's full reload stays in the window and opens nothing", () => {
    expect(navigate(DEV_SERVER_URL)).toBe(false);
    expect(opened).toEqual([]);
  });

  test('another local web server is no app page: it opens in the browser', () => {
    expect(navigate('http://localhost:8080/')).toBe(true);
    expect(opened).toEqual(['http://localhost:8080/']);
  });

  test('a failing browser is logged, not thrown', async () => {
    guardExternalLinks(contents, DEV_SERVER_URL, () => Promise.reject(new Error('no browser')), log);

    windowOpenHandler({url: REPOSITORY_URL});
    await Promise.resolve();

    expect(warnings).toHaveLength(1);
  });
});

describe('isAppPage', () => {
  test('in development, any page of the dev server', () => {
    expect(isAppPage(DEV_SERVER_URL, DEV_SERVER_URL)).toBe(true);
    expect(isAppPage('http://localhost:5173/index.html?t=1#top', DEV_SERVER_URL)).toBe(true);
    expect(isAppPage('http://localhost:5174/', DEV_SERVER_URL)).toBe(false);
    expect(isAppPage('https://localhost:5173/', DEV_SERVER_URL)).toBe(false);
  });

  test('in a build, only the very same file', () => {
    expect(isAppPage(BUILT_PAGE_URL, BUILT_PAGE_URL)).toBe(true);
    expect(isAppPage(`${BUILT_PAGE_URL}#top`, BUILT_PAGE_URL)).toBe(true);
    expect(isAppPage('file:///C:/Windows/System32/calc.exe', BUILT_PAGE_URL)).toBe(false);
    expect(isAppPage(DEV_SERVER_URL, BUILT_PAGE_URL)).toBe(false);
  });

  test('not something that is no URL', () => {
    expect(isAppPage('not a url', DEV_SERVER_URL)).toBe(false);
  });
});
