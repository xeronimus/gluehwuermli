import type {SerialPortDescription} from '@shared/ipc';

const DIAL_IN_PREFIX = '/dev/tty.';
const CALLOUT_PREFIX = '/dev/cu.';

const calloutPathOf = (path: string): string =>
  path.startsWith(DIAL_IN_PREFIX) ? `${CALLOUT_PREFIX}${path.slice(DIAL_IN_PREFIX.length)}` : path;

/**
 * macOS lists every serial device twice: /dev/tty.X waits for carrier detect on open, /dev/cu.X is the one meant for
 * outgoing connections. Each device is listed once, by its cu path, so the remembered port (stored by path) stays
 * the same whichever entry the OS reported. Both entries are the same device with the same USB ids, so keeping the
 * first one loses nothing.
 */
export function calloutPortsOf(ports: readonly SerialPortDescription[]): SerialPortDescription[] {
  const listedPaths = new Set<string>();
  return ports.flatMap((port) => {
    const path = calloutPathOf(port.path);
    if (listedPaths.has(path)) {
      return [];
    }
    listedPaths.add(path);
    return [{...port, path}];
  });
}
