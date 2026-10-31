import {REPOSITORY_URL} from '@shared/links';

/** the pages the app may open in the system browser; anything else a link or a script asks for is refused */
const ALLOWED_EXTERNAL_URLS: readonly string[] = [REPOSITORY_URL];

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

const normalized = (url: string) => (URL.canParse(url) ? new URL(url).href : undefined);

export const isAllowedExternalUrl = (url: string): boolean => {
  const href = normalized(url);
  return href !== undefined && ALLOWED_EXTERNAL_URLS.some((allowed) => normalized(allowed) === href);
};

/**
 * The window never leaves the app and never opens another one: a link (with or without target="_blank") opens in the
 * system browser if it is allow-listed, anything else is refused. A page from the web would get the DMX bridge.
 */
export function guardExternalLinks(
  contents: GuardedWebContents,
  openExternal: OpenExternal,
  log: ExternalLinksLog
): void {
  const openIfAllowed = (url: string) => {
    if (!isAllowedExternalUrl(url)) {
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
