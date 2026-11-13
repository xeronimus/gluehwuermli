import type {Fixture, FixturePreset} from '@shared/ipc';

import {presetChannelValues} from '@/data/presets';

import {useActionSetChannelValues} from './setChannelValues';

/**
 * sets the preset's channels in the store (the faders move) and sends them in one message, no round trip; capped like
 * the main process caps them, while the channel lock is on
 */
export function useActionApplyPreset() {
  const setChannelValues = useActionSetChannelValues();

  return (fixture: Fixture, preset: FixturePreset) => setChannelValues(presetChannelValues(fixture, preset));
}
