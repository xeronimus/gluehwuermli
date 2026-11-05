import {lingui} from '@lingui/vite-plugin';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'electron-vite';
import {resolve} from 'node:path';

import {linguiMacroPlugin} from './lingui-macro-plugin.mts';
import packageJson from './package.json' with {type: 'json'};

// `@/` points into the source root of each process, `@shared/` to the code all of them use, `@assets/` to the images
const sharedAlias = {'@shared': resolve('src/shared')};
const assetsAlias = {'@assets': resolve('src/assets')};
// the app version, shown in the renderer's bottom left corner (envConfig.version)
const appVersion = {__APP_VERSION__: JSON.stringify(packageJson.version)};

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
    define: appVersion,
    resolve: {alias: {...sharedAlias, ...assetsAlias, '@': resolve('src/renderer/src')}}
  }
});
