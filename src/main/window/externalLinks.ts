import {isOpenableExternalUrl} from '@shared/links';

/** Electron's shell.openExternal */
export type OpenExternal = (url: string) => Promise<void>;

/** the part of Electron's WebContents that is guarded, so it can be tested without Electron */
export interface GuardedWebContents {
  setWindowOpenHandler: (handler: (details: {url: string}) => {action: 'deny'}) => void;
  on(event: 'will-navigate', listener: (event: {url: string; preventDefault: () => void}) => void): void;
}

export interface ExternalLinksLog {
  warn: (...message: unknown[]) => void;
}

/**
 * The window never leaves the app and never opens another one: a link (with or without target="_blank") opens in the
 * system browser if it is a web page, anything else is refused. A page from the web inside the window would get the
 * DMX bridge, and a file: or custom scheme could start a program.
 */
export function guardExternalLinks(
  contents: GuardedWebContents,
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

  // a reload (also the dev server's) is no navigation, so this refuses nothing the app needs itself
  contents.on('will-navigate', (event) => {
    event.preventDefault();
    openIfAllowed(event.url);
  });
}
