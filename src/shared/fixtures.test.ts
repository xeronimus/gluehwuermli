import {
  addressRuleConflicts,
  channelAddress,
  channelLimits,
  emptyFixtureSetup,
  fitsInUniverse,
  fixtureErrors,
  fixturePresets,
  lastAddress,
  overlappingFixtures,
  parseFixtureSetup,
  sharedAddressErrors
} from './fixtures';
import type {ChannelValues, Fixture} from './ipc';

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
      {type: 'name-missing'},
      {type: 'start-address-invalid'},
      {type: 'channels-missing'}
    ]);
  });

  test('accepts a description up to the maximum length, reports a longer one', () => {
    expect(fixtureErrors(fixtureOf({description: 'x'.repeat(2000)}))).toEqual([]);
    expect(fixtureErrors(fixtureOf({description: 'x'.repeat(2001)}))).toEqual([{type: 'description-too-long'}]);
  });

  test('accepts a hint up to the maximum length, reports a longer one', () => {
    expect(fixtureErrors(fixtureOf({hint: 'x'.repeat(200)}))).toEqual([]);
    expect(fixtureErrors(fixtureOf({hint: 'x'.repeat(201)}))).toEqual([{type: 'hint-too-long'}]);
  });

  test('reports blank channel names and duplicate offsets', () => {
    const channels = [
      {name: 'Dimmer', offset: 0},
      {name: '', offset: 0}
    ];

    expect(fixtureErrors(fixtureOf({channels}))).toEqual([
      {type: 'channel-name-missing'},
      {type: 'offset-used-twice', offset: 0}
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
      {type: 'preset-name-missing'},
      {type: 'preset-channel-unknown', presetName: 'Missing'},
      {type: 'preset-channel-twice', presetName: 'Twice'},
      {type: 'preset-channels-missing', presetName: 'Empty'}
    ]);
  });

  test('accepts a stored preset color, reports any other', () => {
    const coloredAs = (color: string) =>
      fixtureOf({presets: [{id: 'warm', name: 'Warm', values: [{offset: 0, value: 255}], color}]});

    expect(fixtureErrors(coloredAs('#ffaa00'))).toEqual([]);
    expect(fixtureErrors(coloredAs('ffaa00'))).toEqual([{type: 'preset-color-invalid', presetName: 'Warm'}]);
  });

  test('reports a preset id used twice', () => {
    const preset = {id: 'warm', name: 'Warm', values: [{offset: 0, value: 255}]};

    expect(fixtureErrors(fixtureOf({presets: [preset, {...preset, name: 'Warmer'}]}))).toEqual([
      {type: 'preset-id-used-twice', id: 'warm'}
    ]);
  });

  test('a preset without a name has no name in its errors', () => {
    expect(fixtureErrors(fixtureOf({presets: [{id: 'new', name: '', values: []}]}))).toEqual([
      {type: 'preset-name-missing'},
      {type: 'preset-channels-missing', presetName: undefined}
    ]);
  });

  test('reports a preset value outside 0..255 and a too long preset name', () => {
    const name = 'x'.repeat(41);
    const presets = [{id: 'loud', name, values: [{offset: 0, value: 256}]}];

    expect(fixtureErrors(fixtureOf({presets}))).toEqual([
      {type: 'preset-name-too-long'},
      {type: 'preset-value-invalid', presetName: name}
    ]);
  });

  test('accepts a lock from 0 to 255, reports one outside', () => {
    const lockedAt = (max: number) => fixtureOf({channels: [{name: 'Laser', offset: 0, lock: {max}}]});

    expect(fixtureErrors(lockedAt(0))).toEqual([]);
    expect(fixtureErrors(lockedAt(255))).toEqual([]);
    expect(fixtureErrors(lockedAt(256))).toEqual([{type: 'lock-max-invalid'}]);
    expect(fixtureErrors(lockedAt(Number.NaN))).toEqual([{type: 'lock-max-invalid'}]);
  });

  test('accepts a stored color, reports any other', () => {
    const coloredAs = (color: string) => fixtureOf({channels: [{name: 'UV', offset: 0, color}]});

    expect(fixtureErrors(coloredAs('#7f00ff'))).toEqual([]);
    expect(fixtureErrors(coloredAs('#7F00FF'))).toEqual([{type: 'color-invalid'}]);
    expect(fixtureErrors(coloredAs('7f00ff'))).toEqual([{type: 'color-invalid'}]);
    expect(fixtureErrors(coloredAs('red'))).toEqual([{type: 'color-invalid'}]);
  });

  test("reports each problem of the channels' value rules once", () => {
    const fixture = fixtureOf({
      channels: [
        {name: 'Dimmer', offset: 0, values: {mode: 'continuous', min: 200, max: 100}},
        {name: 'Strobe', offset: 1, values: {mode: 'steps', min: 200, max: 100, step: 0}}
      ]
    });

    expect(fixtureErrors(fixture)).toEqual([{type: 'values-min-above-max'}, {type: 'values-step-invalid'}]);
  });

  test('a preset value must be one its channel stops at', () => {
    const withGoboPreset = (value: number) =>
      fixtureOf({
        channels: [{name: 'Gobo', offset: 0, values: {mode: 'positions', positions: [{value: 5}, {value: 200}]}}],
        presets: [{id: 'star', name: 'Star', values: [{offset: 0, value}]}]
      });

    expect(fixtureErrors(withGoboPreset(200))).toEqual([]);
    expect(fixtureErrors(withGoboPreset(100))).toEqual([{type: 'preset-value-invalid', presetName: 'Star'}]);
  });

  test('reports a fixture not fitting in the universe', () => {
    expect(fixtureErrors(fixtureOf({startAddress: 511}))).toEqual([{type: 'past-universe-end', lastAddress: 513}]);
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

describe('addressRuleConflicts', () => {
  const dimmerOf = (id: string, values?: ChannelValues): Fixture =>
    fixtureOf({id, name: id, channels: [{name: 'Dimmer', offset: 0, ...(values && {values})}]});
  const fromHundred: ChannelValues = {mode: 'continuous', min: 100, max: 255};

  test('fixtures sharing an address with the same rules, or both without, are no conflict', () => {
    expect(addressRuleConflicts([dimmerOf('a'), dimmerOf('b')])).toEqual([]);
    expect(addressRuleConflicts([dimmerOf('a', fromHundred), dimmerOf('b', fromHundred)])).toEqual([]);
  });

  test('fixtures sharing an address with different rules, also one without, conflict on that address', () => {
    const conflicts = addressRuleConflicts([dimmerOf('a'), dimmerOf('b', fromHundred)]);

    expect(conflicts.map(({first, second, addresses}) => [first.id, second.id, addresses])).toEqual([['a', 'b', [10]]]);
  });

  test('as errors of the fixture being edited, naming the other fixture', () => {
    expect(sharedAddressErrors(dimmerOf('a'), [dimmerOf('b', fromHundred), dimmerOf('c')])).toEqual([
      {type: 'shared-address-rules-differ', otherFixtureId: 'b', otherFixtureName: 'b', addresses: [10]}
    ]);
    expect(sharedAddressErrors(dimmerOf('a'), [dimmerOf('c')])).toEqual([]);
  });
});

describe('channelLimits', () => {
  test('the cap of every locked channel at its address, none for the others', () => {
    const laser = fixtureOf({
      channels: [
        {name: 'Dimmer', offset: 0},
        {name: 'Laser', offset: 1, lock: {max: 0}},
        {name: 'Macro', offset: 2, lock: {max: 50}}
      ]
    });

    expect(channelLimits([laser])).toEqual(
      new Map([
        [11, 0],
        [12, 50]
      ])
    );
  });

  test('fixtures sharing an address with different caps: the lowest wins', () => {
    const loose = fixtureOf({channels: [{name: 'Macro', offset: 0, lock: {max: 50}}]});
    const strict = fixtureOf({id: 'strict', channels: [{name: 'Macro', offset: 0, lock: {max: 10}}]});
    const unlocked = fixtureOf({id: 'unlocked', channels: [{name: 'Dimmer', offset: 0}]});

    expect(channelLimits([loose, strict, unlocked])).toEqual(new Map([[10, 10]]));
    expect(channelLimits([strict, loose])).toEqual(new Map([[10, 10]]));
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

  test('accepts a channel with a stored color, rejects one not normalized or no color at all', () => {
    const coloredAs = (color: string) => fixtureOf({channels: [{name: 'UV', offset: 0, color}]});

    expect(parseFixtureSetup({version: 1, fixtures: [coloredAs('#7f00ff')]})).toEqual({
      version: 1,
      fixtures: [coloredAs('#7f00ff')]
    });
    expect(parseFixtureSetup({version: 1, fixtures: [coloredAs('#7F00FF')]})).toBeUndefined();
    expect(parseFixtureSetup({version: 1, fixtures: [coloredAs('red')]})).toBeUndefined();
  });

  test('accepts channels with value rules, rejects invalid rules and values the channel can not have', () => {
    const steps = fixtureOf({
      channels: [{name: 'Strobe', offset: 0, values: {mode: 'steps', min: 0, max: 200, step: 50}}],
      presets: [{id: 'fast', name: 'Fast', values: [{offset: 0, value: 150}]}]
    });
    const invalidRules = fixtureOf({channels: [{name: 'Gobo', offset: 0, values: {mode: 'positions', positions: []}}]});
    const offStepPreset = {...steps, presets: [{id: 'fast', name: 'Fast', values: [{offset: 0, value: 120}]}]};
    const unknownMode = {...fixtureOf(), channels: [{name: 'X', offset: 0, values: {mode: 'ramp'}}]};

    expect(parseFixtureSetup({version: 1, fixtures: [steps]})).toEqual({version: 1, fixtures: [steps]});
    expect(parseFixtureSetup({version: 1, fixtures: [invalidRules]})).toBeUndefined();
    expect(parseFixtureSetup({version: 1, fixtures: [offStepPreset]})).toBeUndefined();
    expect(parseFixtureSetup({version: 1, fixtures: [unknownMode]})).toBeUndefined();
  });

  test('accepts a momentary position, rejects a momentary flag that is not true', () => {
    const flashWith = (momentary: unknown) => ({
      ...fixtureOf(),
      channels: [
        {
          name: 'Flash',
          offset: 0,
          values: {mode: 'positions', positions: [{value: 0}, {value: 255, momentary}], display: 'buttons'}
        }
      ]
    });

    expect(parseFixtureSetup({version: 1, fixtures: [flashWith(true)]})).toEqual({
      version: 1,
      fixtures: [flashWith(true)]
    });
    expect(parseFixtureSetup({version: 1, fixtures: [flashWith(false)]})).toBeUndefined();
    expect(parseFixtureSetup({version: 1, fixtures: [flashWith('yes')]})).toBeUndefined();
  });

  test('rejects fixtures sharing an address with different value rules', () => {
    const plain = fixtureOf({id: 'a'});
    const ranged = fixtureOf({
      id: 'b',
      channels: [{name: 'Red', offset: 0, values: {mode: 'continuous', min: 50, max: 255}}]
    });

    expect(parseFixtureSetup({version: 1, fixtures: [plain, fixtureOf({id: 'b'})]})).toBeDefined();
    expect(parseFixtureSetup({version: 1, fixtures: [plain, ranged]})).toBeUndefined();
  });

  test('accepts a channel with a lock, rejects a lock without a valid maximum', () => {
    const locked = fixtureOf({channels: [{name: 'Laser', offset: 0, lock: {max: 0}}]});

    expect(parseFixtureSetup({version: 1, fixtures: [locked]})).toEqual({version: 1, fixtures: [locked]});
    expect(
      parseFixtureSetup({version: 1, fixtures: [fixtureOf({channels: [{name: 'Laser', offset: 0, lock: {max: 300}}]})]})
    ).toBeUndefined();
    expect(
      parseFixtureSetup({version: 1, fixtures: [{...fixtureOf(), channels: [{name: 'Laser', offset: 0, lock: {}}]}]})
    ).toBeUndefined();
  });

  test('accepts a fixture with presets', () => {
    const withPresets = fixtureOf({presets: [{id: 'warm', name: 'Warm', values: [{offset: 2, value: 80}]}]});

    expect(parseFixtureSetup({version: 1, fixtures: [withPresets]})).toEqual({version: 1, fixtures: [withPresets]});
  });

  test('accepts a setup with scenes, and one without from a file older than scenes', () => {
    const withScenes = {
      version: 1,
      fixtures: [fixtureOf()],
      scenes: [{id: 'intro', name: 'Intro', fixtures: [{fixtureId: 'par-1', values: [{offset: 1, value: 200}]}]}]
    };

    expect(parseFixtureSetup(withScenes)).toEqual(withScenes);
    expect(parseFixtureSetup({version: 1, fixtures: [fixtureOf()]})?.scenes).toBeUndefined();
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
    [
      'a scene on a fixture the setup lacks',
      {
        version: 1,
        fixtures: [],
        scenes: [{id: 's', name: 'S', fixtures: [{fixtureId: 'par-1', values: [{offset: 0, value: 1}]}]}]
      }
    ],
    [
      'a scene on a channel the fixture lacks',
      {
        version: 1,
        fixtures: [fixtureOf()],
        scenes: [{id: 's', name: 'S', fixtures: [{fixtureId: 'par-1', values: [{offset: 9, value: 1}]}]}]
      }
    ],
    ['scenes that are no list', {version: 1, fixtures: [], scenes: 'intro'}],
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
