/** the part of electron-updater's AppUpdater the auto-update uses */
export interface Updater {
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  checkForUpdates: () => Promise<unknown>;
}

export interface AutoUpdateLog {
  warn: (...message: unknown[]) => void;
}

export interface AutoUpdate {
  /** looks for a newer release once; a newer one is downloaded in the background and installed when the app quits */
  check: () => Promise<void>;
}

export interface AutoUpdateDependencies {
  updater: Updater;
  log: AutoUpdateLog;
}

/**
 * Updates from the GitHub Releases without ever interrupting a show: no prompt, no restart. The installer only runs
 * once the app quits, after the quit guard closed the DMX port (src/main/quit/quitGuard.ts), so the output never
 * notices a download or an update. Offline or a failed download only costs a warning; the next start tries again.
 */
export function autoUpdateFactory({updater, log}: AutoUpdateDependencies): AutoUpdate {
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;

  return {
    check: async () => {
      try {
        await updater.checkForUpdates();
      } catch (error) {
        log.warn('checking for an update failed', error);
      }
    }
  };
}

/** an unpackaged app (`pnpm dev`, `pnpm start`): nothing to update */
export const disabledAutoUpdate: AutoUpdate = {check: async () => {}};
