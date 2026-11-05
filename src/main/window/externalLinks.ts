import {isOpenableExternalUrl} from '@shared/links';

/** Electron's shell.openExternal */
export type OpenExternal = (url: string) => Promise<void>;

/** the part of Electron's WebContents that is guarded, so it can be tested without Electron */
export interface GuardedWebContents {
  setWindowOpenHandler: (handler: (details: {url: string}) => {action: 'deny'}) => void;
  on(event: 'will-navigate', listener: (event: {url: string; preventDefault: () => void}) => void): void;
}

/** the URL without its query and fragment */
const pageOf = (url: URL): string => `${url.origin === 'null' ? url.protocol : url.origin}${url.pathname}`;

/**
 * whether `url` is the app's own page, e.g. the dev server's full reload after a change it can't hot-swap: any page of
 * the dev server (its origin), or the very same file in a build (a file: URL has no origin to compare)
 */
export function isAppPage(url: string, appPageUrl: string): boolean {
  if (!URL.canParse(url)) {
    return false;
  }
  const target = new URL(url);
  const app = new URL(appPageUrl);
  return app.origin === 'null' ? pageOf(target) === pageOf(app) : target.origin === app.origin;
}

export interface ExternalLinksLog {
  warn: (...message: unknown[]) => void;
}

/**
 * The window never leaves the app and never opens another one: a link (with or without target="_blank") opens in the
 * system browser if it is a web page, anything else is refused. A page from the web inside the window would get the
 * DMX bridge, and a file: or custom scheme could start a program. Loading the app's own page again (`appPageUrl`) is
 * no leaving: the dev server reloads the window that way.
 */
export function guardExternalLinks(
  contents: GuardedWebContents,
  appPageUrl: string,
  openExternal: OpenExternal,
  log: ExternalLinksLog
): void {
  const openIfAllowed = (url: string) => {
    if (!isOpenableExternalUrl(url)) {
      log.warn('refused to open', url);
      return;
    }
    openExternal(url).catch((error: unknown) => log.warn(`opening ${url} in the browser failed`, error));
  };

  contents.setWindowOpenHandler(({url}) => {
    openIfAllowed(url);
    return {action: 'deny'};
  });

  // the dev server's full reload (e.g. after a changed .po catalog) arrives here, too: it stays in the window
  contents.on('will-navigate', (event) => {
    if (isAppPage(event.url, appPageUrl)) {
      return;
    }
    event.preventDefault();
    openIfAllowed(event.url);
  });
}
