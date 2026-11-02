import type {RememberedPort, SerialPortDescription} from '@shared/ipc';

/** a port in the select; nothing to translate: the path, the manufacturer and a product name */
export const describePort = (port: SerialPortDescription): string => {
  const manufacturer = port.manufacturer ? ` (${port.manufacturer})` : '';
  const enttecHint = port.likelyEnttecPro ? ' – Enttec?' : '';
  return `${port.path}${manufacturer}${enttecHint}`;
};

/**
 * The port to preselect, the first one still there of: the port chosen by hand, the port connected to last time;
 * otherwise the first that looks like an Enttec Pro, otherwise the first port. A port only preselected earlier is not a
 * choice, so a widget plugged in after the app started wins over it.
 */
export const preferredPortPath = (
  ports: readonly SerialPortDescription[],
  chosenPath: string | undefined,
  rememberedPort: RememberedPort
): string | undefined => {
  const rememberedPath = rememberedPort.type === 'remembered' ? rememberedPort.path : undefined;
  const listedPath = [chosenPath, rememberedPath].find((path) => ports.some((port) => port.path === path));
  return listedPath ?? (ports.find((port) => port.likelyEnttecPro) ?? ports[0])?.path;
};
