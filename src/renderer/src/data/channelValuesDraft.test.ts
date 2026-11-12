import {
  channelValuesDraftOf,
  channelValuesOfDraft,
  newChannelValuesDraft,
  positionChoices,
  withNewPosition,
  withPositionChange,
  withValueMode
} from './channelValuesDraft';

test('a channel without rules is drafted as continuous with blank bounds, and stored without rules', () => {
  expect(channelValuesDraftOf(undefined)).toEqual(newChannelValuesDraft());
  expect(channelValuesOfDraft(newChannelValuesDraft())).toBeUndefined();
});

test('bounds at the ends of the DMX range are drafted blank', () => {
  expect(channelValuesDraftOf({mode: 'steps', min: 0, max: 255, step: 5})).toMatchObject({min: '', max: '', step: '5'});
  expect(channelValuesDraftOf({mode: 'continuous', min: 20, max: 200})).toMatchObject({min: '20', max: '200'});
});

test('a preset picks from the valid positions, lowest first, each value once, by name or value', () => {
  const draft = {
    ...newChannelValuesDraft(),
    mode: 'positions' as const,
    positions: [
      {value: '200', name: 'Star', momentary: false},
      {value: '', name: 'Not yet', momentary: false},
      {value: '5', name: ' ', momentary: false},
      {value: '200', name: 'Twice', momentary: false}
    ]
  };

  expect(positionChoices(draft)).toEqual([
    {value: '5', label: '5'},
    {value: '200', label: 'Star'}
  ]);
});

describe('the display of a positions channel', () => {
  const positions = [{value: 0, name: 'Open'}, {value: 20}];

  test('buttons are stored and drafted back, a fader is stored as before', () => {
    const buttons = {mode: 'positions' as const, positions, display: 'buttons' as const};
    expect(channelValuesDraftOf(buttons).display).toBe('buttons');
    expect(channelValuesOfDraft(channelValuesDraftOf(buttons))).toEqual(buttons);

    const fader = {mode: 'positions' as const, positions};
    expect(channelValuesDraftOf(fader).display).toBe('fader');
    expect(channelValuesOfDraft(channelValuesDraftOf(fader))).toEqual(fader);
  });

  test('only positions are stored with the display, and switching the mode back keeps it', () => {
    const buttons = channelValuesDraftOf({mode: 'positions', positions, display: 'buttons'});
    const steps = withValueMode(buttons, 'steps');
    expect(channelValuesOfDraft(steps)).not.toHaveProperty('display');
    expect(withValueMode(steps, 'positions').display).toBe('buttons');
  });
});

describe('momentary positions', () => {
  const flash = {
    mode: 'positions' as const,
    positions: [{value: 0}, {value: 255, name: 'Flash', momentary: true as const}],
    display: 'buttons' as const
  };

  test('are stored and drafted back with buttons', () => {
    expect(channelValuesDraftOf(flash).positions.map(({momentary}) => momentary)).toEqual([false, true]);
    expect(channelValuesOfDraft(channelValuesDraftOf(flash))).toEqual(flash);
  });

  test('are not stored with a fader, and come back when switched to buttons again', () => {
    const fader = {...channelValuesDraftOf(flash), display: 'fader' as const};
    expect(channelValuesOfDraft(fader)).toEqual({
      mode: 'positions',
      positions: [{value: 0}, {value: 255, name: 'Flash'}]
    });
    expect(channelValuesOfDraft({...fader, display: 'buttons'})).toEqual(flash);
  });

  test('are not stored after switching to steps or continuous', () => {
    const draft = channelValuesDraftOf(flash);
    expect(channelValuesOfDraft(withValueMode(draft, 'steps'))).not.toHaveProperty('positions');
    expect(channelValuesOfDraft(withValueMode(draft, 'continuous'))).toBeUndefined();
  });

  test('a checked box makes a position momentary, a new position is not', () => {
    const draft = withPositionChange(channelValuesDraftOf({...flash, positions: [{value: 0}, {value: 255}]}), 0, {
      momentary: true
    });
    expect(channelValuesOfDraft(draft)).toEqual({...flash, positions: [{value: 0, momentary: true}, {value: 255}]});
    expect(withNewPosition(draft).positions.at(-1)?.momentary).toBe(false);
    expect(withValueMode(newChannelValuesDraft(), 'positions').positions.every(({momentary}) => !momentary)).toBe(true);
  });
});

test('positions are stored lowest value first, blank ones last', () => {
  const draft = {
    ...newChannelValuesDraft(),
    mode: 'positions' as const,
    positions: [
      {value: '200', name: 'Star', momentary: false},
      {value: '', name: 'Not yet', momentary: false},
      {value: '5', name: '', momentary: false}
    ]
  };

  expect(channelValuesOfDraft(draft)).toEqual({
    mode: 'positions',
    positions: [{value: 5}, {value: 200, name: 'Star'}, {value: Number.NaN, name: 'Not yet'}]
  });
});
