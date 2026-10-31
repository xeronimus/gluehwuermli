import {describeOverlap} from './fixtureOverlaps';

const fixtureOf = (name: string) => ({id: name, name, startAddress: 1, channels: [{name: 'Dimmer', offset: 0}]});

test('names both fixtures and the shared addresses', () => {
  const first = fixtureOf('PAR');
  const second = fixtureOf('Smoke');

  expect(describeOverlap({first, second, addresses: [12]})).toBe('PAR and Smoke share address 12');
  expect(describeOverlap({first, second, addresses: [12, 13]})).toBe('PAR and Smoke share addresses 12, 13');
});
