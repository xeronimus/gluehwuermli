import type {Chase, ChaseRepeat} from '@shared/ipc';

import {chasePosition, lastPosition, passDurationMs, stepsBetween} from './chasePosition';

/** three steps of 100, 200 and 300 ms: a pass takes 600 ms */
const chaseOf = (repeat: ChaseRepeat): Chase => ({
  id: 'chase',
  name: 'Chorus',
  repeat,
  steps: [
    {id: 's1', holdMs: 100, values: [{channel: 1, value: 255}]},
    {id: 's2', holdMs: 200, values: [{channel: 2, value: 255}]},
    {id: 's3', holdMs: 300, values: [{channel: 3, value: 255}]}
  ]
});

const once = chaseOf({type: 'once'});
const threeTimes = chaseOf({type: 'times', count: 3});
const forever = chaseOf({type: 'forever'});

test('a pass takes the sum of the holds', () => {
  expect(passDurationMs(once)).toBe(600);
});

test.each([
  [0, 0],
  [99, 0],
  [100, 1],
  [299, 1],
  [300, 2],
  [599, 2]
])('after %i ms the first pass shows step %i', (elapsedMs, stepIndex) => {
  expect(chasePosition(once, elapsedMs)).toEqual({type: 'playing', stepIndex, passIndex: 0});
});

test('a chase that plays once is finished when the last hold is over', () => {
  expect(chasePosition(once, 600)).toEqual({type: 'finished'});
});

test('a chase repeating 3 times plays exactly 3 passes', () => {
  expect(chasePosition(threeTimes, 600)).toEqual({type: 'playing', stepIndex: 0, passIndex: 1});
  expect(chasePosition(threeTimes, 1799)).toEqual({type: 'playing', stepIndex: 2, passIndex: 2});
  expect(chasePosition(threeTimes, 1800)).toEqual({type: 'finished'});
});

test('a chase looping until stopped is still on time after many passes', () => {
  const tenThousandPasses = 10_000 * 600;

  expect(chasePosition(forever, tenThousandPasses + 100)).toEqual({
    type: 'playing',
    stepIndex: 1,
    passIndex: 10_000
  });
  expect(chasePosition(forever, tenThousandPasses + 99)).toEqual({
    type: 'playing',
    stepIndex: 0,
    passIndex: 10_000
  });
});

test('a time before the start is the first step', () => {
  expect(chasePosition(once, -5)).toEqual({type: 'playing', stepIndex: 0, passIndex: 0});
});

test('counts the steps between two positions across passes', () => {
  expect(stepsBetween(forever, {stepIndex: 2, passIndex: 0}, {stepIndex: 0, passIndex: 1})).toBe(1);
  expect(stepsBetween(forever, {stepIndex: 1, passIndex: 0}, {stepIndex: 1, passIndex: 2})).toBe(6);
  expect(stepsBetween(forever, {stepIndex: 1, passIndex: 0}, {stepIndex: 1, passIndex: 0})).toBe(0);
});

test('the last position is the last step of the last pass', () => {
  expect(lastPosition(threeTimes)).toEqual({stepIndex: 2, passIndex: 2});
});
