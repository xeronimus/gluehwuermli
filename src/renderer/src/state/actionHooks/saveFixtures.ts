import type {Fixture} from '@shared/ipc';
import {createSerialQueue} from '@shared/serialQueue';

import {withFixture, withoutFixture} from '@/data/fixtureList';
import {capturePreset, withPreset} from '@/data/presets';
import logger from '@/data/service/Logger';
import {fixtureService} from '@/data/service/services';

import {type StoreFixtures, storeFixturesWith} from '../fixtures/storeFixtures';
import {useAppStore} from '../store';
import {capShownChannelValues} from './capShownChannelValues';

const storeFixturesUncapped = storeFixturesWith({
  getState: useAppStore.getState,
  fixtureService,
  runSerially: createSerialQueue(),
  log: logger
});

/** a saved setup may lock a channel that is above its new cap: the main process capped it already */
const storeFixtures: StoreFixtures = async (change, failure) => {
  const stored = await storeFixturesUncapped(change, failure);
  capShownChannelValues();
  return stored;
};

/** adds the fixture, or replaces the one with its id */
export function useActionSaveFixture() {
  return (fixture: Fixture) =>
    storeFixtures((fixtures) => withFixture(fixtures, fixture), `Could not save the fixture ${fixture.name}`);
}

export function useActionDeleteFixture() {
  return (fixture: Fixture) =>
    storeFixtures((fixtures) => withoutFixture(fixtures, fixture.id), `Could not delete the fixture ${fixture.name}`);
}

/** stores the fixture's current fader values as a new preset of all its channels */
export function useActionSavePreset() {
  return (fixture: Fixture, name: string) => {
    const preset = capturePreset(fixture, useAppStore.getState().channelValues, crypto.randomUUID(), name);
    return storeFixtures(
      (fixtures) => withPreset(fixtures, fixture.id, preset),
      `Could not save the preset ${preset.name} of ${fixture.name}`
    );
  };
}
