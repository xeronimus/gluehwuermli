import type {Fixture, Scene} from '@shared/ipc';

import {type ChaseDraft} from './chaseDraft';
import {currentFixturesChannelValues, stepFillEffect, withStepValuesTaken} from './chaseStepFill';
import {presetChannelValues} from './presets';
import {sceneChannelValues} from './scenes';

const spot: Fixture = {
  id: 'spot',
  name: 'Spot',
  startAddress: 10,
  channels: [
    {name: 'Dimmer', offset: 0, values: {mode: 'steps', min: 0, max: 255, step: 64}},
    {name: 'Red', offset: 1}
  ],
  presets: [
    {id: 'full', name: 'Full', values: [{offset: 0, value: 255}]},
    {id: 'red', name: 'Red', values: [{offset: 1, value: 200}]}
  ]
};

const laser: Fixture = {
  id: 'laser',
  name: 'Laser',
  startAddress: 1,
  channels: [{name: 'Mode', offset: 0}]
};

const fixtures = [spot, laser];

/** a universe with channel n at n, so each value tells its channel */
const channelValues = Array.from({length: 512}, (_, index) => (index + 1) % 256);

const counter = () => {
  let next = 0;
  return () => `new-${next++}`;
};

const draftWithStep = (values: {channel: string; value: string}[]): ChaseDraft => ({
  name: 'Chorus',
  repeatType: 'once',
  repeatCount: '2',
  referenceBpm: '',
  steps: [
    {id: 'first', fade: '0.00', hold: '1.00', values: values.map((value, index) => ({id: `row-${index}`, ...value}))},
    {id: 'second', fade: '0.00', hold: '1.00', values: [{id: 'other', channel: '10', value: '1'}]}
  ]
});

describe('currentFixturesChannelValues', () => {
  test('every channel of the checked fixtures, on its address, at its value now', () => {
    expect(currentFixturesChannelValues(fixtures, ['spot'], channelValues)).toEqual([
      {channel: 10, value: 10},
      {channel: 11, value: 11}
    ]);
  });

  test('not fitted to the value rules: a step may send what the fader can not', () => {
    const values = channelValues.with(9, 37);
    expect(currentFixturesChannelValues([spot], ['spot'], values)).toContainEqual({channel: 10, value: 37});
  });

  test('in the order of the fixture list, unchecked and unknown fixtures left out', () => {
    expect(currentFixturesChannelValues(fixtures, ['laser', 'gone', 'spot'], channelValues)).toEqual([
      {channel: 10, value: 10},
      {channel: 11, value: 11},
      {channel: 1, value: 1}
    ]);
    expect(currentFixturesChannelValues(fixtures, [], channelValues)).toEqual([]);
  });
});

describe('a preset taken', () => {
  test("its values land on its fixture's addresses", () => {
    const moved = {...spot, startAddress: 100};
    const red = moved.presets?.[1];
    expect(red && presetChannelValues(moved, red)).toEqual([{channel: 101, value: 200}]);
  });
});

describe('a scene turned into absolute channels when taken', () => {
  const scene: Scene = {
    id: 'look',
    name: 'Look',
    fixtures: [
      {fixtureId: 'spot', values: [{offset: 1, value: 50}]},
      {fixtureId: 'laser', values: [{offset: 0, value: 9}]}
    ]
  };

  test('on the addresses the fixtures have at the time of taking', () => {
    expect(sceneChannelValues(scene, [{...spot, startAddress: 20}, laser])).toEqual([
      {channel: 21, value: 50},
      {channel: 1, value: 9}
    ]);
  });
});

describe('withStepValuesTaken', () => {
  test('a channel the step sets takes the new value, a new channel is added, the others stay', () => {
    const draft = draftWithStep([
      {channel: '5', value: '1'},
      {channel: '11', value: '2'}
    ]);

    const taken = withStepValuesTaken(
      draft,
      0,
      [
        {channel: 11, value: 200},
        {channel: 7, value: 70}
      ],
      counter()
    );

    expect(taken.steps[0]?.values).toEqual([
      {id: 'row-0', channel: '5', value: '1'},
      {id: 'new-0', channel: '7', value: '70'},
      {id: 'row-1', channel: '11', value: '200'}
    ]);
  });

  test('taking twice builds the step up', () => {
    const newId = counter();
    const once = withStepValuesTaken(draftWithStep([]), 0, [{channel: 10, value: 255}], newId);
    const twice = withStepValuesTaken(
      once,
      0,
      [
        {channel: 11, value: 200},
        {channel: 10, value: 128}
      ],
      newId
    );

    expect(twice.steps[0]?.values).toEqual([
      {id: 'new-0', channel: '10', value: '128'},
      {id: 'new-1', channel: '11', value: '200'}
    ]);
  });

  test('a channel taken twice at once gets one row, with the last value', () => {
    const taken = withStepValuesTaken(
      draftWithStep([]),
      0,
      [
        {channel: 3, value: 1},
        {channel: 3, value: 2}
      ],
      counter()
    );

    expect(taken.steps[0]?.values).toEqual([{id: 'new-0', channel: '3', value: '2'}]);
  });

  test('a row with a channel that is not a number stays, after the others', () => {
    const taken = withStepValuesTaken(
      draftWithStep([{channel: '', value: '4'}]),
      0,
      [{channel: 2, value: 9}],
      counter()
    );

    expect(taken.steps[0]?.values).toEqual([
      {id: 'new-0', channel: '2', value: '9'},
      {id: 'row-0', channel: '', value: '4'}
    ]);
  });

  test('the other steps and an unknown step index change nothing', () => {
    const draft = draftWithStep([]);

    expect(withStepValuesTaken(draft, 0, [{channel: 1, value: 1}], counter()).steps[1]).toBe(draft.steps[1]);
    expect(withStepValuesTaken(draft, 5, [{channel: 1, value: 1}], counter())).toEqual(draft);
  });
});

describe('stepFillEffect', () => {
  const rows = [
    {id: 'a', channel: '1', value: '10'},
    {id: 'b', channel: '2', value: '20'},
    {id: 'c', channel: '', value: '30'}
  ];

  test('names the rows whose value changes and counts the channels added', () => {
    expect(
      stepFillEffect(rows, [
        {channel: 1, value: 11},
        {channel: 2, value: 20},
        {channel: 3, value: 0},
        {channel: 3, value: 1}
      ])
    ).toEqual({changedIds: ['a'], addedCount: 1});
  });

  test('nothing taken changes nothing', () => {
    expect(stepFillEffect(rows, [])).toEqual({changedIds: [], addedCount: 0});
  });
});
