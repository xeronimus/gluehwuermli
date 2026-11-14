import {SerialPort} from 'serialport';

import type {SerialPortDescription} from '@shared/ipc';

import type {DmxConnection, DmxPortConnector} from '@/dmx/DmxPortConnector';
import {isLikelyEnttecPro} from '@/dmx/portDetection';
import {calloutPortsOf} from '@/dmx/portPaths';

/**
 * 250000 8N2: the Enttec Pro ignores the port settings (a virtual COM port, USB is as fast as it is); the Eurolite
 * USB-DMX512 PRO speaks the same protocol through a real serial link and expects them
 */
const BAUD_RATE = 250000;
const STOP_BITS = 2;

const MACOS: NodeJS.Platform = 'darwin';

export interface SerialPortConnectorOptions {
  /** macOS lists each serial device twice (tty and cu), only the cu path is listed */
  platform: NodeJS.Platform;
}

type PortInfo = Awaited<ReturnType<typeof SerialPort.list>>[number];

const toPortDescription = (port: PortInfo): SerialPortDescription => ({
  path: port.path,
  manufacturer: port.manufacturer,
  likelyEnttecPro: isLikelyEnttecPro(port)
});

function connectionOf(port: SerialPort): DmxConnection {
  return {
    path: port.path,

    // drain: resolve only once the bytes left the Node buffer, so the engine never queues up packets
    write: (packet) =>
      new Promise((resolve, reject) => {
        port.write(Buffer.from(packet), (writeError) => {
          if (writeError) {
            reject(writeError);
            return;
          }
          port.drain((drainError) => (drainError ? reject(drainError) : resolve()));
        });
      }),

    close: () =>
      new Promise((resolve) => {
        if (!port.isOpen) {
          resolve();
          return;
        }
        port.close(() => resolve());
      }),

    // serialport passes an error to 'close' only when the port went away (err.disconnected)
    onUnexpectedClose: (listener) => {
      port.on('close', (error: Error | null) => {
        if (error) {
          listener();
        }
      });
    }
  };
}

/** the DmxPortConnector on top of the OS serial ports (node-serialport) */
export const serialPortConnectorFactory = ({platform}: SerialPortConnectorOptions): DmxPortConnector => ({
  listPorts: async () => {
    const ports = (await SerialPort.list()).map(toPortDescription);
    return platform === MACOS ? calloutPortsOf(ports) : ports;
  },

  open: (path) =>
    new Promise((resolve, reject) => {
      const port = new SerialPort({path, baudRate: BAUD_RATE, stopBits: STOP_BITS, autoOpen: false});
      port.open((error) => (error ? reject(error) : resolve(connectionOf(port))));
    })
});
