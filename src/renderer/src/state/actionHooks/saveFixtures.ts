import {msg} from '@lingui/core/macro';

import type {Fixture, Scene} from '@shared/ipc';
import {createSerialQueue} from '@shared/serialQueue';

import {changingFixtures, withFixtureMoved, withoutFixture} from '@/data/fixtureList';
import type {MoveDirection} from '@/data/listOrder';
import {capturePreset, withPreset} from '@/data/presets';
import {
  type SceneEdit,
  captureScene,
  changingFixturesAndScenes,
  editedScene,
  withSavedFixture,
  withScene,
  withSceneMoved,
  withoutScene
} from '@/data/scenes';
import logger from '@/data/service/Logger';
import {projectService} from '@/data/service/services';

import {type StoreFixtures, storeFixturesWith} from '../fixtures/storeFixtures';
import {useAppStore} from '../store';
import {capShownChannelValues} from './capShownChannelValues';

const storeFixturesUncapped = storeFixturesWith({
  getState: useAppStore.getState,
  projectService,
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
const couldNotSaveScene = (sceneName: string) => msg`Could not save the scene ${sceneName}`;
const couldNotDeleteScene = ({name: sceneName}: Scene) => msg`Could not delete the scene ${sceneName}`;
const couldNotMoveFixture = ({name: fixtureName}: Fixture) => msg`Could not move the fixture ${fixtureName}`;
const couldNotMoveScene = ({name: sceneName}: Scene) => msg`Could not move the scene ${sceneName}`;

/**
 * adds the fixture, or replaces the one with its id; the scenes follow its channels to their new offsets
 * (`offsetChanges`: stored offset to new, empty for a new fixture)
 */
export function useActionSaveFixture() {
  return (fixture: Fixture, offsetChanges: ReadonlyMap<number, number>) =>
    storeFixtures(
      (setup) => withSavedFixture(setup, fixture, offsetChanges),
      `saving the fixture ${fixture.name}`,
      couldNotSaveFixture(fixture)
    );
}

export function useActionDeleteFixture() {
  return (fixture: Fixture) =>
    storeFixtures(
      changingFixturesAndScenes((fixtures) => withoutFixture(fixtures, fixture.id)),
      `deleting the fixture ${fixture.name}`,
      couldNotDeleteFixture(fixture)
    );
}

/** stores the fixture's current fader values as a new preset of all its channels */
export function useActionSavePreset() {
  return (fixture: Fixture, name: string) => {
    const preset = capturePreset(fixture, useAppStore.getState().channelValues, crypto.randomUUID(), name);
    return storeFixtures(
      changingFixtures((fixtures) => withPreset(fixtures, fixture.id, preset)),
      `saving the preset ${preset.name} of ${fixture.name}`,
      couldNotSavePreset(preset.name, fixture)
    );
  };
}

/** stores a new scene of the chosen fixtures at their current fader values */
export function useActionAddScene() {
  return (edit: Omit<SceneEdit, 'recapture'>) => {
    const channelValues = useAppStore.getState().channelValues;
    const id = crypto.randomUUID();
    return storeFixtures(
      (setup) => withScene(setup, captureScene(setup.fixtures, channelValues, id, edit)),
      `adding the scene ${edit.name}`,
      couldNotSaveScene(edit.name.trim())
    );
  };
}

/** stores the scene renamed, for the chosen fixtures, with its values kept or recaptured from the faders */
export function useActionEditScene() {
  return (scene: Scene, edit: SceneEdit) => {
    const channelValues = useAppStore.getState().channelValues;
    return storeFixtures(
      (setup) => withScene(setup, editedScene(scene, setup.fixtures, channelValues, edit)),
      `editing the scene ${scene.name}`,
      couldNotSaveScene(edit.name.trim())
    );
  };
}

/** one place earlier or later in the Show view; the scenes don't change, they don't depend on the order */
export function useActionMoveFixture() {
  return (fixture: Fixture, direction: MoveDirection) =>
    storeFixtures(
      changingFixtures((fixtures) => withFixtureMoved(fixtures, fixture.id, direction)),
      `moving the fixture ${fixture.name}`,
      couldNotMoveFixture(fixture)
    );
}

/** one place earlier or later among the scene buttons */
export function useActionMoveScene() {
  return (scene: Scene, direction: MoveDirection) =>
    storeFixtures(
      (setup) => withSceneMoved(setup, scene.id, direction),
      `moving the scene ${scene.name}`,
      couldNotMoveScene(scene)
    );
}

export function useActionDeleteScene() {
  return (scene: Scene) =>
    storeFixtures(
      (setup) => withoutScene(setup, scene.id),
      `deleting the scene ${scene.name}`,
      couldNotDeleteScene(scene)
    );
}
