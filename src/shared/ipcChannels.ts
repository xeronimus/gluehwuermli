/**
 * The IPC channels between the renderer (through the preload script) and the main process. Every payload crossing
 * them has its schema in ipc.ts; the main process checks what it receives, the renderer is not trusted.
 * Kept apart from the schemas so the preload script doesn't bundle TypeBox.
 */
export const IpcChannel = {
  /** renderer -> main, fire-and-forget (ipcRenderer.send): the hot path of every fader move */
  SET_CHANNEL: 'dmx:set-channel',
  /** renderer -> main, fire-and-forget: several channels in one message, e.g. a preset */
  SET_CHANNEL_VALUES: 'dmx:set-channel-values',
  /** renderer -> main, fire-and-forget, no payload: Emergency off, every channel to 0; allowed in Show mode too */
  BLACKOUT: 'dmx:blackout',
  /** renderer -> main, request/response (ipcRenderer.invoke) */
  LIST_PORTS: 'dmx:list-ports',
  CONNECT: 'dmx:connect',
  DISCONNECT: 'dmx:disconnect',
  GET_STATUS: 'dmx:get-status',
  GET_REMEMBERED_PORT: 'dmx:get-remembered-port',
  GET_PROJECT_STATUS: 'project:get-status',
  /** Setup mode only: a save dialog for the new file, then opens the empty project */
  CREATE_PROJECT: 'project:create',
  /** an open dialog; allowed in Show mode too */
  OPEN_PROJECT: 'project:open',
  OPEN_RECENT_PROJECT: 'project:open-recent',
  LIST_RECENT_PROJECTS: 'project:list-recent',
  REMOVE_RECENT_PROJECT: 'project:remove-recent',
  SAVE_FIXTURES: 'project:save-fixtures',
  GET_DATA_FOLDER: 'app:get-data-folder',
  OPEN_DATA_FOLDER: 'app:open-data-folder',
  GET_LOCALE: 'app:get-locale',
  SET_LOCALE: 'app:set-locale',
  GET_BLACKOUT_ON_QUIT: 'app:get-blackout-on-quit',
  SET_BLACKOUT_ON_QUIT: 'app:set-blackout-on-quit',
  GET_CHASE_STATUS: 'chase:get-status',
  /** start, pause, resume and stop are allowed in Show mode too; start replaces a chase already running */
  START_CHASE: 'chase:start',
  PAUSE_CHASE: 'chase:pause',
  RESUME_CHASE: 'chase:resume',
  STOP_CHASE: 'chase:stop',
  GET_LOCK_STATUS: 'app:get-lock-status',
  UNLOCK: 'app:unlock',
  LOCK: 'app:lock',
  LIFT_CHANNEL_LOCK: 'app:lift-channel-lock',
  LOCK_CHANNELS: 'app:lock-channels',
  CHANGE_PASSWORD: 'app:change-password',
  /** renderer -> main, fire-and-forget: the user did something in Setup mode, so it isn't locked for being idle */
  USER_ACTIVITY: 'app:user-activity',
  /** main -> renderer, whenever the output status changes */
  STATUS_CHANGED: 'dmx:status-changed',
  /** main -> renderer, on every step of a chase and on start, pause, resume, stop and finish */
  CHASE_STATUS_CHANGED: 'chase:status-changed',
  /** main -> renderer, the values a chase step set (after the caps), one message per step */
  CHANNELS_CHANGED: 'dmx:channels-changed',
  /** main -> renderer, whenever the mode or the channel lock changes */
  LOCK_CHANGED: 'app:lock-changed',
  /** main -> renderer, whenever another project was opened (the output was blacked out) */
  PROJECT_CHANGED: 'project:changed',
  /** main -> renderer, a .glp was double-clicked while the app runs: the renderer asks about a draft, then opens it */
  PROJECT_OPEN_REQUESTED: 'project:open-requested'
} as const;
