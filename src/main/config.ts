/**
 * The only module reading environment variables; everything else gets the configuration passed in.
 */
export interface MainConfig {
  /** GLUEHWUERMLI_SIMULATED_OUTPUT=1: one simulated port instead of the real serial ports, to work without a widget */
  simulatedOutput: boolean;
  debug: boolean;
}

export const loadMainConfig = (env: NodeJS.ProcessEnv, isPackaged: boolean): MainConfig => ({
  simulatedOutput: env['GLUEHWUERMLI_SIMULATED_OUTPUT'] === '1',
  debug: !isPackaged
});
