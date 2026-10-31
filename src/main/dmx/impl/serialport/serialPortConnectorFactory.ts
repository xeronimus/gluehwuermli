import {SerialPort} from 'serialport';

import type {SerialPortDescription} from '@shared/ipc';

import type {DmxConnection, DmxPortConnector} from '@/dmx/DmxPortConnector';
import {isLikelyEnttecPro} from '@/dmx/portDetection';

/** ignored by the Pro's virtual COM port (USB is as fast as it is), but serialport needs one */
const BAUD_RATE = 57600;

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
export const serialPortConnectorFactory = (): DmxPortConnector => ({
  listPorts: async () => (await SerialPort.list()).map(toPortDescription),

  open: (path) =>
    new Promise((resolve, reject) => {
      const port = new SerialPort({path, baudRate: BAUD_RATE, autoOpen: false});
      port.open((error) => (error ? reject(error) : resolve(connectionOf(port))));
    })
});
