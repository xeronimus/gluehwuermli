import {lingui} from '@lingui/vite-plugin';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'electron-vite';
import {resolve} from 'node:path';

import {linguiMacroPlugin} from './lingui-macro-plugin.mts';

// `@/` points into the source root of each process, `@shared/` to the code all of them use, `@resources/` to the images
const sharedAlias = {'@shared': resolve('src/shared')};
const resourcesAlias = {'@resources': resolve('src/resources')};

export default defineConfig({
  main: {
    resolve: {alias: {...sharedAlias, '@': resolve('src/main')}}
  },
  preload: {
    resolve: {alias: sharedAlias}
  },
  renderer: {
    // the Lingui macro and catalogs only in the renderer: main and shared return codes, the renderer translates them
    plugins: [react(), linguiMacroPlugin(), vanillaExtractPlugin(), lingui()],
    resolve: {alias: {...sharedAlias, ...resourcesAlias, '@': resolve('src/renderer/src')}}
  }
});
