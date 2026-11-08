import {fixtureErrors} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import {newChannelValuesDraft, withValueMode} from './channelValuesDraft';
import {
  type FixtureDraft,
  channelOffsetChanges,
  draftChannelAddress,
  draftOf,
  draftStartAddress,
  fixtureOfDraft,
  newFixtureDraft,
  shownPresetValue,
  withChannelChange,
  withChannelMoved,
  withNewChannel,
  withNewPreset,
  withPresetColor,
  withPresetMoved,
  withPresetName,
  withPresetValueChange,
  withPresetValueEntered,
  withoutChannel,
  withoutPreset
} from './fixtureDraft';

const noRules = newChannelValuesDraft();

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

  expect(withNewChannel(withGap, 'new').channels[2]).toEqual({
    id: 'new',
    name: '',
    offset: '5',
    lockMax: '',
    color: '',
    values: noRules
  });
  expect(withNewChannel(withoutChannel(newFixtureDraft('first'), 0), 'new').channels).toEqual([
    {id: 'new', name: '', offset: '0', lockMax: '', color: '', values: noRules}
  ]);
});

test('removes the channel at the index', () => {
  expect(withoutChannel(draftOf(par), 0).channels).toEqual([
    {id: 'stored-1', storedOffset: 1, name: 'Green', offset: '1', lockMax: '', color: '', values: noRules}
  ]);
});

test('a channel lands on the start address plus its offset', () => {
  const draft = draftOf(par);

  expect(
    draftChannelAddress(draft, {id: 'red', name: 'Red', offset: '0', lockMax: '', color: '', values: noRules})
  ).toBe(10);
  expect(
    draftChannelAddress(draft, {id: 'blue', name: 'Blue', offset: '2', lockMax: '', color: '', values: noRules})
  ).toBe(12);
});

test('no address while a field is blank or invalid, or past the universe', () => {
  expect(
    draftChannelAddress(
      {...draftOf(par), startAddress: ''},
      {id: 'red', name: 'Red', offset: '0', lockMax: '', color: '', values: noRules}
    )
  ).toBeUndefined();
  expect(
    draftChannelAddress(draftOf(par), {id: 'red', name: 'Red', offset: '', lockMax: '', color: '', values: noRules})
  ).toBeUndefined();
  expect(
    draftChannelAddress(draftOf(par), {id: 'red', name: 'Red', offset: '-1', lockMax: '', color: '', values: noRules})
  ).toBeUndefined();
  expect(
    draftChannelAddress(draftOf(par), {id: 'red', name: 'Red', offset: '503', lockMax: '', color: '', values: noRules})
  ).toBeUndefined();
});

