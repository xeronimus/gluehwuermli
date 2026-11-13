import {PAGE_URL} from './pageLinks';

/** the languages of the page: English at the root, German in de/; the switch on every page lists them in this order */
export const PAGE_LOCALES = [
  {locale: 'en', folder: '', label: 'English'},
  {locale: 'de', folder: 'de', label: 'Deutsch'}
] as const;

export type PageLocale = (typeof PAGE_LOCALES)[number];

const folderPathOf = (page: PageLocale): string => (page.folder === '' ? '' : `${page.folder}/`);

/** from a page's folder back to the root, where the stylesheet, the images and the English page are */
export const rootPathOf = (page: PageLocale): string => (page.folder === '' ? './' : '../');

/** a link from the page `from` to the page `to`, relative, so the build works opened from disk too */
export const relativeLink = (from: PageLocale, to: PageLocale): string => `${rootPathOf(from)}${folderPathOf(to)}`;

/** where the page is published, for the canonical and the alternate links */
export const publishedUrlOf = (page: PageLocale): string => `${PAGE_URL}${folderPathOf(page)}`;
