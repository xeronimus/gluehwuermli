import type {Fixture, FixturePreset} from '@shared/ipc';

import {presetChannelValues} from '@/data/presets';
import {dmxService} from '@/data/service/services';

import {useAppStore} from '../store';

/** sets the preset's channels in the store (the faders move) and sends them in one message, no round trip */
export function useActionApplyPreset() {
  const setChannelValues = useAppStore((state) => state.setChannelValues);

  return (fixture: Fixture, preset: FixturePreset) => {
    const values = presetChannelValues(fixture, preset);
    if (values.length === 0) {
      return;
    }
    setChannelValues(values);
    dmxService.setChannelValues(values);
  };
}
