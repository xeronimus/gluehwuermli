import {
  FULL_RANGE,
  channelStops,
  channelValueRules,
  isValidChannelValue,
  isValidValueOf,
  nearestStop,
  nextStop,
  previousStop,
  sameValueRules,
  valueRange,
  valueRulesErrors
} from './channelValueRules';
import type {ChannelValues, Fixture} from './ipc';

const dimmer: ChannelValues = {mode: 'continuous', min: 100, max: 255};
const strobe: ChannelValues = {mode: 'steps', min: 10, max: 100, step: 25};
const gobo: ChannelValues = {
  mode: 'positions',
  positions: [{value: 200, name: 'Star'}, {value: 5, name: 'Open'}, {value: 6}]
};

describe('channelValueRules', () => {
  test('a channel without rules, as in a file from before them, goes from 0 to 255', () => {
    expect(channelValueRules({})).toEqual(FULL_RANGE);
    expect(valueRange(FULL_RANGE)).toEqual({min: 0, max: 255});
    expect(channelValueRules({values: dimmer})).toEqual(dimmer);
  });
});

describe('valueRulesErrors', () => {
  test('valid rules have none', () => {
    expect(valueRulesErrors(dimmer)).toEqual([]);
    expect(valueRulesErrors(strobe)).toEqual([]);
    expect(valueRulesErrors(gobo)).toEqual([]);
    expect(valueRulesErrors({mode: 'continuous', min: 7, max: 7})).toEqual([]);
  });

  test.each<[string, ChannelValues]>([
    ['values-invalid', {mode: 'continuous', min: Number.NaN, max: 255}],
    ['values-invalid', {mode: 'steps', min: 0, max: 300, step: 5}],
    ['values-invalid', {mode: 'positions', positions: [{value: 1.5}, {value: 3}]}],
    ['values-min-above-max', {mode: 'continuous', min: 200, max: 100}],
    ['values-step-invalid', {mode: 'steps', min: 0, max: 255, step: 0}],
    ['values-step-invalid', {mode: 'steps', min: 0, max: 255, step: 2.5}],
    ['values-positions-too-few', {mode: 'positions', positions: [{value: 5}]}],
    ['values-position-twice', {mode: 'positions', positions: [{value: 5}, {value: 5, name: 'Again'}]}],
    ['values-position-name-too-long', {mode: 'positions', positions: [{value: 5, name: 'x'.repeat(21)}, {value: 6}]}]
  ])('reports %s', (type, rules) => {
    expect(valueRulesErrors(rules)).toContain(type);
  });
});

describe('channelStops', () => {
  test('continuous: every value from min to max', () => {
    expect(channelStops({mode: 'continuous', min: 3, max: 6})).toEqual([3, 4, 5, 6]);
  });

  test('steps: from min by the step size, and always max, also when the step does not divide the range', () => {
    expect(channelStops(strobe)).toEqual([10, 35, 60, 85, 100]);
    expect(channelStops({mode: 'steps', min: 0, max: 100, step: 50})).toEqual([0, 50, 100]);
  });

  test('positions: their values, lowest first', () => {
    expect(channelStops(gobo)).toEqual([5, 6, 200]);
    expect(valueRange(gobo)).toEqual({min: 5, max: 200});
  });

  test('rules with errors stop everywhere from 0 to 255 instead of looping', () => {
    expect(channelStops({mode: 'steps', min: 0, max: 255, step: 0})).toHaveLength(256);
  });
});

describe('moving between stops', () => {
  test('a value snaps to the nearest stop, halfway between two to the lower one', () => {
    expect(nearestStop(gobo, 0)).toBe(5);
    expect(nearestStop(gobo, 102)).toBe(6);
    expect(nearestStop(gobo, 103)).toBe(6);
    expect(nearestStop(gobo, 104)).toBe(200);
    expect(nearestStop(dimmer, 30)).toBe(100);
    expect(nearestStop(dimmer, 180)).toBe(180);
  });

  test('the next and the previous stop, also from a value off the stops', () => {
    expect(nextStop(strobe, 10)).toBe(35);
    expect(nextStop(strobe, 0)).toBe(10);
    expect(nextStop(strobe, 40)).toBe(60);
    expect(previousStop(strobe, 40)).toBe(35);
    expect(previousStop(strobe, 255)).toBe(100);
    expect(nextStop(dimmer, 100)).toBe(101);
  });

  test('nothing above max or below min', () => {
    expect(nextStop(strobe, 100)).toBeUndefined();
    expect(previousStop(strobe, 10)).toBeUndefined();
    expect(previousStop(dimmer, 0)).toBeUndefined();
  });

  test('a value is valid when the fader stops at it', () => {
    expect(isValidChannelValue(gobo, 6)).toBe(true);
    expect(isValidChannelValue(gobo, 7)).toBe(false);
    expect(isValidChannelValue(strobe, 100)).toBe(true);
    expect(isValidChannelValue(strobe, 50)).toBe(false);
  });
});

describe('isValidValueOf', () => {
  const fixture: Fixture = {
    id: 'spot',
    name: 'Spot',
    startAddress: 1,
    channels: [
      {name: 'Dimmer', offset: 0},
      {name: 'Gobo', offset: 1, values: gobo}
    ]
  };

  test('checks the value against the channel with the offset', () => {
    expect(isValidValueOf(fixture, 0, 17)).toBe(true);
    expect(isValidValueOf(fixture, 1, 17)).toBe(false);
    expect(isValidValueOf(fixture, 1, 200)).toBe(true);
  });

  test('a value outside 0 to 255 is never valid; one on an unknown channel only needs to be a DMX value', () => {
    expect(isValidValueOf(fixture, 0, 256)).toBe(false);
    expect(isValidValueOf(fixture, 9, 17)).toBe(true);
    expect(isValidValueOf(fixture, 9, -1)).toBe(false);
  });
});

describe('sameValueRules', () => {
  test('rules stopping at the same values are the same, whatever their mode or position names', () => {
    expect(sameValueRules(FULL_RANGE, {mode: 'steps', min: 0, max: 255, step: 1})).toBe(true);
    expect(sameValueRules(gobo, {mode: 'positions', positions: [{value: 6}, {value: 200}, {value: 5}]})).toBe(true);
  });

  test('rules stopping at other values differ, also against a channel without rules', () => {
    expect(sameValueRules(FULL_RANGE, dimmer)).toBe(false);
    expect(sameValueRules(strobe, {...strobe, step: 30})).toBe(false);
  });
});
