import {
  channelAddress,
  emptyFixtureSetup,
  fitsInUniverse,
  fixtureErrors,
  fixturePresets,
  lastAddress,
  overlappingFixtures,
  parseFixtureSetup
} from './fixtures';
import type {Fixture} from './ipc';

const fixtureOf = (overrides: Partial<Fixture> = {}): Fixture => ({
  id: 'par-1',
  name: 'PAR left',
  startAddress: 10,
  channels: [
    {name: 'Red', offset: 0},
    {name: 'Green', offset: 1},
    {name: 'Blue', offset: 2}
  ],
  ...overrides
});

describe('addresses', () => {
  test('a channel sits at the start address plus its offset', () => {
    expect(channelAddress({startAddress: 10}, {name: 'Red', offset: 0})).toBe(10);
    expect(channelAddress({startAddress: 10}, {name: 'Blue', offset: 2})).toBe(12);
  });

  test('the last address follows the highest offset, not the channel count', () => {
    expect(lastAddress(fixtureOf({channels: [{name: 'Smoke', offset: 4}]}))).toBe(14);
  });

  test('a fixture ending on channel 512 fits, one ending on 513 does not', () => {
    expect(fitsInUniverse(fixtureOf({startAddress: 510}))).toBe(true);
    expect(fitsInUniverse(fixtureOf({startAddress: 511}))).toBe(false);
  });
});

describe('fixtureErrors', () => {
  test('a valid fixture has none', () => {
    expect(fixtureErrors(fixtureOf())).toEqual([]);
  });

  test('reports a blank name, missing channels and an invalid start address', () => {
    expect(fixtureErrors(fixtureOf({name: ' ', startAddress: 0, channels: []}))).toEqual([
      'The fixture needs a name',
      'The start address must be a whole number from 1 to 512',
      'The fixture needs at least one channel'
    ]);
  });

  test('accepts a description up to the maximum length, reports a longer one', () => {
    expect(fixtureErrors(fixtureOf({description: 'x'.repeat(2000)}))).toEqual([]);
    expect(fixtureErrors(fixtureOf({description: 'x'.repeat(2001)}))).toEqual([
      'The description can have at most 2000 characters'
    ]);
  });

  test('accepts a hint up to the maximum length, reports a longer one', () => {
    expect(fixtureErrors(fixtureOf({hint: 'x'.repeat(200)}))).toEqual([]);
    expect(fixtureErrors(fixtureOf({hint: 'x'.repeat(201)}))).toEqual(['The hint can have at most 200 characters']);
  });

  test('reports blank channel names and duplicate offsets', () => {
    const channels = [
      {name: 'Dimmer', offset: 0},
      {name: '', offset: 0}
    ];

    expect(fixtureErrors(fixtureOf({channels}))).toEqual([
      'Every channel needs a name',
      'Offset 0 is used by more than one channel'
    ]);
  });

  test('a fixture with valid presets has none', () => {
    const presets = [{id: 'warm', name: 'Warm', values: [{offset: 0, value: 255}]}];

    expect(fixtureErrors(fixtureOf({presets}))).toEqual([]);
  });

  test('reports a blank preset name, a missing channel, a channel set twice and an empty preset', () => {
    const presets = [
      {id: 'blank', name: ' ', values: [{offset: 0, value: 10}]},
      {id: 'missing', name: 'Missing', values: [{offset: 7, value: 10}]},
      {
        id: 'twice',
        name: 'Twice',
        values: [
          {offset: 1, value: 10},
          {offset: 1, value: 20}
        ]
      },
      {id: 'empty', name: 'Empty', values: []}
    ];

    expect(fixtureErrors(fixtureOf({presets}))).toEqual([
      'Every preset needs a name',
      "The preset Missing sets a channel the fixture doesn't have",
      'The preset Twice sets a channel more than once',
      'The preset Empty needs at least one channel'
    ]);
  });

  test('reports a preset id used twice', () => {
    const preset = {id: 'warm', name: 'Warm', values: [{offset: 0, value: 255}]};

    expect(fixtureErrors(fixtureOf({presets: [preset, {...preset, name: 'Warmer'}]}))).toEqual([
      'Preset id warm is used twice'
    ]);
  });

  test('names a preset without a name as such', () => {
    expect(fixtureErrors(fixtureOf({presets: [{id: 'new', name: '', values: []}]}))).toEqual([
      'Every preset needs a name',
      'The preset without a name needs at least one channel'
    ]);
  });

  test('reports a preset value outside 0..255 and a too long preset name', () => {
    const name = 'x'.repeat(41);
    const presets = [{id: 'loud', name, values: [{offset: 0, value: 256}]}];

    expect(fixtureErrors(fixtureOf({presets}))).toEqual([
      'A preset name can have at most 40 characters',
      `The values of the preset ${name} must be whole numbers from 0 to 255`
    ]);
  });

  test('reports a fixture not fitting in the universe', () => {
    expect(fixtureErrors(fixtureOf({startAddress: 511}))).toEqual([
      'The fixture ends at address 513, after the last one (512)'
    ]);
  });
});

