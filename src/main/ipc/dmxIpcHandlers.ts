import {DMX_UNIVERSE_SIZE, FIRST_DMX_CHANNEL} from '@shared/dmx';
import type {UniverseValues} from '@shared/ipc';

import type {DmxEngine} from '@/dmx/dmxEngine';

/**
 * What GET_CHANNEL_VALUES answers, without Electron: the universe as the engine holds it, so already capped. Not tied
 * to the mode, Show mode shows the faders too
 */
export const universeValuesOf = (engine: Pick<DmxEngine, 'channelValue'>): UniverseValues => ({
  values: Array.from({length: DMX_UNIVERSE_SIZE}, (_unused, index) => engine.channelValue(index + FIRST_DMX_CHANNEL))
});
