import {msg} from '@lingui/core/macro';

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
const storeFixtures: StoreFixtures = async (change, action, failure) => {
  const stored = await storeFixturesUncapped(change, action, failure);
  capShownChannelValues();
  return stored;
};

// the names as plain variables, so the message reads {fixtureName} in the catalog rather than {0}
const couldNotSaveFixture = ({name: fixtureName}: Fixture) => msg`Could not save the fixture ${fixtureName}`;
const couldNotDeleteFixture = ({name: fixtureName}: Fixture) => msg`Could not delete the fixture ${fixtureName}`;
const couldNotSavePreset = (presetName: string, {name: fixtureName}: Fixture) =>
  msg`Could not save the preset ${presetName} of ${fixtureName}`;

/** adds the fixture, or replaces the one with its id */
export function useActionSaveFixture() {
  return (fixture: Fixture) =>
    storeFixtures(
      (fixtures) => withFixture(fixtures, fixture),
      `saving the fixture ${fixture.name}`,
      couldNotSaveFixture(fixture)
    );
}

export function useActionDeleteFixture() {
  return (fixture: Fixture) =>
    storeFixtures(
      (fixtures) => withoutFixture(fixtures, fixture.id),
      `deleting the fixture ${fixture.name}`,
      couldNotDeleteFixture(fixture)
    );
}

/** stores the fixture's current fader values as a new preset of all its channels */
export function useActionSavePreset() {
  return (fixture: Fixture, name: string) => {
    const preset = capturePreset(fixture, useAppStore.getState().channelValues, crypto.randomUUID(), name);
    return storeFixtures(
      (fixtures) => withPreset(fixtures, fixture.id, preset),
      `saving the preset ${preset.name} of ${fixture.name}`,
      couldNotSavePreset(preset.name, fixture)
    );
  };
}
