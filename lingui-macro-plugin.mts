import {transformAsync} from '@babel/core';
import type {Plugin} from 'vite';

const SOURCE_FILE_PATTERN = /\.[jt]sx?$/;

/**
 * Runs @lingui/babel-plugin-lingui-macro on the renderer's source files (as in tinytrend). @vitejs/plugin-react 6
 * compiles with OXC instead of Babel, so the macro can't go into `react({babel: …})` any more; this plugin runs only
 * the macro's transform step.
 */
export function linguiMacroPlugin(): Plugin {
  return {
    name: 'lingui-macro',
    enforce: 'pre',
    async transform(code, id) {
      if (!SOURCE_FILE_PATTERN.test(id) || id.includes('node_modules') || !code.includes('@lingui/')) {
        return undefined;
      }
      const result = await transformAsync(code, {
        filename: id,
        presets: ['@babel/preset-typescript'],
        plugins: ['@babel/plugin-syntax-jsx', '@lingui/babel-plugin-lingui-macro'],
        sourceMaps: true,
        retainLines: true
      });
      if (!result?.code) {
        return undefined;
      }
      // as JSON: Babel 8 types the map with readonly arrays, which Rollup's map type doesn't accept
      return {code: result.code, map: result.map ? JSON.stringify(result.map) : undefined};
    }
  };
}
