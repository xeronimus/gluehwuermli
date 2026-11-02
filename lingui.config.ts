import {defineConfig} from '@lingui/cli';
import {formatter} from '@lingui/format-po';

// the English texts in the code are the message ids; only the renderer is translated
export default defineConfig({
  locales: ['en', 'de'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/src/renderer/src/locales/{locale}/messages',
      include: ['<rootDir>/src/renderer/src']
    }
  ],
  format: formatter({lineNumbers: false})
});
