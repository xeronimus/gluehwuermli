import {isDmxValue} from './dmx';
import {type Fixture, type FixtureSetup, SCENE_NAME_MAX_LENGTH, type Scene, type SceneFixture} from './ipc';
import {duplicatesOf, isBlank} from './validation';

/**
 * Validation of scenes, used by both processes like the fixtures' (fixtures.ts): the renderer shows the problems while
 * editing, the main process refuses to store or load a setup that has any.
 */

/** one empty list, so a store selector returns the same value every time */
const NO_SCENES: readonly Scene[] = [];

/** the setup's scenes; none in a file from before scenes existed */
export const setupScenes = (setup: FixtureSetup): readonly Scene[] => setup.scenes ?? NO_SCENES;

/** what keeps a scene from being saved, as a code (said in the UI language by the renderer) */
export type SceneError =
  | {readonly type: 'scene-name-missing'}
  | {readonly type: 'scene-name-too-long'}
  | {readonly type: 'scene-fixtures-missing'}
  | {readonly type: 'scene-fixture-unknown'}
  | {readonly type: 'scene-fixture-twice'}
  | {readonly type: 'scene-channels-missing'}
  | {readonly type: 'scene-channel-unknown'}
  | {readonly type: 'scene-channel-twice'}
  | {readonly type: 'scene-value-invalid'};

/** what is wrong with the values the scene sets on one fixture; a fixture that doesn't exist is checked elsewhere */
function sceneFixtureErrors(sceneFixture: SceneFixture, fixture: Fixture): SceneError[] {
  const errors: SceneError[] = [];
  const offsets = new Set(fixture.channels.map((channel) => channel.offset));
  const sceneOffsets = sceneFixture.values.map((sceneValue) => sceneValue.offset);
  if (sceneOffsets.length === 0) {
    errors.push({type: 'scene-channels-missing'});
  }
  if (sceneOffsets.some((offset) => !offsets.has(offset))) {
    errors.push({type: 'scene-channel-unknown'});
  }
  if (duplicatesOf(sceneOffsets).length > 0) {
    errors.push({type: 'scene-channel-twice'});
  }
  if (sceneFixture.values.some((sceneValue) => !isDmxValue(sceneValue.value))) {
    errors.push({type: 'scene-value-invalid'});
  }
  return errors;
}

/** what keeps the scene from being saved with these fixtures, each problem once; empty when it is valid */
export function sceneErrors(scene: Scene, fixtures: readonly Fixture[]): SceneError[] {
  const errors: SceneError[] = [];
  if (isBlank(scene.name)) {
    errors.push({type: 'scene-name-missing'});
  }
  if (scene.name.length > SCENE_NAME_MAX_LENGTH) {
    errors.push({type: 'scene-name-too-long'});
  }
  if (scene.fixtures.length === 0) {
    errors.push({type: 'scene-fixtures-missing'});
  }
  if (duplicatesOf(scene.fixtures.map(({fixtureId}) => fixtureId)).length > 0) {
    errors.push({type: 'scene-fixture-twice'});
  }
  scene.fixtures.forEach((sceneFixture) => {
    const fixture = fixtures.find(({id}) => id === sceneFixture.fixtureId);
    errors.push(...(fixture ? sceneFixtureErrors(sceneFixture, fixture) : [{type: 'scene-fixture-unknown' as const}]));
  });
  return errors.filter((error, index) => errors.findIndex(({type}) => type === error.type) === index);
}

/** true when every scene is valid with the setup's fixtures and no two share an id */
export function scenesAreValid(setup: FixtureSetup): boolean {
  const scenes = setupScenes(setup);
  return (
    duplicatesOf(scenes.map(({id}) => id)).length === 0 &&
    scenes.every((scene) => sceneErrors(scene, setup.fixtures).length === 0)
  );
}
