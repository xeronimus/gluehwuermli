import type {Fixture, FixtureSetup, Scene, SceneFixture, SetChannelRequest} from '@shared/ipc';
import {setupScenes} from '@shared/scenes';

import {currentFixtureValues, fixtureChannelValues} from './presets';

/** what the scene editor sets: the name, the fixtures it covers, and whether to store the current values again */
export interface SceneEdit {
  readonly name: string;
  readonly fixtureIds: readonly string[];
  /** false keeps the stored values of the fixtures the scene already covered; newly chosen ones are always captured */
  readonly recapture: boolean;
}

/** the chosen fixtures in the order of the fixture list, unknown ids left out */
const chosenFixtures = (fixtures: readonly Fixture[], fixtureIds: readonly string[]): Fixture[] =>
  fixtures.filter(({id}) => fixtureIds.includes(id));

const capturedFixture = (fixture: Fixture, channelValues: readonly number[]): SceneFixture => ({
  fixtureId: fixture.id,
  values: currentFixtureValues(fixture, channelValues)
});

/** a scene of every channel of the chosen fixtures at the value it has now */
export const captureScene = (
  fixtures: readonly Fixture[],
  channelValues: readonly number[],
  id: string,
  {name, fixtureIds}: Omit<SceneEdit, 'recapture'>
): Scene => ({
  id,
  name: name.trim(),
  fixtures: chosenFixtures(fixtures, fixtureIds).map((fixture) => capturedFixture(fixture, channelValues))
});

/** the scene after the editor: renamed, for the chosen fixtures, with the stored values kept unless recaptured */
export const editedScene = (
  scene: Scene,
  fixtures: readonly Fixture[],
  channelValues: readonly number[],
  {name, fixtureIds, recapture}: SceneEdit
): Scene => ({
  ...scene,
  name: name.trim(),
  fixtures: chosenFixtures(fixtures, fixtureIds).map((fixture) => {
    const stored = scene.fixtures.find(({fixtureId}) => fixtureId === fixture.id);
    return stored && !recapture ? stored : capturedFixture(fixture, channelValues);
  })
});

/** the absolute channels and values the scene sets; fixtures that no longer exist are skipped */
export const sceneChannelValues = (scene: Scene, fixtures: readonly Fixture[]): SetChannelRequest[] =>
  scene.fixtures.flatMap(({fixtureId, values}) => {
    const fixture = fixtures.find(({id}) => id === fixtureId);
    return fixture ? fixtureChannelValues(fixture, values) : [];
  });

/** the setup with `scene` replacing the one with its id, in place, or appended if it is new */
export const withScene = (setup: FixtureSetup, scene: Scene): FixtureSetup => {
  const scenes = setupScenes(setup);
  return {
    ...setup,
    scenes: scenes.some(({id}) => id === scene.id)
      ? scenes.map((current) => (current.id === scene.id ? scene : current))
      : [...scenes, scene]
  };
};

export const withoutScene = (setup: FixtureSetup, sceneId: string): FixtureSetup => ({
  ...setup,
  scenes: setupScenes(setup).filter(({id}) => id !== sceneId)
});

/** the values for channels the fixture still has; none for a fixture that was deleted */
function fittedSceneFixture(sceneFixture: SceneFixture, fixtures: readonly Fixture[]): SceneFixture[] {
  const fixture = fixtures.find(({id}) => id === sceneFixture.fixtureId);
  const offsets = new Set(fixture?.channels.map(({offset}) => offset));
  const values = sceneFixture.values.filter(({offset}) => offsets.has(offset));
  return values.length > 0 ? [{...sceneFixture, values}] : [];
}

/**
 * The scenes fitted to the setup's fixtures, after one was deleted or edited: a deleted fixture leaves every scene,
 * a removed channel leaves the scenes' values. A scene fixture without values left and a scene without fixtures left
 * are removed. New channels are not added: they get a value when the scene is recaptured.
 */
export function withFittedScenes(setup: FixtureSetup): FixtureSetup {
  if (!setup.scenes) {
    return setup;
  }
  const scenes = setup.scenes.flatMap((scene) => {
    const sceneFixtures = scene.fixtures.flatMap((sceneFixture) => fittedSceneFixture(sceneFixture, setup.fixtures));
    return sceneFixtures.length > 0 ? [{...scene, fixtures: sceneFixtures}] : [];
  });
  return {...setup, scenes};
}
