import {
  channelValueOf,
  fadersFor,
  glowLevel,
  isChannelChange,
  toDmxValue,
  toPercent,
  withChannelValue,
  withChannelValues
} from './channelValues';

describe('toDmxValue', () => {
  test('rounds and clamps a slider position', () => {
    expect(toDmxValue(127.6)).toBe(128);
    expect(toDmxValue(-3)).toBe(0);
    expect(toDmxValue(300)).toBe(255);
  });
});

describe('glowLevel', () => {
  test('no glow at 0, full glow at 255, in between in proportion', () => {
    expect(glowLevel(0)).toBe(0);
    expect(glowLevel(255)).toBe(1);
    expect(glowLevel(51)).toBeCloseTo(0.2);
  });

  test('follows the range of a fader with value rules: none at its min and below, full at its max', () => {
    expect(glowLevel(100, {min: 100, max: 200})).toBe(0);
    expect(glowLevel(0, {min: 100, max: 200})).toBe(0);
    expect(glowLevel(150, {min: 100, max: 200})).toBeCloseTo(0.5);
    expect(glowLevel(200, {min: 100, max: 200})).toBe(1);
    expect(glowLevel(7, {min: 7, max: 7})).toBe(1);
    expect(glowLevel(0, {min: 7, max: 7})).toBe(0);
  });

  test('stays within 0..1 for a value out of range', () => {
    expect(glowLevel(-5)).toBe(0);
    expect(glowLevel(300)).toBe(1);
  });
});

describe('toPercent', () => {
  test('maps 0..255 to 0..100', () => {
    expect(toPercent(0)).toBe(0);
    expect(toPercent(128)).toBe(50);
    expect(toPercent(255)).toBe(100);
  });
});

describe('withChannelValue', () => {
  test('sets the channel, numbered from 1, in a copy', () => {
    const channelValues = [0, 0, 0];

    expect(withChannelValue(channelValues, 2, 200)).toEqual([0, 200, 0]);
    expect(channelValues).toEqual([0, 0, 0]);
  });

  test('a channel outside the values changes nothing', () => {
    expect(withChannelValue([1, 2], 5, 200)).toEqual([1, 2]);
  });
});

describe('withChannelValues', () => {
  test('sets every channel in one copy, leaves the others and ignores channels outside the values', () => {
    const channelValues = [0, 0, 0];

    expect(
      withChannelValues(channelValues, [
        {channel: 1, value: 10},
        {channel: 3, value: 30},
        {channel: 9, value: 90}
      ])
    ).toEqual([10, 0, 30]);
    expect(channelValues).toEqual([0, 0, 0]);
  });
});

describe('channelValueOf', () => {
  test('reads the channel, 0 for a channel outside the values', () => {
    expect(channelValueOf([10, 20], 2)).toBe(20);
    expect(channelValueOf([10, 20], 3)).toBe(0);
  });
});

describe('isChannelChange', () => {
  test('a different value is a change, the same one is not', () => {
    expect(isChannelChange([10, 20], 2, 21)).toBe(true);
    expect(isChannelChange([10, 20], 2, 20)).toBe(false);
  });

  test('a channel outside the values counts as 0', () => {
    expect(isChannelChange([10, 20], 3, 0)).toBe(false);
    expect(isChannelChange([10, 20], 3, 5)).toBe(true);
  });
});

describe('fadersFor', () => {
  test('one fader per consecutive channel', () => {
    expect(fadersFor(5, 2)).toEqual([
      {channel: 5, label: '5'},
      {channel: 6, label: '6'}
    ]);
  });
});
