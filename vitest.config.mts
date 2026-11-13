import {lingui} from '@lingui/vite-plugin';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import {resolve} from 'node:path';
import {defineConfig} from 'vitest/config';

import {linguiMacroPlugin} from './lingui-macro-plugin.mts';
import packageJson from './package.json' with {type: 'json'};

// the same aliases as electron.vite.config.ts, one project per process since `@/` differs between them
const sharedAlias = {'@shared': resolve('src/shared')};
const assetsAlias = {'@assets': resolve('src/assets')};
const appVersion = {__APP_VERSION__: JSON.stringify(packageJson.version)};

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // explicit, so Vitest doesn't suggest isolate: false: test files must not share module state
    isolate: true,
    projects: [
      {
        extends: true,
        resolve: {alias: {...sharedAlias, '@': resolve('src/main')}},
        test: {name: 'main', include: ['src/main/**/*.test.ts']}
      },
      {
        extends: true,
        resolve: {alias: sharedAlias},
        test: {name: 'shared', include: ['src/shared/**/*.test.ts', 'src/*.test.ts', 'ghpage/src/**/*.test.ts']}
      },
      {
        extends: true,
        plugins: [linguiMacroPlugin(), vanillaExtractPlugin(), lingui()],
        define: appVersion,
        resolve: {alias: {...sharedAlias, ...assetsAlias, '@': resolve('src/renderer/src')}},
        test: {name: 'renderer', include: ['src/renderer/src/**/*.test.{ts,tsx}']}
      }
    ]
  }
});
