import type {DmxOutputStatus, SerialPortDescription} from '@shared/ipc';

export interface OutputState {
  /** mirrors the main process's status (useOutputStatusSubscription) */
  outputStatus: DmxOutputStatus;
  availablePorts: readonly SerialPortDescription[];
  selectedPortPath: string | undefined;

  /** a failure talking to the main process, not one of the port (that one is in outputStatus) */
  outputError: string | undefined;
}

export const getDefaultOutputState = (): OutputState => ({
  outputStatus: {type: 'disconnected'},
  availablePorts: [],
  selectedPortPath: undefined,
  outputError: undefined
});
