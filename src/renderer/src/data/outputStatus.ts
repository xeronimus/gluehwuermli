import type {DmxOutputStatus, SerialPortDescription} from '@shared/ipc';

export const describeOutputStatus = (status: DmxOutputStatus): string => {
  switch (status.type) {
    case 'disconnected':
      return 'Not connected';
    case 'connecting':
      return `Connecting to ${status.path}…`;
    case 'connected':
      return `Sending on ${status.path}`;
    case 'failed':
      return `${status.path}: ${status.message}`;
  }
};

export const describePort = (port: SerialPortDescription): string => {
  const manufacturer = port.manufacturer ? ` (${port.manufacturer})` : '';
  const enttecHint = port.likelyEnttecPro ? ' – Enttec?' : '';
  return `${port.path}${manufacturer}${enttecHint}`;
};

/**
 * The port to preselect: the current choice while it is still there, otherwise the first that looks like an Enttec
 * Pro, otherwise the first port.
 */
export const preferredPortPath = (
  ports: readonly SerialPortDescription[],
  currentPath: string | undefined
): string | undefined => {
  if (ports.some((port) => port.path === currentPath)) {
    return currentPath;
  }
  return (ports.find((port) => port.likelyEnttecPro) ?? ports[0])?.path;
};
