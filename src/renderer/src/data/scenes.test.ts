import {DMX_UNIVERSE_SIZE} from '@shared/dmx';
import type {Fixture, FixtureSetup, Scene} from '@shared/ipc';

import {withoutFixture} from './fixtureList';
import {
  captureScene,
  changingFixturesAndScenes,
  editedScene,
  sceneChannelValues,
  sceneEditErrors,
  withFittedScenes,
  withScene,
  withoutScene
} from './scenes';

const par: Fixture = {
  id: 'par',
  name: 'PAR',
  startAddress: 1,
  channels: [
    {name: 'Red', offset: 0},
    {name: 'Blue', offset: 1}
  ]
};
const smoke: Fixture = {id: 'smoke', name: 'Smoke', startAddress: 10, channels: [{name: 'Smoke', offset: 0}]};
const fixtures = [par, smoke];

/** PAR red 200, blue 40, smoke 90 */
const channelValues = (() => {
  const values = Array<number>(DMX_UNIVERSE_SIZE).fill(0);
  values[0] = 200;
  values[1] = 40;
  values[9] = 90;
  return values;
})();

const intro: Scene = {
  id: 'intro',
  name: 'Intro',
  fixtures: [
    {
      fixtureId: 'par',
      values: [
        {offset: 0, value: 255},
        {offset: 1, value: 0}
      ]
    },
    {fixtureId: 'smoke', values: [{offset: 0, value: 10}]}
  ]
};
const outro: Scene = {id: 'outro', name: 'Outro', fixtures: [{fixtureId: 'smoke', values: [{offset: 0, value: 0}]}]};

const setupOf = (setupFixtures: Fixture[], scenes?: Scene[]): FixtureSetup => ({
  version: 1,
  fixtures: setupFixtures,
  scenes
});

describe('captureScene', () => {
  test('captures every channel of the chosen fixtures at its current value, in the order of the fixture list', () => {
    expect(captureScene(fixtures, channelValues, 'new', {name: ' Song 2 ', fixtureIds: ['smoke', 'par']})).toEqual({
      id: 'new',
      name: 'Song 2',
      fixtures: [
        {
          fixtureId: 'par',
          values: [
            {offset: 0, value: 200},
            {offset: 1, value: 40}
          ]
        },
        {fixtureId: 'smoke', values: [{offset: 0, value: 90}]}
      ]
    });
  });

  test('leaves out the fixtures not chosen and ids that are unknown', () => {
    expect(
      captureScene(fixtures, channelValues, 'new', {name: 'Fog', fixtureIds: ['smoke', 'laser']}).fixtures
    ).toEqual([{fixtureId: 'smoke', values: [{offset: 0, value: 90}]}]);
  });
});

describe('editedScene', () => {
  test('renames and keeps the stored values', () => {
    expect(
      editedScene(intro, fixtures, channelValues, {name: 'Opener', fixtureIds: ['par', 'smoke'], recapture: false})
    ).toEqual({...intro, name: 'Opener'});
  });

  test('drops an unchecked fixture and captures a newly checked one, keeping the others', () => {
    expect(editedScene(outro, fixtures, channelValues, {name: 'Outro', fixtureIds: ['par'], recapture: false})).toEqual(
      {
        ...outro,
        fixtures: [
          {
            fixtureId: 'par',
            values: [
              {offset: 0, value: 200},
              {offset: 1, value: 40}
            ]
          }
        ]
      }
    );
  });

  test('recapture stores the current values of every chosen fixture', () => {
    expect(
      editedScene(intro, fixtures, channelValues, {name: 'Intro', fixtureIds: ['par', 'smoke'], recapture: true})
    ).toEqual(captureScene(fixtures, channelValues, 'intro', {name: 'Intro', fixtureIds: ['par', 'smoke']}));
  });
});

describe('sceneChannelValues', () => {
  test('the absolute channels of every fixture in the scene', () => {
    expect(sceneChannelValues(intro, fixtures)).toEqual([
      {channel: 1, value: 255},
      {channel: 2, value: 0},
      {channel: 10, value: 10}
    ]);
  });

  test('follows the start address and skips a fixture that is gone', () => {
    expect(sceneChannelValues(intro, [{...par, startAddress: 100}])).toEqual([
      {channel: 100, value: 255},
      {channel: 101, value: 0}
    ]);
  });
});

describe('withScene and withoutScene', () => {
  test('a new scene is appended, also to a setup from before scenes', () => {
    expect(withScene(setupOf(fixtures), intro).scenes).toEqual([intro]);
    expect(withScene(setupOf(fixtures, [intro]), outro).scenes).toEqual([intro, outro]);
  });

  test('an edited scene replaces the one with its id, in place', () => {
    const renamed = {...intro, name: 'Opener'};

    expect(withScene(setupOf(fixtures, [intro, outro]), renamed).scenes).toEqual([renamed, outro]);
  });

  test('removes the scene with the id, an unknown id changes nothing', () => {
    expect(withoutScene(setupOf(fixtures, [intro, outro]), 'intro').scenes).toEqual([outro]);
    expect(withoutScene(setupOf(fixtures, [intro, outro]), 'finale').scenes).toEqual([intro, outro]);
  });
});

describe('withFittedScenes', () => {
  test('changes nothing while the scenes fit, or in a setup without scenes', () => {
    const setup = setupOf(fixtures, [intro, outro]);

    expect(withFittedScenes(setup)).toEqual(setup);
    expect(withFittedScenes(setupOf(fixtures))).toEqual(setupOf(fixtures));
  });

  test('a deleted fixture leaves every scene, a scene without fixtures left is removed', () => {
    expect(withFittedScenes(setupOf([par], [intro, outro])).scenes).toEqual([
      {...intro, fixtures: [intro.fixtures[0]]}
    ]);
  });

  test('a removed channel leaves the scenes, a new one is not added', () => {
    const redAndGreen: Fixture = {
      ...par,
      channels: [
        {name: 'Red', offset: 0},
        {name: 'Green', offset: 2}
      ]
    };

    expect(withFittedScenes(setupOf([redAndGreen, smoke], [intro])).scenes).toEqual([
      {
        ...intro,
        fixtures: [{fixtureId: 'par', values: [{offset: 0, value: 255}]}, intro.fixtures[1]]
      }
    ]);
  });

  test('a fixture without any of its scene channels left leaves the scene', () => {
    const otherChannels: Fixture = {...smoke, channels: [{name: 'Fan', offset: 1}]};

    expect(withFittedScenes(setupOf([par, otherChannels], [intro, outro])).scenes).toEqual([
      {...intro, fixtures: [intro.fixtures[0]]}
    ]);
  });
});

describe('changingFixturesAndScenes', () => {
  test('deleting a fixture takes it out of the scenes in the same change', () => {
    const change = changingFixturesAndScenes((current) => withoutFixture(current, 'smoke'));

    expect(change(setupOf(fixtures, [intro, outro]))).toEqual(
      setupOf([par], [{...intro, fixtures: [intro.fixtures[0]]}])
    );
  });
});

describe('sceneEditErrors', () => {
  test('a named scene of at least one fixture can be saved', () => {
    expect(sceneEditErrors(fixtures, {name: 'Intro', fixtureIds: ['par']})).toEqual([]);
  });

  test('not without a name, or without a fixture that exists', () => {
    expect(sceneEditErrors(fixtures, {name: ' ', fixtureIds: ['par']})).toEqual([{type: 'scene-name-missing'}]);
    expect(sceneEditErrors(fixtures, {name: 'Intro', fixtureIds: ['laser']})).toEqual([
      {type: 'scene-fixtures-missing'}
    ]);
  });
});
