/**
 * The IPC channels between the renderer (through the preload script) and the main process. Every payload crossing
 * them has its schema in ipc.ts; the main process checks what it receives, the renderer is not trusted.
 * Kept apart from the schemas so the preload script doesn't bundle TypeBox.
 */
export const IpcChannel = {
  /** renderer -> main, fire-and-forget (ipcRenderer.send): the hot path of every fader move */
  SET_CHANNEL: 'dmx:set-channel',
  /** renderer -> main, request/response (ipcRenderer.invoke) */
  LIST_PORTS: 'dmx:list-ports',
  CONNECT: 'dmx:connect',
  DISCONNECT: 'dmx:disconnect',
  GET_STATUS: 'dmx:get-status',
  /** main -> renderer, whenever the output status changes */
  STATUS_CHANGED: 'dmx:status-changed'
} as const;
