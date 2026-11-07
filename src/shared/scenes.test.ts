import type {Fixture, FixtureSetup, Scene} from './ipc';
import {sceneErrors, scenesAreValid, setupScenes} from './scenes';

const rgbPar: Fixture = {
  id: 'par',
  name: 'PAR',
  startAddress: 1,
  channels: [
    {name: 'Red', offset: 0},
    {name: 'Green', offset: 1},
    {name: 'Blue', offset: 2}
  ]
};
const smoke: Fixture = {id: 'smoke', name: 'Smoke', startAddress: 10, channels: [{name: 'Smoke', offset: 0}]};
const fixtures = [rgbPar, smoke];

const sceneOf = (overrides: Partial<Scene> = {}): Scene => ({
  id: 'intro',
  name: 'Intro',
  fixtures: [
    {
      fixtureId: 'par',
      values: [
        {offset: 0, value: 255},
        {offset: 2, value: 40}
      ]
    },
    {fixtureId: 'smoke', values: [{offset: 0, value: 0}]}
  ],
  ...overrides
});

const setupOf = (scenes: Scene[] | undefined): FixtureSetup => ({version: 1, fixtures, scenes});

describe('setupScenes', () => {
  test('none in a setup from before scenes', () => {
    expect(setupScenes(setupOf(undefined))).toEqual([]);
    expect(setupScenes(setupOf([sceneOf()]))).toEqual([sceneOf()]);
  });
});

describe('sceneErrors', () => {
  test('a scene on some channels of known fixtures is valid', () => {
    expect(sceneErrors(sceneOf(), fixtures)).toEqual([]);
  });

  test.each([
    ['scene-name-missing', sceneOf({name: '  '})],
    ['scene-name-too-long', sceneOf({name: 'x'.repeat(41)})],
    ['scene-fixtures-missing', sceneOf({fixtures: []})],
    ['scene-fixture-unknown', sceneOf({fixtures: [{fixtureId: 'laser', values: [{offset: 0, value: 1}]}]})],
    [
      'scene-fixture-twice',
      sceneOf({
        fixtures: [
          {fixtureId: 'smoke', values: [{offset: 0, value: 1}]},
          {fixtureId: 'smoke', values: [{offset: 0, value: 2}]}
        ]
      })
    ],
    ['scene-channels-missing', sceneOf({fixtures: [{fixtureId: 'smoke', values: []}]})],
    ['scene-channel-unknown', sceneOf({fixtures: [{fixtureId: 'smoke', values: [{offset: 1, value: 1}]}]})],
    [
      'scene-channel-twice',
      sceneOf({
        fixtures: [
          {
            fixtureId: 'par',
            values: [
              {offset: 0, value: 1},
              {offset: 0, value: 2}
            ]
          }
        ]
      })
    ],
    ['scene-value-invalid', sceneOf({fixtures: [{fixtureId: 'smoke', values: [{offset: 0, value: 256}]}]})]
  ])('%s', (type, scene) => {
    expect(sceneErrors(scene, fixtures)).toEqual([{type}]);
  });

  test('a problem on several fixtures is named once', () => {
    const scene = sceneOf({
      fixtures: [
        {fixtureId: 'par', values: [{offset: 0, value: 300}]},
        {fixtureId: 'smoke', values: [{offset: 0, value: -1}]}
      ]
    });

    expect(sceneErrors(scene, fixtures)).toEqual([{type: 'scene-value-invalid'}]);
  });

  test('accepts a stored color, reports any other', () => {
    expect(sceneErrors(sceneOf({color: '#ff8800'}), fixtures)).toEqual([]);
    expect(sceneErrors(sceneOf({color: '#FF8800'}), fixtures)).toEqual([{type: 'scene-color-invalid'}]);
    expect(sceneErrors(sceneOf({color: 'orange'}), fixtures)).toEqual([{type: 'scene-color-invalid'}]);
  });
});

describe('scene values and value rules', () => {
  test('a scene value must be one its channel stops at', () => {
    const gobo: Fixture = {
      id: 'gobo',
      name: 'Gobo',
      startAddress: 20,
      channels: [{name: 'Wheel', offset: 0, values: {mode: 'positions', positions: [{value: 5}, {value: 200}]}}]
    };
    const sceneSetting = (value: number) => sceneOf({fixtures: [{fixtureId: 'gobo', values: [{offset: 0, value}]}]});

    expect(sceneErrors(sceneSetting(5), [gobo])).toEqual([]);
    expect(sceneErrors(sceneSetting(6), [gobo])).toEqual([{type: 'scene-value-invalid'}]);
  });
});

describe('scenesAreValid', () => {
  test('valid scenes, or none at all', () => {
    expect(scenesAreValid(setupOf(undefined))).toBe(true);
    expect(scenesAreValid(setupOf([sceneOf(), sceneOf({id: 'outro', name: 'Outro'})]))).toBe(true);
  });

  test('not with two scenes sharing an id, or an invalid scene', () => {
    expect(scenesAreValid(setupOf([sceneOf(), sceneOf({name: 'Outro'})]))).toBe(false);
    expect(scenesAreValid(setupOf([sceneOf({name: ''})]))).toBe(false);
  });
});
