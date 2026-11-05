import type {Fixture} from '@shared/ipc';

import {
  activeLimits,
  cappedValue,
  channelsAboveLimits,
  clampedChannelValues,
  isAtCap,
  isChannelLockOn,
  isFaderLocked,
  isPresetLocked,
  isSceneCapped,
  liftedLimits
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

  test('the lifted caps: none while on or unknown, the fixtures caps once lifted', () => {
    expect(liftedLimits([laserBox], {mode: 'show', passwordSet: false, channelLocked: true})).toEqual(new Map());
    expect(liftedLimits([laserBox], undefined)).toEqual(new Map());
    expect(liftedLimits([laserBox], {mode: 'setup', passwordSet: true, channelLocked: false})).toEqual(limits);
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

describe('isSceneCapped', () => {
  const sceneOf = (values: {offset: number; value: number}[]) => ({
    id: 'show',
    name: 'Show',
    fixtures: [{fixtureId: 'box', values}]
  });

  test('a scene setting a channel above its cap is capped', () => {
    expect(isSceneCapped(sceneOf([{offset: 1, value: 255}]), [laserBox], limits)).toBe(true);
  });

  test('within the caps, without caps, or on a fixture that is gone, it is not', () => {
    expect(isSceneCapped(sceneOf([{offset: 2, value: 50}]), [laserBox], limits)).toBe(false);
    expect(isSceneCapped(sceneOf([{offset: 1, value: 255}]), [laserBox], new Map())).toBe(false);
    expect(isSceneCapped(sceneOf([{offset: 1, value: 255}]), [], limits)).toBe(false);
  });
});

describe('isFaderLocked and isAtCap', () => {
  test('only a cap of 0 locks the fader, a higher one leaves the range below it', () => {
    expect(isFaderLocked(0)).toBe(true);
    expect(isFaderLocked(50)).toBe(false);
    expect(isFaderLocked(undefined)).toBe(false);
  });

  test('at or above the cap the fader is at its cap; without one, never', () => {
    expect(isAtCap(50, 50)).toBe(true);
    expect(isAtCap(49, 50)).toBe(false);
    expect(isAtCap(0, 0)).toBe(true);
    expect(isAtCap(255, undefined)).toBe(false);
  });
});
