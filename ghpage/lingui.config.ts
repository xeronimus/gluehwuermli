import {defineConfig} from '@lingui/cli';
import {formatter} from '@lingui/format-po';

// the app's catalogs, read only: the app's `pnpm test` extracts the page's texts into them too (its lingui.config.ts),
// so its check for a missing German text covers the page
export default defineConfig({
  locales: ['en', 'de'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/../src/renderer/src/locales/{locale}/messages',
      include: ['<rootDir>/src']
    }
  ],
  format: formatter({lineNumbers: false})
});
