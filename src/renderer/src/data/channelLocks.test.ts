import type {Fixture} from '@shared/ipc';

import {
  activeLimits,
  cappedValue,
  channelsAboveLimits,
  clampedChannelValues,
  isChannelLockOn,
  isPresetLocked
} from './channelLocks';

const laserBox: Fixture = {
  id: 'box',
  name: 'LightBox',
  startAddress: 20,
  channels: [
    {name: 'Dimmer', offset: 0},
    {name: 'Laser', offset: 1, lock: {max: 0}},
    {name: 'Macro', offset: 2, lock: {max: 50}}
  ]
};
const limits = new Map([
  [21, 0],
  [22, 50]
]);

describe('isChannelLockOn and activeLimits', () => {
  test('on until lifted, in either mode, and while the status is unknown', () => {
    expect(isChannelLockOn({mode: 'show', passwordSet: true, channelLocked: true})).toBe(true);
    expect(isChannelLockOn(undefined)).toBe(true);
    expect(isChannelLockOn({mode: 'show', passwordSet: true, channelLocked: false})).toBe(false);
    expect(isChannelLockOn({mode: 'setup', passwordSet: true, channelLocked: false})).toBe(false);
  });

  test('the fixtures caps while on, none once lifted', () => {
    expect(activeLimits([laserBox], {mode: 'show', passwordSet: false, channelLocked: true})).toEqual(limits);
    expect(activeLimits([laserBox], {mode: 'show', passwordSet: true, channelLocked: false})).toEqual(new Map());
  });
});

describe('capping values', () => {
  test('a value above the limit drops to it, one below and one without a limit stay', () => {
    expect(cappedValue(200, 50)).toBe(50);
    expect(cappedValue(20, 50)).toBe(20);
    expect(cappedValue(200, undefined)).toBe(200);
  });

  test('clamps every channel of a list to its limit', () => {
    expect(
      clampedChannelValues(
        [
          {channel: 20, value: 255},
          {channel: 21, value: 255},
          {channel: 22, value: 100}
        ],
        limits
      )
    ).toEqual([
      {channel: 20, value: 255},
      {channel: 21, value: 0},
      {channel: 22, value: 50}
    ]);
  });

  test('lists only the channels above their limit, at their limit', () => {
    const channelValues = Array.from({length: 512}, (_, index) => (index === 20 ? 255 : index === 21 ? 30 : 0));

    expect(channelsAboveLimits(channelValues, limits)).toEqual([{channel: 21, value: 0}]);
  });
});

describe('isPresetLocked', () => {
  const presetOf = (values: {offset: number; value: number}[]) => ({id: 'p', name: 'P', values});

  test('a preset setting a channel above its cap is locked', () => {
    expect(isPresetLocked(laserBox, presetOf([{offset: 1, value: 255}]), limits)).toBe(true);
    expect(isPresetLocked(laserBox, presetOf([{offset: 2, value: 100}]), limits)).toBe(true);
  });

  test('a preset setting locked channels within their cap, or none, is not', () => {
    expect(
      isPresetLocked(
        laserBox,
        presetOf([
          {offset: 1, value: 0},
          {offset: 2, value: 0}
        ]),
        limits
      )
    ).toBe(false);
    expect(isPresetLocked(laserBox, presetOf([{offset: 0, value: 255}]), limits)).toBe(false);
    expect(isPresetLocked(laserBox, presetOf([{offset: 1, value: 255}]), new Map())).toBe(false);
  });
});
