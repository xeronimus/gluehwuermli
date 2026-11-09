import type {
  ChannelsChanged,
  DmxOutputStatus,
  RememberedPort,
  SerialPortDescription,
  SetChannelRequest
} from '@shared/ipc';

/** The renderer's access to the DMX output, in the main process. */
export default interface DmxService {
  /** fire-and-forget: the main process sends the universe on its next tick */
  setChannel: (channel: number, value: number) => void;
  /** fire-and-forget, one message for all of them */
  setChannelValues: (values: readonly SetChannelRequest[]) => void;
  /** fire-and-forget: every channel to 0 (Emergency off) */
  blackout: () => void;
  listPorts: () => Promise<readonly SerialPortDescription[]>;
  connect: (path: string) => Promise<DmxOutputStatus>;
  disconnect: () => Promise<DmxOutputStatus>;
  getStatus: () => Promise<DmxOutputStatus>;
  /** the port the output was last connected to, to preselect it */
  getRememberedPort: () => Promise<RememberedPort>;
  /** every channel's value as main holds it (after the caps), index 0 is channel 1; rejects for an invalid answer */
  getChannelValues: () => Promise<readonly number[]>;
  /** returns the function that removes the listener again */
  onStatusChanged: (listener: (status: DmxOutputStatus) => void) => () => void;
  /** values main set on its own (a chase step), after the caps; returns the function that removes the listener again */
  onChannelsChanged: (listener: (change: ChannelsChanged) => void) => () => void;
}
