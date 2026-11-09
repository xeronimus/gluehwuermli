import type {ChaseError} from '@shared/chases';
import type {Fixture} from '@shared/ipc';

import {chaseStepGroups, groupValueIndexes, positionNameOf, rowErrors, stepWideErrors} from './chaseStepTable';

const par: Fixture = {
  id: 'par',
  name: 'PAR',
  startAddress: 10,
  channels: [
    {name: 'Red', offset: 0, color: '#ff0000'},
    {name: 'Green', offset: 1}
  ]
};

const wash: Fixture = {
  id: 'wash',
  name: 'Wash',
  startAddress: 11,
  channels: [
    {name: 'Dimmer', offset: 0},
    {
      name: 'Gobo',
      offset: 1,
      values: {mode: 'positions', positions: [{value: 0, name: 'Open'}, {value: 20}]}
    }
  ]
};

const rows = [
  {id: 'a', channel: '1', value: '0'},
  {id: 'b', channel: '10', value: '255'},
  {id: 'c', channel: '11', value: '0'},
  {id: 'd', channel: '', value: '3'}
];

/** each group as its heading and the ids of its rows with the name of their channel there */
const shown = (groups: ReturnType<typeof chaseStepGroups>) =>
  groups.map((group) => [
    group.kind === 'fixture' ? group.fixture.name : 'Unassigned',
    group.rows.map(({value, channel}) => `${value.id}:${channel?.name ?? '-'}`)
  ]);

test('groups the rows under the fixtures using their addresses, a shared one under each, the rest unassigned', () => {
  expect(shown(chaseStepGroups([par, wash], rows))).toEqual([
    ['PAR', ['b:Red', 'c:Green']],
    ['Wash', ['c:Dimmer']],
    ['Unassigned', ['a:-', 'd:-']]
  ]);
});

test('no fixtures, no values: every row unassigned, and no groups at all', () => {
  expect(shown(chaseStepGroups([], rows))).toEqual([['Unassigned', ['a:-', 'b:-', 'c:-', 'd:-']]]);
  expect(chaseStepGroups([par], [])).toEqual([]);
});

test('a row whose channel is being typed stays under the heading it had, without a channel name once typed away', () => {
  const typed = rows.with(1, {id: 'b', channel: '1', value: '255'});

  expect(shown(chaseStepGroups([par, wash], typed, {id: 'b', channel: '10'}))).toEqual([
    ['PAR', ['b:-', 'c:Green']],
    ['Wash', ['c:Dimmer']],
    ['Unassigned', ['a:-', 'd:-']]
  ]);
  expect(shown(chaseStepGroups([par, wash], typed))[0]).toEqual(['PAR', ['c:Green']]);
});

test('a group knows where its rows are in the step', () => {
  const [parGroup] = chaseStepGroups([par], rows);

  expect(parGroup && groupValueIndexes(parGroup)).toEqual([1, 2]);
});

test('names a value on a named position only', () => {
  const gobo = wash.channels[1];

  expect(positionNameOf(gobo, '0')).toBe('Open');
  expect(positionNameOf(gobo, '20')).toBeUndefined();
  expect(positionNameOf(gobo, '7')).toBeUndefined();
  expect(positionNameOf(wash.channels[0], '0')).toBeUndefined();
  expect(positionNameOf(undefined, '0')).toBeUndefined();
});

test("splits a step's problems into those of a row and those of the step", () => {
  const errors: ChaseError[] = [
    {type: 'chase-step-hold-invalid'},
    {type: 'chase-step-values-missing'},
    {type: 'chase-step-channel-twice', valueIndexes: [0, 2]},
    {type: 'chase-step-value-invalid', valueIndexes: [2]}
  ];

  expect(rowErrors(errors, 2).map(({type}) => type)).toEqual(['chase-step-channel-twice', 'chase-step-value-invalid']);
  expect(rowErrors(errors, 1)).toEqual([]);
  expect(stepWideErrors(errors)).toEqual([{type: 'chase-step-hold-invalid'}]);
});
