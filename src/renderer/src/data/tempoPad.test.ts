import {beatAnimation, shownBpm} from './tempoPad';

const at120 = {type: 'set', bpm: 120, beatMs: 500, sinceBeatMs: 100} as const;

test('no animation and no BPM without a tempo', () => {
  expect(beatAnimation({type: 'none'}, 0, 1000)).toBeUndefined();
  expect(shownBpm({type: 'none'})).toBeUndefined();
});

test('one beat long, started as far into the beat as it is now', () => {
  expect(beatAnimation(at120, 1000, 1050)).toEqual({durationMs: 500, delayMs: -150});
});

test('the delay wraps within a beat', () => {
  expect(beatAnimation(at120, 1000, 1450)).toEqual({durationMs: 500, delayMs: -50});
});

test('the BPM is rounded', () => {
  expect(shownBpm({...at120, bpm: 127.6})).toBe(128);
});
