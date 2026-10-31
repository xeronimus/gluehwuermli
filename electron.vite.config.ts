import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'electron-vite';
import {resolve} from 'node:path';

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
    plugins: [react(), vanillaExtractPlugin()],
    resolve: {alias: {...sharedAlias, ...resourcesAlias, '@': resolve('src/renderer/src')}}
  }
});
