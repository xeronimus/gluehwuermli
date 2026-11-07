import type {Fixture} from '@shared/ipc';

import {capturePreset, fittedFixtureValues, presetChannelValues, withPreset} from './presets';

const spot: Fixture = {
  id: 'spot',
  name: 'Spot',
  startAddress: 10,
  channels: [
    {name: 'Dimmer', offset: 0},
    {name: 'Red', offset: 1},
    {name: 'Green', offset: 2},
    {name: 'Blue', offset: 3}
  ]
};

const warm = {
  id: 'warm',
  name: 'Warm',
  values: [
    {offset: 0, value: 255},
    {offset: 2, value: 180}
  ]
};

describe('presetChannelValues', () => {
  test('a partial preset sets only its channels, on their absolute addresses', () => {
    expect(presetChannelValues(spot, warm)).toEqual([
      {channel: 10, value: 255},
      {channel: 12, value: 180}
    ]);
  });

  test('follows the start address', () => {
    expect(presetChannelValues({...spot, startAddress: 100}, warm)).toEqual([
      {channel: 100, value: 255},
      {channel: 102, value: 180}
    ]);
  });

  test('skips an offset the fixture has no channel for', () => {
    expect(presetChannelValues(spot, {...warm, values: [{offset: 9, value: 1}]})).toEqual([]);
  });
});

describe('capturePreset', () => {
  test('captures every channel of the fixture at its current value', () => {
    const channelValues = Array<number>(512).fill(0);
    channelValues[9] = 200;
    channelValues[11] = 40;

    expect(capturePreset(spot, channelValues, 'now', ' Now ')).toEqual({
      id: 'now',
      name: 'Now',
      values: [
        {offset: 0, value: 200},
        {offset: 1, value: 0},
        {offset: 2, value: 40},
        {offset: 3, value: 0}
      ]
    });
  });
});

describe('fitting to value rules', () => {
  const gobo: Fixture = {
    ...spot,
    channels: [
      {name: 'Gobo', offset: 0, values: {mode: 'positions', positions: [{value: 5}, {value: 6}, {value: 200}]}}
    ]
  };

  test('captures a value off the positions as the nearest position', () => {
    const channelValues = Array<number>(512).fill(0);
    channelValues[9] = 150;

    expect(capturePreset(gobo, channelValues, 'now', 'Now').values).toEqual([{offset: 0, value: 200}]);
  });

  test('fits values to the nearest valid one, an offset without a channel stays as it is', () => {
    expect(
      fittedFixtureValues(gobo, [
        {offset: 0, value: 90},
        {offset: 7, value: 90}
      ])
    ).toEqual([
      {offset: 0, value: 6},
      {offset: 7, value: 90}
    ]);
  });
});

describe('withPreset', () => {
  test('appends the preset to that fixture only', () => {
    const other = {...spot, id: 'other'};

    expect(withPreset([spot, other], 'spot', warm)).toEqual([{...spot, presets: [warm]}, other]);
    expect(withPreset([{...spot, presets: [warm]}], 'spot', warm)[0].presets).toEqual([warm, warm]);
  });
});
