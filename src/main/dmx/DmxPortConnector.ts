import type {SerialPortDescription} from '@shared/ipc';

/** An open port to a DMX widget. */
export interface DmxConnection {
  readonly path: string;

  /** resolves once the packet is handed to the OS driver; rejects if the port fails */
  write: (packet: Uint8Array) => Promise<void>;

  /** never rejects: a port that can't be closed cleanly is gone anyway */
  close: () => Promise<void>;

  /** called when the port goes away without close(), e.g. the widget was unplugged */
  onUnexpectedClose: (listener: () => void) => void;
}

/** Finds and opens the ports a DMX widget can be on. Implemented per provider in impl/. */
export interface DmxPortConnector {
  listPorts: () => Promise<readonly SerialPortDescription[]>;

  /** rejects if the port can't be opened */
  open: (path: string) => Promise<DmxConnection>;
}