describe('overlappingFixtures', () => {
  test('finds fixtures sharing addresses', () => {
    const left = fixtureOf();
    const smoke = fixtureOf({id: 'smoke', startAddress: 12, channels: [{name: 'Smoke', offset: 0}]});

    expect(overlappingFixtures([left, smoke])).toEqual([{first: left, second: smoke, addresses: [12]}]);
  });

  test('adjacent fixtures and gaps between offsets do not overlap', () => {
    const left = fixtureOf();
    const right = fixtureOf({id: 'par-2', startAddress: 13});
    const sparse = fixtureOf({id: 'sparse', startAddress: 1, channels: [{name: 'Pan', offset: 8}]});

    expect(overlappingFixtures([left, right, sparse])).toEqual([]);
  });
});

describe('parseFixtureSetup', () => {
  test('accepts an empty and a filled setup', () => {
    expect(parseFixtureSetup(emptyFixtureSetup())).toEqual({version: 1, fixtures: []});
    expect(parseFixtureSetup({version: 1, fixtures: [fixtureOf()]})).toEqual({version: 1, fixtures: [fixtureOf()]});
  });

  test('accepts a fixture with and without a description, so files from before it load', () => {
    const described = fixtureOf({description: 'DIP 1+4 on, 3 channel mode'});

    expect(parseFixtureSetup({version: 1, fixtures: [described]})).toEqual({version: 1, fixtures: [described]});
    expect(parseFixtureSetup({version: 1, fixtures: [{...fixtureOf(), description: 42}]})).toBeUndefined();
  });

  test('accepts a fixture with a hint, rejects a hint that is no text', () => {
    const hinted = fixtureOf({hint: 'warm up 2 min'});

    expect(parseFixtureSetup({version: 1, fixtures: [hinted]})).toEqual({version: 1, fixtures: [hinted]});
    expect(parseFixtureSetup({version: 1, fixtures: [{...fixtureOf(), hint: 42}]})).toBeUndefined();
  });

  test('loads a fixture without presets, from a file older than presets, as one without any', () => {
    const setup = parseFixtureSetup({version: 1, fixtures: [fixtureOf()]});

    expect(setup?.fixtures[0].presets).toBeUndefined();
    expect(setup && fixturePresets(setup.fixtures[0])).toEqual([]);
  });

  test('accepts a fixture with presets', () => {
    const withPresets = fixtureOf({presets: [{id: 'warm', name: 'Warm', values: [{offset: 2, value: 80}]}]});

    expect(parseFixtureSetup({version: 1, fixtures: [withPresets]})).toEqual({version: 1, fixtures: [withPresets]});
  });

  test.each([
    [
      'a preset on a channel the fixture lacks',
      {version: 1, fixtures: [fixtureOf({presets: [{id: 'p', name: 'P', values: [{offset: 9, value: 1}]}]})]}
    ],
    [
      'a preset value out of range',
      {version: 1, fixtures: [{...fixtureOf(), presets: [{id: 'p', name: 'P', values: [{offset: 0, value: 300}]}]}]}
    ],
    ['another version', {version: 2, fixtures: []}],
    ['no fixtures list', {version: 1}],
    ['a fixture without channels', {version: 1, fixtures: [fixtureOf({channels: []})]}],
    ['a fixture outside the universe', {version: 1, fixtures: [fixtureOf({startAddress: 511})]}],
    ['a duplicate id', {version: 1, fixtures: [fixtureOf(), fixtureOf({startAddress: 100})]}],
    ['a string start address', {version: 1, fixtures: [{...fixtureOf(), startAddress: '10'}]}],
    ['not an object', 'fixtures']
  ])('rejects %s', (_description, payload) => {
    expect(parseFixtureSetup(payload)).toBeUndefined();
  });
});
