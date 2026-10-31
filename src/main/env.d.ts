import type {MainEnv} from './config';

/** the `MAIN_VITE_` variables electron-vite compiles into the main process (config.ts) */
declare global {
  interface ImportMetaEnv extends MainEnv {}

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
