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
  /** renderer -> main, request/response (ipcRenderer.invoke) */
  LIST_PORTS: 'dmx:list-ports',
  CONNECT: 'dmx:connect',
  DISCONNECT: 'dmx:disconnect',
  GET_STATUS: 'dmx:get-status',
  GET_REMEMBERED_PORT: 'dmx:get-remembered-port',
  LOAD_FIXTURES: 'fixtures:load',
  SAVE_FIXTURES: 'fixtures:save',
  GET_DATA_FOLDER: 'app:get-data-folder',
  OPEN_DATA_FOLDER: 'app:open-data-folder',
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
  /** main -> renderer, whenever the mode or the channel lock changes */
  LOCK_CHANGED: 'app:lock-changed'
} as const;
