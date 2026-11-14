import {isProjectFilePath} from '@shared/projects';

/**
 * The .glp files macOS asks the app to open (`open-file`), held until the project session can take them. A
 * double-click on a .glp starts the app with an `open-file` event before `ready`, in place of the argument Windows
 * passes; while the app runs, every double-click sends another one.
 */
export interface OpenFileRequests {
  /** a file macOS asks to open; anything that is no .glp is ignored, as on the command line */
  received(path: string): void;
  /** the file to start with, once: only one project can be open, so of several the last one wins */
  takeStartPath(): string | undefined;
  /** from now on each file is opened right away, the ones that came after the start first, in order */
  forwardTo(open: (path: string) => void): void;
}

type Phase =
  | {type: 'beforeStart'; startPath?: string}
  | {type: 'queueing'; queued: string[]}
  | {type: 'forwarding'; open: (path: string) => void};

export function openFileRequestsFactory(): OpenFileRequests {
  let phase: Phase = {type: 'beforeStart'};

  return {
    received(path) {
      if (!isProjectFilePath(path)) {
        return;
      }
      switch (phase.type) {
        case 'beforeStart':
          phase = {type: 'beforeStart', startPath: path};
          return;
        case 'queueing':
          phase.queued.push(path);
          return;
        case 'forwarding':
          phase.open(path);
      }
    },

    takeStartPath() {
      if (phase.type !== 'beforeStart') {
        return undefined;
      }
      const {startPath} = phase;
      phase = {type: 'queueing', queued: []};
      return startPath;
    },

    forwardTo(open) {
      const queued = phase.type === 'queueing' ? phase.queued : [];
      phase = {type: 'forwarding', open};
      queued.forEach(open);
    }
  };
}
