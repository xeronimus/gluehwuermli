import type {MessageDescriptor} from '@lingui/core';

import type {DmxOutputStatus, SerialPortDescription} from '@shared/ipc';

export interface OutputState {
  /** mirrors the main process's status (useOutputStatusSubscription) */
  outputStatus: DmxOutputStatus;
  availablePorts: readonly SerialPortDescription[];
  /** the port shown in the select: the one chosen by hand, otherwise the preselected one (preferredPortPath) */
  selectedPortPath: string | undefined;
  /** the port last chosen by hand, kept while it is unplugged; a preselection is never one */
  chosenPortPath: string | undefined;

  /** a failure talking to the main process, not one of the port (that one is in outputStatus) */
  outputError: MessageDescriptor | undefined;
}

export const getDefaultOutputState = (): OutputState => ({
  outputStatus: {type: 'disconnected'},
  availablePorts: [],
  selectedPortPath: undefined,
  chosenPortPath: undefined,
  outputError: undefined
});
