import log from 'loglevel';

/** the main process logs to the terminal electron-vite runs in */
export const configureLog = (debug: boolean): void => log.setLevel(debug ? 'debug' : 'warn');

export default log;
