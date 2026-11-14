export interface QuitGuardLog {
  warn: (...message: unknown[]) => void;
}

/** the part of Electron's will-quit event the guard needs */
export interface QuitEvent {
  preventDefault: () => void;
}

export interface QuitGuardDependencies {
  /** what has to finish before the app quits, e.g. closing the DMX port */
  shutdown: () => Promise<void>;
  /** quits for real (app.quit); the guard lets that second quit through */
  quit: () => void;
  /** a shutdown that takes longer is given up on, so a hanging port can't keep the app from quitting */
  timeoutMs: number;
  log: QuitGuardLog;
}

type QuitState = 'running' | 'shuttingDown' | 'done';

/**
 * The will-quit handler: Electron doesn't wait for async work there, so the first quit is held, the shutdown runs
 * (with a timeout) and then the app quits again. Further quits while it shuts down are held, too, without a second
 * shutdown.
 */
export function quitGuardFactory({shutdown, quit, timeoutMs, log}: QuitGuardDependencies): (event: QuitEvent) => void {
  let state: QuitState = 'running';

  const shutDownWithin = async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), timeoutMs);
    });
    try {
      const outcome = await Promise.race([shutdown().then(() => 'done' as const), timedOut]);
      if (outcome === 'timeout') {
        log.warn(`shutting down took longer than ${timeoutMs} ms, quitting anyway`);
      }
    } catch (error) {
      log.warn('shutting down failed, quitting anyway', error);
    } finally {
      clearTimeout(timer);
    }
  };

  const shutDownAndQuit = async () => {
    await shutDownWithin();
    state = 'done';
    // never while Electron still handles the held will-quit: a shutdown with nothing to close resolves in microtasks,
    // which run before Electron marks the quit as cancelled, and Electron ignores a quit while one is in progress
    setTimeout(quit, 0);
  };

  return (event) => {
    if (state === 'done') {
      return;
    }
    event.preventDefault();
    if (state === 'running') {
      state = 'shuttingDown';
      void shutDownAndQuit();
    }
  };
}
