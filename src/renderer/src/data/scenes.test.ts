import {DMX_UNIVERSE_SIZE} from '@shared/dmx';
import type {Chase, Fixture, FixtureSetup, Scene} from '@shared/ipc';

import {channelOffsetChanges, draftOf, fixtureOfDraft, withChannelChange, withChannelMoved} from './fixtureDraft';
import {withoutFixture} from './fixtureList';
import {
  captureScene,
  changingFixturesAndScenes,
  editedScene,
  sceneChannelValues,
  sceneEditErrors,
  withFittedScenes,
  withSavedFixture,
  withScene,
  withSceneMoved,
  withSceneOffsetsChanged,
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
    expect(
      captureScene(fixtures, channelValues, 'new', {name: ' Song 2 ', fixtureIds: ['smoke', 'par'], color: ''})
    ).toEqual({
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

  test('captures a value between two stops of a channel as the nearest stop', () => {
    const smokeInSteps: Fixture = {
      ...smoke,
      channels: [{name: 'Smoke', offset: 0, values: {mode: 'steps', min: 0, max: 200, step: 100}}]
    };

    expect(
      captureScene([smokeInSteps], channelValues, 'now', {name: 'Now', fixtureIds: ['smoke'], color: ''}).fixtures
    ).toEqual([{fixtureId: 'smoke', values: [{offset: 0, value: 100}]}]);
  });

  test('leaves out the fixtures not chosen and ids that are unknown', () => {
    expect(
      captureScene(fixtures, channelValues, 'new', {name: 'Fog', fixtureIds: ['smoke', 'laser'], color: ''}).fixtures
    ).toEqual([{fixtureId: 'smoke', values: [{offset: 0, value: 90}]}]);
  });
});

describe('scene colors', () => {
  test('a typed color is stored normalized, a blank one left out', () => {
    const colored = (color: string) =>
      captureScene(fixtures, channelValues, 'new', {name: 'Fog', fixtureIds: ['smoke'], color});

    expect(colored(' FF8800 ').color).toBe('#ff8800');
    expect(colored(' ')).not.toHaveProperty('color');
  });

  test('editing sets, changes or removes the color', () => {
    const edited = (scene: Scene, color: string) =>
      editedScene(scene, fixtures, channelValues, {name: 'Intro', fixtureIds: ['par'], color, recapture: false});

    expect(edited(intro, '#00ff00').color).toBe('#00ff00');
    expect(edited({...intro, color: '#00ff00'}, '')).not.toHaveProperty('color');
  });
});

describe('editedScene', () => {
  test('renames and keeps the stored values', () => {
    expect(
      editedScene(intro, fixtures, channelValues, {
        name: 'Opener',
        fixtureIds: ['par', 'smoke'],
        color: '',
        recapture: false
      })
    ).toEqual({...intro, name: 'Opener'});
  });

  test('drops an unchecked fixture and captures a newly checked one, keeping the others', () => {
    expect(
      editedScene(outro, fixtures, channelValues, {name: 'Outro', fixtureIds: ['par'], color: '', recapture: false})
    ).toEqual({
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
    });
  });

  test('recapture stores the current values of every chosen fixture', () => {
    expect(
      editedScene(intro, fixtures, channelValues, {
        name: 'Intro',
        fixtureIds: ['par', 'smoke'],
        color: '',
        recapture: true
      })
    ).toEqual(captureScene(fixtures, channelValues, 'intro', {name: 'Intro', fixtureIds: ['par', 'smoke'], color: ''}));
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

  test('moves the scene with the id, the fixtures stay as they are', () => {
    const moved = withSceneMoved(setupOf(fixtures, [intro, outro]), 'outro', 'earlier');

    expect(moved).toEqual(setupOf(fixtures, [outro, intro]));
    expect(withSceneMoved(setupOf(fixtures, [intro, outro]), 'outro', 'later').scenes).toEqual([intro, outro]);
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

  test('a channel with new value rules moves the scene values to the nearest valid one, valid ones stay', () => {
    const smokeInSteps: Fixture = {
      ...smoke,
      channels: [{name: 'Smoke', offset: 0, values: {mode: 'steps', min: 0, max: 255, step: 100}}]
    };
    const parFromHundred: Fixture = {
      ...par,
      channels: [{name: 'Red', offset: 0, values: {mode: 'continuous', min: 100, max: 255}}, par.channels[1]]
    };

    expect(withFittedScenes(setupOf([parFromHundred, smokeInSteps], [intro])).scenes).toEqual([
      {...intro, fixtures: [intro.fixtures[0], {fixtureId: 'smoke', values: [{offset: 0, value: 0}]}]}
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

describe('withSceneOffsetsChanged', () => {
  test('moves the values of the fixture all at once, so a swap keeps them on their channels', () => {
    const swapped = new Map([
      [0, 1],
      [1, 0]
    ]);

    expect(withSceneOffsetsChanged(setupOf(fixtures, [intro, outro]), 'par', swapped).scenes).toEqual([
      {
        ...intro,
        fixtures: [
          {
            fixtureId: 'par',
            values: [
              {offset: 1, value: 255},
              {offset: 0, value: 0}
            ]
          },
          intro.fixtures[1]
        ]
      },
      outro
    ]);
  });

  test('drops the values of removed channels and leaves other fixtures and a setup without scenes alone', () => {
    expect(withSceneOffsetsChanged(setupOf(fixtures, [intro]), 'par', new Map([[1, 1]])).scenes).toEqual([
      {...intro, fixtures: [{fixtureId: 'par', values: [{offset: 1, value: 0}]}, intro.fixtures[1]]}
    ]);
    expect(withSceneOffsetsChanged(setupOf(fixtures), 'par', new Map())).toEqual(setupOf(fixtures));
  });

  test('a channel with a new offset and rules gets its value fitted after the move', () => {
    const blueAtFour: Fixture = {
      ...par,
      channels: [par.channels[0], {name: 'Blue', offset: 4, values: {mode: 'continuous', min: 50, max: 255}}]
    };
    const setup = withSceneOffsetsChanged(
      setupOf([blueAtFour, smoke], [intro]),
      'par',
      new Map([
        [0, 0],
        [1, 4]
      ])
    );

    expect(withFittedScenes(setup).scenes?.[0].fixtures[0].values).toEqual([
      {offset: 0, value: 255},
      {offset: 4, value: 50}
    ]);
  });
});

describe('a fixture saved from the editor', () => {
  const saved = (setup: FixtureSetup, draft: ReturnType<typeof draftOf>): FixtureSetup =>
    withSavedFixture(setup, fixtureOfDraft('par', draft), channelOffsetChanges(draft));
  const namedValues = (setup: FixtureSetup) => {
    const fixture = setup.fixtures[0];
    return sceneChannelValues(setup.scenes?.[0] ?? intro, setup.fixtures)
      .filter(({channel}) => channel < smoke.startAddress)
      .map(({channel, value}) => [
        fixture.channels.find(({offset}) => fixture.startAddress + offset === channel)?.name,
        value
      ]);
  };
  const withPreset: Fixture = {...par, presets: [{id: 'warm', name: 'Warm', values: [{offset: 1, value: 40}]}]};
  const setup = setupOf([withPreset, smoke], [intro]);

  test('a moved channel is set by its presets and scenes as before', () => {
    const after = saved(setup, withChannelMoved(draftOf(withPreset), 1, 'earlier'));

    expect(after.fixtures[0].channels.map(({name}) => name)).toEqual(['Blue', 'Red']);
    expect(after.fixtures[0].presets).toEqual(withPreset.presets);
    expect(after).toEqual({...setup, fixtures: [after.fixtures[0], smoke]});
    expect(namedValues(after)).toEqual(namedValues(setup));
  });

  test('a channel with a typed offset is still set by its scenes', () => {
    const after = saved(setup, withChannelChange(draftOf(withPreset), 1, {offset: '3'}));

    expect(namedValues(after)).toEqual(namedValues(setup));
    expect(after.fixtures[0].presets).toEqual([{id: 'warm', name: 'Warm', values: [{offset: 3, value: 40}]}]);
  });

  test('a new fixture is added, and the scenes stay as they are', () => {
    const laser: Fixture = {id: 'laser', name: 'Laser', startAddress: 20, channels: [{name: 'Mode', offset: 0}]};

    expect(withSavedFixture(setup, laser, new Map())).toEqual({...setup, fixtures: [withPreset, smoke, laser]});
  });
});

describe('sceneEditErrors', () => {
  test('a named scene of at least one fixture can be saved', () => {
    expect(sceneEditErrors(fixtures, {name: 'Intro', fixtureIds: ['par'], color: ''})).toEqual([]);
  });

  test('not without a name, or without a fixture that exists', () => {
    expect(sceneEditErrors(fixtures, {name: ' ', fixtureIds: ['par'], color: ''})).toEqual([
      {type: 'scene-name-missing'}
    ]);
    expect(sceneEditErrors(fixtures, {name: 'Intro', fixtureIds: ['laser'], color: ''})).toEqual([
      {type: 'scene-fixtures-missing'}
    ]);
  });

  test('not with a color that is none', () => {
    expect(sceneEditErrors(fixtures, {name: 'Intro', fixtureIds: ['par'], color: 'orange'})).toEqual([
      {type: 'scene-color-invalid'}
    ]);
  });
});

describe('fixture changes and chases', () => {
  const chorus: Chase = {
    id: 'chorus',
    name: 'Chorus flash',
    repeat: {type: 'forever'},
    steps: [
      {
        id: 'one',
        holdMs: 500,
        values: [
          {channel: 1, value: 37},
          {channel: 10, value: 255}
        ]
      }
    ]
  };
  const setup: FixtureSetup = {...setupOf(fixtures, [intro]), chases: [chorus]};
  const fadingBlue: Fixture = {
    ...par,
    startAddress: 5,
    channels: [{name: 'Red', offset: 1, values: {mode: 'steps', min: 0, max: 255, step: 64}}]
  };

  test('a deleted, moved or edited fixture leaves the chases as they are', () => {
    expect(changingFixturesAndScenes((current) => withoutFixture(current, 'smoke'))(setup).chases).toEqual([chorus]);
    expect(withSavedFixture(setup, fadingBlue, new Map([[0, 1]])).chases).toEqual([chorus]);
    expect(withFittedScenes(setup).chases).toEqual([chorus]);
  });
});
