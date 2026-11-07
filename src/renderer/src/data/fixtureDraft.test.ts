import {fixtureErrors} from '@shared/fixtures';

import {
  draftChannelAddress,
  draftOf,
  fixtureOfDraft,
  newFixtureDraft,
  withChannelChange,
  withNewChannel,
  withNewPreset,
  withPresetMoved,
  withPresetName,
  withPresetValueChange,
  withPresetValueEntered,
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
    {type: 'start-address-invalid'},
    {type: 'offset-invalid'}
  ]);
});

test('a new channel goes after the highest offset, or to 0 when there is none', () => {
  const withGap = withChannelChange(draftOf(par), 1, {offset: '4'});

  expect(withNewChannel(withGap).channels[2]).toEqual({name: '', offset: '5', lockMax: '', color: ''});
  expect(withNewChannel(withoutChannel(newFixtureDraft(), 0)).channels).toEqual([
    {name: '', offset: '0', lockMax: '', color: ''}
  ]);
});

test('removes the channel at the index', () => {
  expect(withoutChannel(draftOf(par), 0).channels).toEqual([{name: 'Green', offset: '1', lockMax: '', color: ''}]);
});

test('a channel lands on the start address plus its offset', () => {
  const draft = draftOf(par);

  expect(draftChannelAddress(draft, {name: 'Red', offset: '0', lockMax: '', color: ''})).toBe(10);
  expect(draftChannelAddress(draft, {name: 'Blue', offset: '2', lockMax: '', color: ''})).toBe(12);
});

test('no address while a field is blank or invalid, or past the universe', () => {
  expect(
    draftChannelAddress({...draftOf(par), startAddress: ''}, {name: 'Red', offset: '0', lockMax: '', color: ''})
  ).toBeUndefined();
  expect(draftChannelAddress(draftOf(par), {name: 'Red', offset: '', lockMax: '', color: ''})).toBeUndefined();
  expect(draftChannelAddress(draftOf(par), {name: 'Red', offset: '-1', lockMax: '', color: ''})).toBeUndefined();
  expect(draftChannelAddress(draftOf(par), {name: 'Red', offset: '503', lockMax: '', color: ''})).toBeUndefined();
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
    expect(draftOf(laser).channels[1]).toEqual({name: 'Laser', offset: '1', lockMax: '0', color: ''});
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
      {type: 'lock-max-invalid'}
    ]);
  });
});

describe('channel colors', () => {
  const uv = {...par, channels: [{name: 'UV', offset: 0, color: '#7f00ff'}]};

  test('a fixture with a colored channel survives the round trip through a draft', () => {
    expect(draftOf(uv).channels[0]).toEqual({name: 'UV', offset: '0', lockMax: '', color: '#7f00ff'});
    expect(fixtureOfDraft('par', draftOf(uv))).toEqual(uv);
  });

  test('a typed color is stored normalized, a blank one is no color', () => {
    expect(fixtureOfDraft('par', withChannelChange(draftOf(par), 0, {color: ' 7F00FF '})).channels[0]).toEqual({
      name: 'Red',
      offset: 0,
      color: '#7f00ff'
    });
    expect(fixtureOfDraft('par', withChannelChange(draftOf(uv), 0, {color: '  '})).channels[0]).toEqual({
      name: 'UV',
      offset: 0
    });
  });

  test('anything but six hex digits is invalid', () => {
    const coloredAs = (color: string) =>
      fixtureErrors(fixtureOfDraft('par', withChannelChange(draftOf(par), 0, {color})));

    expect(coloredAs('#ff00f')).toEqual([{type: 'color-invalid'}]);
    expect(coloredAs('red')).toEqual([{type: 'color-invalid'}]);
    expect(coloredAs('#gg0000')).toEqual([{type: 'color-invalid'}]);
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

  test('a value entered for a channel the preset leaves out ticks the channel, also a value of 0', () => {
    const unticked = withPresetValueChange(withNewPreset(draftOf(par), 'red'), 0, 1, {included: false});

    const entered = withPresetValueEntered(unticked, 0, 1, '0');

    expect(entered.presets[0]?.values[1]).toEqual({included: true, value: '0'});
    expect(fixtureOfDraft('par', entered).presets?.[0].values).toEqual([
      {offset: 0, value: 0},
      {offset: 1, value: 0}
    ]);
  });

  test('follows a channel that is removed or gets another offset', () => {
    const moved = withChannelChange(draftOf(withWarm), 1, {offset: '4'});
    expect(fixtureOfDraft('par', moved).presets?.[0].values).toEqual([{offset: 4, value: 180}]);

    const removed = withoutChannel(draftOf(withWarm), 1);
    expect(fixtureOfDraft('par', removed).presets?.[0].values).toEqual([]);
    expect(fixtureErrors(fixtureOfDraft('par', removed))).toEqual([
      {type: 'preset-channels-missing', presetName: 'Warm'}
    ]);
  });

  test('a new channel is not part of the existing presets', () => {
    expect(withNewChannel(draftOf(withWarm)).presets[0].values[2]).toEqual({included: false, value: '0'});
  });

  test('a blank value is invalid, and removing the last preset leaves no presets at all', () => {
    const blank = withPresetValueChange(draftOf(withWarm), 0, 1, {value: ''});
    expect(fixtureErrors(fixtureOfDraft('par', blank))).toEqual([{type: 'preset-value-invalid', presetName: 'Warm'}]);

    expect(fixtureOfDraft('par', withoutPreset(draftOf(withWarm), 0))).toEqual(par);
  });

  test('a moved preset keeps its values and changes the order of the presets only', () => {
    const cold = {id: 'cold', name: 'Cold', values: [{offset: 0, value: 90}]};
    const withBoth = {...withWarm, presets: [...withWarm.presets, cold]};

    const moved = withPresetMoved(draftOf(withBoth), 1, 'earlier');

    expect(fixtureOfDraft('par', moved).presets).toEqual([cold, ...withWarm.presets]);
    expect(withPresetMoved(draftOf(withBoth), 1, 'later')).toEqual(draftOf(withBoth));
  });
});
