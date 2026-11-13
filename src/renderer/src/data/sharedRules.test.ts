import type {ChannelValues, Fixture} from '@shared/ipc';

import {rulesSharedWith, withSharedRules} from './sharedRules';

const inSteps: ChannelValues = {mode: 'steps', min: 0, max: 200, step: 100};
const gobo: ChannelValues = {
  mode: 'positions',
  positions: [{value: 0, name: 'Open'}, {value: 100, name: 'Star', momentary: true}, {value: 200}],
  display: 'buttons'
};

/** dimmer on 1, color on 2 */
const leftPar: Fixture = {
  id: 'left',
  name: 'Left PAR',
  startAddress: 1,
  channels: [
    {name: 'Dimmer', offset: 0, values: inSteps},
    {name: 'Color', offset: 1}
  ]
};

/** the same addresses, its channels the other way round: color on 2, dimmer on 1, with a lock and a color */
const rightPar: Fixture = {
  id: 'right',
  name: 'Right PAR',
  startAddress: 1,
  channels: [
    {name: 'Color', offset: 1},
    {name: 'Dimmer', offset: 0, lock: {max: 100}, color: '#ff0000'}
  ],
  presets: [
    {
      id: 'half',
      name: 'Half',
      values: [
        {offset: 0, value: 140},
        {offset: 1, value: 77}
      ]
    }
  ]
};

/** only on 2, as its first channel */
const smoke: Fixture = {id: 'smoke', name: 'Smoke', startAddress: 2, channels: [{name: 'Fan', offset: 0}]};

/** far away */
const laser: Fixture = {id: 'laser', name: 'Laser', startAddress: 100, channels: [{name: 'Mode', offset: 0}]};

const dimmerOf = (fixture: Fixture) => fixture.channels.find(({name}) => name === 'Dimmer');

describe('rulesSharedWith', () => {
  test('the other fixtures, each with only the shared addresses where they stop at other values', () => {
    const shared = rulesSharedWith(leftPar, [rightPar, smoke, laser]);

    expect(shared.map(({first, second, addresses}) => [first.id, second.id, addresses])).toEqual([
      ['left', 'right', [1]]
    ]);
  });

  test('none while the stops are the same, whatever the position names and buttons', () => {
    const withGobo = (fixture: Fixture, values: ChannelValues): Fixture => ({
      ...fixture,
      channels: [{name: 'Gobo', offset: 0, values}]
    });
    const plainGobo: ChannelValues = {mode: 'positions', positions: [{value: 0}, {value: 100}, {value: 200}]};

    expect(rulesSharedWith(withGobo(leftPar, gobo), [withGobo(rightPar, plainGobo)])).toEqual([]);
  });
});

describe('withSharedRules', () => {
  test('the other fixture gets the rules on the shared address, also at another offset; lock and color stay', () => {
    const [, right] = withSharedRules([leftPar, rightPar], leftPar);

    expect(dimmerOf(right)).toEqual({name: 'Dimmer', offset: 0, lock: {max: 100}, color: '#ff0000', values: inSteps});
    expect(right.channels[0]).toBe(rightPar.channels[0]);
  });

  test('position names, momentary and buttons are copied with the positions', () => {
    const goboPar: Fixture = {...leftPar, channels: [{name: 'Dimmer', offset: 0, values: gobo}]};

    expect(dimmerOf(withSharedRules([goboPar, rightPar], goboPar)[1])?.values).toEqual(gobo);
  });

  test('a saved channel without rules removes them from the other channel, e.g. a new fixture placed on it', () => {
    const newPar: Fixture = {id: 'new', name: 'New', startAddress: 1, channels: [{name: 'Dimmer', offset: 0}]};
    const [left] = withSharedRules([leftPar, newPar], newPar);

    expect(dimmerOf(left)).toEqual({name: 'Dimmer', offset: 0});
  });

  test("the other fixture's presets are fitted to its new rules", () => {
    const [, right] = withSharedRules([leftPar, rightPar], leftPar);

    expect(right.presets).toEqual([
      {
        id: 'half',
        name: 'Half',
        values: [
          {offset: 0, value: 100},
          {offset: 1, value: 77}
        ]
      }
    ]);
  });

  test('every other fixture on the address gets the rules', () => {
    const otherRight: Fixture = {...rightPar, id: 'other-right', name: 'Other right PAR'};
    const [, right, other] = withSharedRules([leftPar, rightPar, otherRight], leftPar);

    expect(dimmerOf(right)?.values).toEqual(inSteps);
    expect(dimmerOf(other)?.values).toEqual(inSteps);
  });

  test('fixtures not sharing an address with other rules are kept as they are', () => {
    const fixtures = [leftPar, smoke, laser];
    const result = withSharedRules(fixtures, leftPar);

    result.forEach((fixture, index) => expect(fixture).toBe(fixtures[index]));
  });
});
