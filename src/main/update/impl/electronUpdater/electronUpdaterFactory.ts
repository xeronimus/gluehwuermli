import {autoUpdater} from 'electron-updater';

import type {Updater} from '@/update/autoUpdate';

export interface ElectronUpdaterLog {
  info: (...message: unknown[]) => void;
  warn: (...message: unknown[]) => void;
  error: (...message: unknown[]) => void;
  debug: (...message: unknown[]) => void;
}

/**
 * electron-updater against the GitHub Releases named by `publish` in electron-builder.yml (packaged as
 * resources/app-update.yml). Only in an installed app: unpackaged, it has no app-update.yml to read.
 */
export function electronUpdaterFactory(log: ElectronUpdaterLog): Updater {
  autoUpdater.logger = log;
  return autoUpdater;
}
