import type {Fixture, FixturePreset} from '@shared/ipc';

import {clampedChannelValues} from '@/data/channelLocks';
import {presetChannelValues} from '@/data/presets';
import {dmxService} from '@/data/service/services';

import {selectChannelLimits} from '../lock/lockSelectors';
import {useAppStore} from '../store';

/**
 * sets the preset's channels in the store (the faders move) and sends them in one message, no round trip; capped like
 * the main process caps them, while the channel lock is on
 */
export function useActionApplyPreset() {
  const setChannelValues = useAppStore((state) => state.setChannelValues);

  return (fixture: Fixture, preset: FixturePreset) => {
    const values = clampedChannelValues(
      presetChannelValues(fixture, preset),
      selectChannelLimits(useAppStore.getState())
    );
    if (values.length === 0) {
      return;
    }
    setChannelValues(values);
    dmxService.setChannelValues(values);
  };
}
