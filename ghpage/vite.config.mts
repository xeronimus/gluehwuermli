import {lingui} from '@lingui/vite-plugin';
import {resolve} from 'node:path';
import {defineConfig} from 'vite';

import {linguiMacroPlugin} from './lingui-macro-plugin.mts';

/** where the prerender module goes; build.mts imports it from there and writes the pages */
export const RENDER_OUT_DIR = resolve(import.meta.dirname, '.render');

// A server-side build: React and Lingui stay external and resolve from ghpage/node_modules, also for the app's topic
// components outside this folder (dedupe), so the page and the topics share one React and one Lingui instance
export default defineConfig({
  root: import.meta.dirname,
  plugins: [linguiMacroPlugin(), lingui()],
  oxc: {jsx: {runtime: 'automatic'}},
  resolve: {dedupe: ['react', 'react-dom', '@lingui/core', '@lingui/react']},
  logLevel: 'warn',
  build: {
    ssr: resolve(import.meta.dirname, 'src/renderPage.tsx'),
    outDir: RENDER_OUT_DIR,
    emptyOutDir: true,
    target: 'node24'
  }
});
