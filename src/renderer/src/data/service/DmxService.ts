import type {DmxOutputStatus, SerialPortDescription, SetChannelRequest} from '@shared/ipc';

/** The renderer's access to the DMX output, in the main process. */
export default interface DmxService {
  /** fire-and-forget: the main process sends the universe on its next tick */
  setChannel: (channel: number, value: number) => void;
  /** fire-and-forget, one message for all of them */
  setChannelValues: (values: readonly SetChannelRequest[]) => void;
  listPorts: () => Promise<readonly SerialPortDescription[]>;
  connect: (path: string) => Promise<DmxOutputStatus>;
  disconnect: () => Promise<DmxOutputStatus>;
  getStatus: () => Promise<DmxOutputStatus>;
  /** returns the function that removes the listener again */
  onStatusChanged: (listener: (status: DmxOutputStatus) => void) => () => void;
}
