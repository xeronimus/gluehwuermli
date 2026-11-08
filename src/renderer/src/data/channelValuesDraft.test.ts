import {
  channelValuesDraftOf,
  channelValuesOfDraft,
  newChannelValuesDraft,
  positionChoices,
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
      {value: '200', name: 'Star'},
      {value: '', name: 'Not yet'},
      {value: '5', name: ' '},
      {value: '200', name: 'Twice'}
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

test('positions are stored lowest value first, blank ones last', () => {
  const draft = {
    ...newChannelValuesDraft(),
    mode: 'positions' as const,
    positions: [
      {value: '200', name: 'Star'},
      {value: '', name: 'Not yet'},
      {value: '5', name: ''}
    ]
  };

  expect(channelValuesOfDraft(draft)).toEqual({
    mode: 'positions',
    positions: [{value: 5}, {value: 200, name: 'Star'}, {value: Number.NaN, name: 'Not yet'}]
  });
});
