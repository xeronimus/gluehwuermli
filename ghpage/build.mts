import {cp, mkdir, rm, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'vite';

import viteConfig, {RENDER_OUT_DIR} from './vite.config.mts';

/**
 * Builds the landing page into ../ghpageOut: prerenders it once per language to plain HTML (English at the root,
 * every other language in its own folder) and copies the stylesheet and the images next to it. No JavaScript ships.
 */
const PAGE_DIR = import.meta.dirname;
const OUT_DIR = resolve(PAGE_DIR, '..', 'ghpageOut');
const APP_ASSETS_DIR = resolve(PAGE_DIR, '..', 'src', 'assets');
/** the README shows them too */
const SCREENSHOTS_DIR = resolve(PAGE_DIR, '..', 'doc', 'screenshots');

/** copied as they are; the page links them from assets/ */
const COPIED_FILES = [
  {from: resolve(PAGE_DIR, 'src', 'page.css'), to: 'assets/page.css'},
  {from: resolve(APP_ASSETS_DIR, 'gluehwuermli_mascot_600.png'), to: 'assets/mascot.png'},
  {from: resolve(APP_ASSETS_DIR, 'favicon', 'favicon.ico'), to: 'favicon.ico'},
  {from: resolve(APP_ASSETS_DIR, 'favicon', 'favicon-32x32.png'), to: 'assets/favicon-32x32.png'},
  {from: resolve(APP_ASSETS_DIR, 'favicon', 'apple-touch-icon.png'), to: 'assets/apple-touch-icon.png'},
  {from: SCREENSHOTS_DIR, to: 'assets/screenshots'}
];

interface PrerenderModule {
  PAGE_LOCALES: readonly {locale: string; folder: string}[];
  renderPage: (locale: string) => string;
}

await build({...viteConfig, configFile: false});
const prerender: PrerenderModule = await import(pathToFileURL(resolve(RENDER_OUT_DIR, 'renderPage.js')).href);

await rm(OUT_DIR, {recursive: true, force: true});
for (const {locale, folder} of prerender.PAGE_LOCALES) {
  const pageDir = resolve(OUT_DIR, folder);
  await mkdir(pageDir, {recursive: true});
  await writeFile(resolve(pageDir, 'index.html'), prerender.renderPage(locale));
}
for (const {from, to} of COPIED_FILES) {
  await cp(from, resolve(OUT_DIR, to), {recursive: true});
}
await rm(RENDER_OUT_DIR, {recursive: true, force: true});
console.log(`landing page built to ${OUT_DIR}`);
