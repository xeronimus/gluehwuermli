import type {SetChannelRequest} from '@shared/ipc';

import {currentFixturesChannelValues} from '@/data/chaseStepFill';

import {selectFixtures} from '../fixtures/fixturesSelectors';
import {useAppStore} from '../store';

/**
 * the channels of the fixtures with the values they have at the moment it is called; read then, not subscribed, so the
 * chase editor doesn't re-render on every fader move
 */
export function useActionCurrentFixtureValues() {
  return (fixtureIds: readonly string[]): SetChannelRequest[] => {
    const state = useAppStore.getState();
    return currentFixturesChannelValues(selectFixtures(state), fixtureIds, state.channelValues);
  };
}
