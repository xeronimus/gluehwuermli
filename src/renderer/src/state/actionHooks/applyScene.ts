import type {Scene} from '@shared/ipc';

import {sceneChannelValues} from '@/data/scenes';

import {selectFixtures} from '../fixtures/fixturesSelectors';
import {useAppStore} from '../store';
import {useActionSetChannelValues} from './setChannelValues';

/**
 * sets the scene's channels in the store (the faders move) and sends them in one message, no round trip, like a
 * preset; channels under the channel lock go only up to their cap, as in the main process
 */
export function useActionApplyScene() {
  const setChannelValues = useActionSetChannelValues();

  return (scene: Scene) => setChannelValues(sceneChannelValues(scene, selectFixtures(useAppStore.getState())));
}