test('the start address while it is a DMX channel', () => {
  expect(draftStartAddress(draftOf(par))).toBe(10);
  expect(draftStartAddress({...draftOf(par), startAddress: ''})).toBeUndefined();
  expect(draftStartAddress({...draftOf(par), startAddress: '0'})).toBeUndefined();
  expect(draftStartAddress({...draftOf(par), startAddress: '513'})).toBeUndefined();
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
    expect(draftOf(laser).channels[1]).toEqual({
      id: 'stored-1',
      storedOffset: 1,
      name: 'Laser',
      offset: '1',
      lockMax: '0',
      color: '',
      values: noRules
    });
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
    expect(draftOf(uv).channels[0]).toEqual({
      id: 'stored-0',
      storedOffset: 0,
      name: 'UV',
      offset: '0',
      lockMax: '',
      color: '#7f00ff',
      values: noRules
    });
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

describe('value rules', () => {
  const strobe: Fixture = {
    id: 'strobe',
    name: 'Strobe',
    startAddress: 1,
    channels: [{name: 'Rate', offset: 0, values: {mode: 'steps', min: 0, max: 200, step: 50}}],
    presets: [{id: 'fast', name: 'Fast', values: [{offset: 0, value: 150}]}]
  };
  const gobo: Fixture = {
    id: 'gobo',
    name: 'Gobo',
    startAddress: 1,
    channels: [
      {name: 'Wheel', offset: 0, values: {mode: 'positions', positions: [{value: 5, name: 'Open'}, {value: 200}]}}
    ]
  };
  const withValues = (draft: FixtureDraft, values: Partial<FixtureDraft['channels'][number]['values']>) =>
    withChannelChange(draft, 0, {values: {...draft.channels[0].values, ...values}});

  test('fixtures with rules survive the round trip through a draft, one without stays without', () => {
    expect(fixtureOfDraft('strobe', draftOf(strobe))).toEqual(strobe);
    expect(fixtureOfDraft('gobo', draftOf(gobo))).toEqual(gobo);
    expect(fixtureOfDraft('par', draftOf(par))).toEqual(par);
  });

  test('a blank min or max is the end of the DMX range, the full range is no rule at all', () => {
    const draft = draftOf(par);

    expect(fixtureOfDraft('par', withValues(draft, {min: '100'})).channels[0].values).toEqual({
      mode: 'continuous',
      min: 100,
      max: 255
    });
    expect(fixtureOfDraft('par', withValues(draft, {min: '0', max: '255'})).channels[0].values).toBeUndefined();
  });

  test('switching the mode back and forth keeps what was typed; positions start with two empty ones', () => {
    const steps = withValues(draftOf(par), {mode: 'steps', step: '10'});
    const positions = withChannelChange(steps, 0, {values: withValueMode(steps.channels[0].values, 'positions')});
    const back = withChannelChange(positions, 0, {values: withValueMode(positions.channels[0].values, 'steps')});

    expect(positions.channels[0].values.positions).toEqual([
      {value: '', name: ''},
      {value: '', name: ''}
    ]);
    expect(fixtureOfDraft('par', back).channels[0].values).toEqual({mode: 'steps', min: 0, max: 255, step: 10});
  });

  test('a blank step size or position value is invalid, a blank position name is none', () => {
    const blankStep = withValues(draftOf(par), {mode: 'steps'});
    expect(fixtureErrors(fixtureOfDraft('par', blankStep))).toEqual([{type: 'values-step-invalid'}]);

    const positions = withValues(draftOf(par), {
      mode: 'positions',
      positions: [
        {value: '5', name: ' '},
        {value: '', name: 'Star'}
      ]
    });
    expect(fixtureOfDraft('par', positions).channels[0].values).toEqual({
      mode: 'positions',
      positions: [{value: 5}, {value: Number.NaN, name: 'Star'}]
    });
    expect(fixtureErrors(fixtureOfDraft('par', positions))).toEqual([{type: 'values-invalid'}]);
  });

  test('a stored preset value is fitted to new rules and shown that way, an entered one is checked as it is', () => {
    const coarser = withValues(draftOf(strobe), {step: '100'});
    expect(shownPresetValue(coarser.channels[0], coarser.presets[0].values[0])).toBe('100');
    expect(fixtureErrors(fixtureOfDraft('strobe', coarser))).toEqual([]);

    const entered = withPresetValueEntered(coarser, 0, 0, '150');
    expect(fixtureErrors(fixtureOfDraft('strobe', entered))).toEqual([
      {type: 'preset-value-invalid', presetName: 'Fast'}
    ]);
  });

  test('a new preset starts at the lowest value of each channel', () => {
    const preset = fixtureOfDraft('gobo', withPresetName(withNewPreset(draftOf(gobo), 'p'), 0, 'P')).presets;

    expect(preset?.[0].values).toEqual([{offset: 0, value: 5}]);
  });
});

describe('presets', () => {
  const withWarm = {...par, presets: [{id: 'warm', name: 'Warm', values: [{offset: 1, value: 180}]}]};

  test('a fixture with presets survives the round trip through a draft', () => {
    expect(fixtureOfDraft('par', draftOf(withWarm))).toEqual(withWarm);
  });

  test('a preset has an entry per channel, unticked where it sets nothing', () => {
    expect(draftOf(withWarm).presets[0].values).toEqual([
      {included: false, value: '0', entered: false},
      {included: true, value: '180', entered: false}
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

  test("a preset's color is normalized, a blank one left out, an invalid one reported", () => {
    const colored = (color: string) => fixtureOfDraft('par', withPresetColor(draftOf(withWarm), 0, color));

    expect(colored('FFAA00').presets?.[0].color).toBe('#ffaa00');
    expect(colored(' ').presets?.[0]).not.toHaveProperty('color');
    expect(fixtureErrors(colored('#ffaa0'))).toEqual([{type: 'preset-color-invalid', presetName: 'Warm'}]);
  });

  test('a colored preset survives the round trip through a draft', () => {
    const colored = {
      ...par,
      presets: [{id: 'warm', name: 'Warm', values: [{offset: 1, value: 180}], color: '#ffaa00'}]
    };

    expect(fixtureOfDraft('par', draftOf(colored))).toEqual(colored);
  });

  test('leaves out unticked channels', () => {
    const draft = withPresetValueChange(withNewPreset(draftOf(par), 'red'), 0, 1, {included: false});

    expect(fixtureOfDraft('par', draft).presets?.[0].values).toEqual([{offset: 0, value: 0}]);
  });

  test('a value entered for a channel the preset leaves out ticks the channel, also a value of 0', () => {
    const unticked = withPresetValueChange(withNewPreset(draftOf(par), 'red'), 0, 1, {included: false});

    const entered = withPresetValueEntered(unticked, 0, 1, '0');

    expect(entered.presets[0]?.values[1]).toEqual({included: true, value: '0', entered: true});
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
    expect(withNewChannel(draftOf(withWarm), 'new').presets[0].values[2]).toEqual({
      included: false,
      value: '0',
      entered: false
    });
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

describe('moving channels', () => {
  const blue = {name: 'Blue', offset: 2, color: '#0000ff', lock: {max: 100}};
  const rgb = {
    ...par,
    channels: [...par.channels, blue],
    presets: [
      {
        id: 'warm',
        name: 'Warm',
        values: [
          {offset: 0, value: 255},
          {offset: 2, value: 30}
        ]
      }
    ]
  };

  test('changes the order of the channels only: offsets, rules and preset values stay with the channel', () => {
    const moved = fixtureOfDraft('par', withChannelMoved(draftOf(rgb), 2, 'earlier'));

    expect(moved.channels).toEqual([par.channels[0], blue, par.channels[1]]);
    expect(moved.presets).toEqual([
      {
        id: 'warm',
        name: 'Warm',
        values: [
          {offset: 0, value: 255},
          {offset: 2, value: 30}
        ]
      }
    ]);
    expect(fixtureErrors(moved)).toEqual([]);
  });

  test('moves the preset values in the draft with their row', () => {
    const moved = withChannelMoved(draftOf(rgb), 0, 'later');

    expect(moved.channels.map(({name}) => name)).toEqual(['Green', 'Red', 'Blue']);
    expect(moved.presets[0].values.map(({included, value}) => [included, value])).toEqual([
      [false, '0'],
      [true, '255'],
      [true, '30']
    ]);
  });

  test('a half-typed offset moves as typed', () => {
    const moved = withChannelMoved(withChannelChange(draftOf(rgb), 1, {offset: ''}), 1, 'later');

    expect(moved.channels.map(({offset}) => offset)).toEqual(['0', '2', '']);
  });

  test('nothing moves past either end', () => {
    expect(withChannelMoved(draftOf(rgb), 0, 'earlier')).toEqual(draftOf(rgb));
    expect(withChannelMoved(draftOf(rgb), 2, 'later')).toEqual(draftOf(rgb));
  });
});

describe('channelOffsetChanges', () => {
  test('maps every saved channel to its offset, moved or not', () => {
    expect(channelOffsetChanges(withChannelMoved(draftOf(par), 0, 'later'))).toEqual(
      new Map([
        [1, 1],
        [0, 0]
      ])
    );
  });

  test('follows a typed offset, leaves out removed, new and half-typed channels', () => {
    const typed = withChannelChange(draftOf(par), 1, {offset: '4'});
    expect(channelOffsetChanges(typed)).toEqual(
      new Map([
        [0, 0],
        [1, 4]
      ])
    );
    expect(channelOffsetChanges(withNewChannel(withoutChannel(draftOf(par), 0), 'new'))).toEqual(new Map([[1, 1]]));
    expect(channelOffsetChanges(withChannelChange(draftOf(par), 0, {offset: ''}))).toEqual(new Map([[1, 1]]));
    expect(channelOffsetChanges(newFixtureDraft('first'))).toEqual(new Map());
  });

  test('the row ids and stored offsets are not part of the saved fixture', () => {
    expect(fixtureOfDraft('par', withNewChannel(draftOf(par), 'new')).channels).toEqual([
      ...par.channels,
      {name: '', offset: 2}
    ]);
  });
});
