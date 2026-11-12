import type {ChaseStepValueDraft} from './chaseDraft';
import {stepOnRigValues} from './chaseStepOnRig';

const row = (id: string, channel: string, value: string): ChaseStepValueDraft => ({id, channel, value});

test('the valid rows, sorted by channel', () => {
  expect(stepOnRigValues([row('a', '12', '255'), row('b', '3', '0'), row('c', ' 7 ', '128')], undefined)).toEqual([
    {channel: 3, value: 0},
    {channel: 7, value: 128},
    {channel: 12, value: 255}
  ]);
});

test('a channel or value out of range or not a number is left out', () => {
  expect(
    stepOnRigValues(
      [
        row('a', '0', '10'),
        row('b', '513', '10'),
        row('c', 'x', '10'),
        row('d', '', '10'),
        row('e', '2.5', '10'),
        row('f', '4', '256'),
        row('g', '5', '-1'),
        row('h', '6', ''),
        row('i', '8', '9')
      ],
      undefined
    )
  ).toEqual([{channel: 8, value: 9}]);
});

test('the row whose channel is being typed is left out', () => {
  expect(stepOnRigValues([row('a', '5', '100'), row('b', '6', '200')], {id: 'a', channel: '5'})).toEqual([
    {channel: 6, value: 200}
  ]);
});

test('a channel set twice sends its first row', () => {
  expect(stepOnRigValues([row('a', '5', '100'), row('b', '5', '200')], undefined)).toEqual([{channel: 5, value: 100}]);
});

test('an empty step sends nothing', () => {
  expect(stepOnRigValues([], undefined)).toEqual([]);
});
