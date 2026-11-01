/** the project on GitHub, linked from the Help view */
export const REPOSITORY_URL = 'https://github.com/xeronimus/gluehwuermli';

/** the schemes the app opens in the system browser; anything else (file:, javascript:, mailto:, custom ones) is refused */
const OPENABLE_PROTOCOLS: readonly string[] = ['http:', 'https:'];

/**
 * An absolute web page: the repo link and the links in fixture descriptions, which the user writes and may point
 * anywhere. Main opens only these; the renderer shows any other link as text, so nothing is clickable that main would
 * refuse (a relative link would otherwise be resolved against the app's own page first).
 */
export const isOpenableExternalUrl = (url: string): boolean =>
  URL.canParse(url) && OPENABLE_PROTOCOLS.includes(new URL(url).protocol);
