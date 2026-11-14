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
  /** the terminal's log level, one of LOG_LEVELS; "debug" shows every universe sent */
  readonly MAIN_VITE_LOG_LEVEL?: string;
}

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/** the events (lock, mode, project, port, chase), without a line per universe sent */
const DEFAULT_LOG_LEVEL: LogLevel = 'info';

export interface MainConfig {
  simulatedOutput: boolean;
  /** of the terminal */
  logLevel: LogLevel;
  /** only an installed app writes a log file: unpackaged, the terminal shows it all */
  logToFile: boolean;
  /** only an installed app updates itself: unpackaged, there is no app-update.yml and nothing to replace */
  autoUpdate: boolean;
}

const ENABLED = '1';

const isLogLevel = (value: string | undefined): value is LogLevel => LOG_LEVELS.some((level) => level === value);

/** an unknown level falls back to the default rather than silencing the log */
const logLevelOf = (value: string | undefined): LogLevel => (isLogLevel(value) ? value : DEFAULT_LOG_LEVEL);

export const mainConfigOf = (env: MainEnv, isPackaged: boolean): MainConfig => ({
  simulatedOutput: env.MAIN_VITE_SIMULATED_OUTPUT === ENABLED,
  logLevel: logLevelOf(env.MAIN_VITE_LOG_LEVEL),
  logToFile: isPackaged,
  autoUpdate: isPackaged
});

export const loadMainConfig = (isPackaged: boolean): MainConfig => mainConfigOf(import.meta.env, isPackaged);
