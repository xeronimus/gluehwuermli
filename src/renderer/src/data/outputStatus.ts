import type {RememberedPort, SerialPortDescription} from '@shared/ipc';

/** marks a port that looks like a DMX interface (the Enttec's and the Eurolite's USB chip): a hint, not a promise */
export const LIKELY_DMX_INTERFACE_MARK = '▸';

/** a port in the select; nothing to translate: the mark, the path and the manufacturer */
export const describePort = (port: SerialPortDescription): string => {
  const mark = port.likelyEnttecPro ? `${LIKELY_DMX_INTERFACE_MARK} ` : '';
  const manufacturer = port.manufacturer ? ` (${port.manufacturer})` : '';
  return `${mark}${port.path}${manufacturer}`;
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

/** the port shown next to Connect in the top bar */
export type SelectedPort = {type: 'selected'; path: string} | {type: 'none-selected'} | {type: 'none-found'};

/** none found wins: without listed ports a path still selected from before can't be connected */
export const selectedPortOf = (
  ports: readonly SerialPortDescription[],
  selectedPath: string | undefined
): SelectedPort => {
  if (ports.length === 0) {
    return {type: 'none-found'};
  }
  return selectedPath === undefined ? {type: 'none-selected'} : {type: 'selected', path: selectedPath};
};
