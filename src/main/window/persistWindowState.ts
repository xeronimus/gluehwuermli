import type {WindowStateStore} from './WindowStateStore';
import type {Rectangle, WindowState} from './windowState';

/** the part of Electron's BrowserWindow that is tracked, so it can be tested without Electron */
export interface TrackedWindow {
  on(
    event: 'resize' | 'move' | 'maximize' | 'unmaximize' | 'enter-full-screen' | 'leave-full-screen',
    listener: () => void
  ): void;
  on(event: 'close', listener: (event: {preventDefault: () => void}) => void): void;
  getNormalBounds: () => Rectangle;
  isMaximized: () => boolean;
  isFullScreen: () => boolean;
  destroy: () => void;
}

export interface PersistWindowStateLog {
  warn: (...message: unknown[]) => void;
}

/** a drag or resize fires these events continuously; save once it settled */
export const WINDOW_STATE_SAVE_DELAY_MS = 500;

const CHANGE_EVENTS = ['resize', 'move', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen'] as const;

const windowStateOf = (window: TrackedWindow): WindowState => ({
  ...window.getNormalBounds(),
  maximized: window.isMaximized(),
  fullScreen: window.isFullScreen()
});

/**
 * Saves the window's state shortly after it was moved or resized, so a crash keeps the last state, and when it closes.
 * Closing waits for that save: the app quits once the last window is gone, which wouldn't wait for the file.
 */
export function persistWindowState(window: TrackedWindow, store: WindowStateStore, log: PersistWindowStateLog): void {
  let pendingSave: ReturnType<typeof setTimeout> | undefined;
  let closing = false;

  const save = () =>
    store.save(windowStateOf(window)).catch((error: unknown) => log.warn('saving the window state failed', error));

  const cancelPendingSave = () => {
    clearTimeout(pendingSave);
    pendingSave = undefined;
  };

  const scheduleSave = () => {
    cancelPendingSave();
    pendingSave = setTimeout(() => void save(), WINDOW_STATE_SAVE_DELAY_MS);
  };

  CHANGE_EVENTS.forEach((event) => window.on(event, scheduleSave));

  window.on('close', (event) => {
    event.preventDefault();
    if (closing) {
      return;
    }
    closing = true;
    cancelPendingSave();
    void save().finally(() => window.destroy());
  });
}
