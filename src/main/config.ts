/**
 * The only module reading the environment; everything else gets the configuration passed in.
 *
 * electron-vite loads `.env`, `.env.local`, `.env.[mode]` and `.env.[mode].local` at build time and passes the
 * variables prefixed `MAIN_VITE_` to the main process as `import.meta.env` (`.env.sample` lists them). Variables set
 * in the shell with that prefix work, too. They are compiled in: `pnpm dev` runs in the `development` mode,
 * `pnpm build`/`pnpm dist` in `production`, so a `.env.development.local` never reaches an installer.
 */
export interface MainEnv {
  /** "1": one simulated port instead of the real serial ports, to work without a widget */
  readonly MAIN_VITE_SIMULATED_OUTPUT?: string;
}

export interface MainConfig {
  simulatedOutput: boolean;
  debug: boolean;
}

const ENABLED = '1';

export const mainConfigOf = (env: MainEnv, isPackaged: boolean): MainConfig => ({
  simulatedOutput: env.MAIN_VITE_SIMULATED_OUTPUT === ENABLED,
  debug: !isPackaged
});

export const loadMainConfig = (isPackaged: boolean): MainConfig => mainConfigOf(import.meta.env, isPackaged);
