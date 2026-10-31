import {fixtureErrors} from '@shared/fixtures';

import {
  draftChannelAddress,
  draftOf,
  fixtureOfDraft,
  newFixtureDraft,
  withChannelChange,
  withNewChannel,
  withNewPreset,
  withPresetName,
  withPresetValueChange,
  withoutChannel,
  withoutPreset
} from './fixtureDraft';

const par = {
  id: 'par',
  name: 'PAR',
  startAddress: 10,
  channels: [
    {name: 'Red', offset: 0},
    {name: 'Green', offset: 1}
  ]
};

test('a fixture survives the round trip through a draft', () => {
  expect(fixtureOfDraft('par', draftOf(par))).toEqual(par);
});

test('keeps a description, trimmed, and leaves out a blank one', () => {
  const described = {...par, description: 'DIP 1+4 on\nhangs stage left'};

  expect(fixtureOfDraft('par', draftOf(described))).toEqual(described);
  expect(fixtureOfDraft('par', {...draftOf(par), description: '  note \n'})).toEqual({...par, description: 'note'});
  expect(fixtureOfDraft('par', {...draftOf(par), description: '   '})).toEqual(par);
});

test('keeps a hint, trimmed, and leaves out a blank one', () => {
  const hinted = {...par, hint: 'warm up 2 min'};

  expect(fixtureOfDraft('par', draftOf(hinted))).toEqual(hinted);
  expect(fixtureOfDraft('par', {...draftOf(par), hint: ' dim first '})).toEqual({...par, hint: 'dim first'});
  expect(fixtureOfDraft('par', {...draftOf(par), hint: '  '})).toEqual(par);
});

test('trims the names', () => {
  const draft = withChannelChange({...draftOf(par), name: ' PAR '}, 0, {name: ' Red '});

  expect(fixtureOfDraft('par', draft)).toEqual(par);
});

test('a blank or non-numeric field is invalid, not 0', () => {
  const draft = withChannelChange({...draftOf(par), startAddress: ''}, 1, {offset: 'x'});

  expect(fixtureErrors(fixtureOfDraft('par', draft))).toEqual([
    'The start address must be a whole number from 1 to 512',
    'Offsets must be whole numbers from 0'
  ]);
});

test('a new channel goes after the highest offset, or to 0 when there is none', () => {
  const withGap = withChannelChange(draftOf(par), 1, {offset: '4'});

  expect(withNewChannel(withGap).channels[2]).toEqual({name: '', offset: '5', lockMax: ''});
  expect(withNewChannel(withoutChannel(newFixtureDraft(), 0)).channels).toEqual([{name: '', offset: '0', lockMax: ''}]);
});

test('removes the channel at the index', () => {
  expect(withoutChannel(draftOf(par), 0).channels).toEqual([{name: 'Green', offset: '1', lockMax: ''}]);
});

test('a channel lands on the start address plus its offset', () => {
  const draft = draftOf(par);

  expect(draftChannelAddress(draft, {name: 'Red', offset: '0', lockMax: ''})).toBe(10);
  expect(draftChannelAddress(draft, {name: 'Blue', offset: '2', lockMax: ''})).toBe(12);
});

test('no address while a field is blank or invalid, or past the universe', () => {
  expect(
    draftChannelAddress({...draftOf(par), startAddress: ''}, {name: 'Red', offset: '0', lockMax: ''})
  ).toBeUndefined();
  expect(draftChannelAddress(draftOf(par), {name: 'Red', offset: '', lockMax: ''})).toBeUndefined();
  expect(draftChannelAddress(draftOf(par), {name: 'Red', offset: '-1', lockMax: ''})).toBeUndefined();
  expect(draftChannelAddress(draftOf(par), {name: 'Red', offset: '503', lockMax: ''})).toBeUndefined();
});

describe('channel locks', () => {
  const laser = {
    ...par,
    channels: [
      {name: 'Red', offset: 0},
      {name: 'Laser', offset: 1, lock: {max: 0}}
    ]
  };

  test('a fixture with a locked channel survives the round trip through a draft', () => {
    expect(draftOf(laser).channels[1]).toEqual({name: 'Laser', offset: '1', lockMax: '0'});
    expect(fixtureOfDraft('par', draftOf(laser))).toEqual(laser);
  });

  test('a blank maximum is no lock, a typed one is', () => {
    expect(fixtureOfDraft('par', withChannelChange(draftOf(laser), 1, {lockMax: ' '})).channels[1]).toEqual({
      name: 'Laser',
      offset: 1
    });
    expect(fixtureOfDraft('par', withChannelChange(draftOf(par), 0, {lockMax: '50'})).channels[0]).toEqual({
      name: 'Red',
      offset: 0,
      lock: {max: 50}
    });
  });

  test('a maximum outside 0..255 is invalid', () => {
    expect(fixtureErrors(fixtureOfDraft('par', withChannelChange(draftOf(par), 0, {lockMax: '300'})))).toEqual([
      'The maximum while locked must be a whole number from 0 to 255'
    ]);
  });
});

describe('presets', () => {
  const withWarm = {...par, presets: [{id: 'warm', name: 'Warm', values: [{offset: 1, value: 180}]}]};

  test('a fixture with presets survives the round trip through a draft', () => {
    expect(fixtureOfDraft('par', draftOf(withWarm))).toEqual(withWarm);
  });

  test('a preset has an entry per channel, unticked where it sets nothing', () => {
    expect(draftOf(withWarm).presets[0].values).toEqual([
      {included: false, value: '0'},
      {included: true, value: '180'}
    ]);
  });

  test('a new preset sets every channel to 0, a named one ends up in the fixture', () => {
    const draft = withPresetName(withNewPreset(draftOf(par), 'off'), 0, ' Off ');

    expect(fixtureOfDraft('par', draft).presets).toEqual([
      {
        id: 'off',
        name: 'Off',
        values: [
          {offset: 0, value: 0},
          {offset: 1, value: 0}
        ]
      }
    ]);
  });

  test('leaves out unticked channels', () => {
    const draft = withPresetValueChange(withNewPreset(draftOf(par), 'red'), 0, 1, {included: false});

    expect(fixtureOfDraft('par', draft).presets?.[0].values).toEqual([{offset: 0, value: 0}]);
  });

  test('follows a channel that is removed or gets another offset', () => {
    const moved = withChannelChange(draftOf(withWarm), 1, {offset: '4'});
    expect(fixtureOfDraft('par', moved).presets?.[0].values).toEqual([{offset: 4, value: 180}]);

    const removed = withoutChannel(draftOf(withWarm), 1);
    expect(fixtureOfDraft('par', removed).presets?.[0].values).toEqual([]);
    expect(fixtureErrors(fixtureOfDraft('par', removed))).toEqual(['The preset Warm needs at least one channel']);
  });

  test('a new channel is not part of the existing presets', () => {
    expect(withNewChannel(draftOf(withWarm)).presets[0].values[2]).toEqual({included: false, value: '0'});
  });

  test('a blank value is invalid, and removing the last preset leaves no presets at all', () => {
    const blank = withPresetValueChange(draftOf(withWarm), 0, 1, {value: ''});
    expect(fixtureErrors(fixtureOfDraft('par', blank))).toEqual([
      'The values of the preset Warm must be whole numbers from 0 to 255'
    ]);

    expect(fixtureOfDraft('par', withoutPreset(draftOf(withWarm), 0))).toEqual(par);
  });
});
