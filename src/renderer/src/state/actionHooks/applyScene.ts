import type {Scene} from '@shared/ipc';

import {clampedChannelValues} from '@/data/channelLocks';
import {sceneChannelValues} from '@/data/scenes';
import {dmxService} from '@/data/service/services';

import {selectFixtures} from '../fixtures/fixturesSelectors';
import {selectChannelLimits} from '../lock/lockSelectors';
import {useAppStore} from '../store';

/**
 * sets the scene's channels in the store (the faders move) and sends them in one message, no round trip, like a
 * preset; channels under the channel lock go only up to their cap, as in the main process
 */
export function useActionApplyScene() {
  const setChannelValues = useAppStore((state) => state.setChannelValues);

  return (scene: Scene) => {
    const state = useAppStore.getState();
    const values = clampedChannelValues(sceneChannelValues(scene, selectFixtures(state)), selectChannelLimits(state));
    if (values.length === 0) {
      return;
    }
    setChannelValues(values);
    dmxService.setChannelValues(values);
  };
}
