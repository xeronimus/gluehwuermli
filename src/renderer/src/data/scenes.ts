import {colorToStore} from '@shared/colors';
import type {Fixture, FixtureSetup, Scene, SceneFixture, SetChannelRequest} from '@shared/ipc';
import {type SceneError, sceneErrors, setupScenes} from '@shared/scenes';

import {changingFixtures} from './fixtureList';
import {type MoveDirection, movedWithId} from './listOrder';
import {currentFixtureValues, fittedFixtureValues, fixtureChannelValues} from './presets';

/**
 * what the scene editor sets: the name, the color of its button's dot, the fixtures it covers, and whether to store the
 * current values again
 */
export interface SceneEdit {
  readonly name: string;
  /** as typed; blank for none */
  readonly color: string;
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

/** the scene with this name and color as stored: trimmed, normalized, a blank color left out */
function namedScene(id: string, name: string, color: string, fixtures: SceneFixture[]): Scene {
  const storedColor = colorToStore(color);
  return {id, name: name.trim(), fixtures, ...(storedColor !== undefined && {color: storedColor})};
}

/** a scene of every channel of the chosen fixtures at the value it has now */
export const captureScene = (
  fixtures: readonly Fixture[],
  channelValues: readonly number[],
  id: string,
  {name, color, fixtureIds}: Omit<SceneEdit, 'recapture'>
): Scene =>
  namedScene(
    id,
    name,
    color,
    chosenFixtures(fixtures, fixtureIds).map((fixture) => capturedFixture(fixture, channelValues))
  );

/**
 * the scene after the editor: renamed, recolored, for the chosen fixtures, with the stored values kept unless
 * recaptured
 */
export const editedScene = (
  scene: Scene,
  fixtures: readonly Fixture[],
  channelValues: readonly number[],
  {name, color, fixtureIds, recapture}: SceneEdit
): Scene =>
  namedScene(
    scene.id,
    name,
    color,
    chosenFixtures(fixtures, fixtureIds).map((fixture) => {
      const stored = scene.fixtures.find(({fixtureId}) => fixtureId === fixture.id);
      return stored && !recapture ? stored : capturedFixture(fixture, channelValues);
    })
  );

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

/** the setup with the scene one place earlier or later among the scene buttons */
export const withSceneMoved = (setup: FixtureSetup, sceneId: string, direction: MoveDirection): FixtureSetup => ({
  ...setup,
  scenes: movedWithId(setupScenes(setup), sceneId, direction)
});

/**
 * the values for channels the fixture still has, each fitted to the nearest value its channel can have; none for a
 * fixture that was deleted
 */
function fittedSceneFixture(sceneFixture: SceneFixture, fixtures: readonly Fixture[]): SceneFixture[] {
  const fixture = fixtures.find(({id}) => id === sceneFixture.fixtureId);
  if (!fixture) {
    return [];
  }
  const offsets = new Set(fixture.channels.map(({offset}) => offset));
  const values = fittedFixtureValues(
    fixture,
    sceneFixture.values.filter(({offset}) => offsets.has(offset))
  );
  return values.length > 0 ? [{...sceneFixture, values}] : [];
}

/**
 * The scenes fitted to the setup's fixtures, after one was deleted or edited: a deleted fixture leaves every scene,
 * a removed channel leaves the scenes' values, a channel with other value rules moves them to its nearest valid
 * value. A scene fixture without values left and a scene without fixtures left
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

/** no fader values: what is wrong with a scene doesn't depend on them */
const NO_CHANNEL_VALUES: readonly number[] = [];

/**
 * what keeps the scene the editor describes from being saved (no name, an invalid color, no fixture chosen), without
 * reading the faders: the editor shouldn't re-render on every fader move
 */
export const sceneEditErrors = (fixtures: readonly Fixture[], edit: Omit<SceneEdit, 'recapture'>): SceneError[] =>
  sceneErrors(captureScene(fixtures, NO_CHANNEL_VALUES, 'draft', edit), fixtures);

/**
 * the scenes' values of the fixture moved to its channels' new offsets (`changes`: old offset to new), all at once, so
 * two channels swapping offsets keep their values. A value at an offset not in `changes` belongs to a removed channel
 * and is dropped; withFittedScenes then removes what is left empty. Other fixtures stay as they are
 */
export function withSceneOffsetsChanged(
  setup: FixtureSetup,
  fixtureId: string,
  changes: ReadonlyMap<number, number>
): FixtureSetup {
  if (!setup.scenes) {
    return setup;
  }
  const changedFixture = (sceneFixture: SceneFixture): SceneFixture =>
    sceneFixture.fixtureId !== fixtureId
      ? sceneFixture
      : {
          ...sceneFixture,
          values: sceneFixture.values.flatMap(({offset, value}) => {
            const newOffset = changes.get(offset);
            return newOffset === undefined ? [] : [{offset: newOffset, value}];
          })
        };
  return {...setup, scenes: setup.scenes.map((scene) => ({...scene, fixtures: scene.fixtures.map(changedFixture)}))};
}

/** a change of the fixture list, with the scenes fitted to it in the same save: main refuses scenes that don't fit */
export const changingFixturesAndScenes =
  (change: (fixtures: readonly Fixture[]) => Fixture[]) =>
  (setup: FixtureSetup): FixtureSetup =>
    withFittedScenes(changingFixtures(change)(setup));
