import {channelValueOf, fadersFor, toDmxValue, toPercent, withChannelValue} from './channelValues';

describe('toDmxValue', () => {
  test('rounds and clamps a slider position', () => {
    expect(toDmxValue(127.6)).toBe(128);
    expect(toDmxValue(-3)).toBe(0);
    expect(toDmxValue(300)).toBe(255);
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

describe('channelValueOf', () => {
  test('reads the channel, 0 for a channel outside the values', () => {
    expect(channelValueOf([10, 20], 2)).toBe(20);
    expect(channelValueOf([10, 20], 3)).toBe(0);
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
