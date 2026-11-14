import log from 'electron-log/main';

import type {LogLevel} from './config';

/** what an installed app writes to its log file, so there is something to look at after a show */
const FILE_LOG_LEVEL: LogLevel = 'info';

export interface LogOptions {
  /** of the terminal electron-vite runs in */
  consoleLevel: LogLevel;
  /** to userData/logs/main.log (electron-log's default), rotated at its `maxSize` into one main.old.log */
  logToFile: boolean;
}

export const configureLog = ({consoleLevel, logToFile}: LogOptions): void => {
  log.transports.console.level = consoleLevel;
  log.transports.file.level = logToFile ? FILE_LOG_LEVEL : false;
  // main's lines stay out of the renderer's DevTools: the universe at debug would flood them
  log.transports.ipc.level = false;
};

export default log;
