import type {Fixture} from '@shared/ipc';

import {withFixture, withoutFixture} from './fixtureList';

const fixtureOf = (id: string, name: string): Fixture => ({
  id,
  name,
  startAddress: 1,
  channels: [{name: 'Dimmer', offset: 0}]
});

const left = fixtureOf('left', 'PAR left');
const right = fixtureOf('right', 'PAR right');

test('a new fixture is appended', () => {
  expect(withFixture([left], right)).toEqual([left, right]);
});

test('an edited fixture replaces the one with its id, in place', () => {
  const renamed = fixtureOf('left', 'PAR stage left');

  expect(withFixture([left, right], renamed)).toEqual([renamed, right]);
});

test('removes the fixture with the id, an unknown id changes nothing', () => {
  expect(withoutFixture([left, right], 'left')).toEqual([right]);
  expect(withoutFixture([left, right], 'smoke')).toEqual([left, right]);
});
