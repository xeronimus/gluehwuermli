import type {DmxOutputStatus, RememberedPort, SerialPortDescription} from '@shared/ipc';

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
 * The port to preselect, the first one still there of: the current choice, the port connected to last time; otherwise
 * the first that looks like an Enttec Pro, otherwise the first port.
 */
export const preferredPortPath = (
  ports: readonly SerialPortDescription[],
  currentPath: string | undefined,
  rememberedPort: RememberedPort
): string | undefined => {
  const rememberedPath = rememberedPort.type === 'remembered' ? rememberedPort.path : undefined;
  const listedPath = [currentPath, rememberedPath].find((path) => ports.some((port) => port.path === path));
  return listedPath ?? (ports.find((port) => port.likelyEnttecPro) ?? ports[0])?.path;
};
