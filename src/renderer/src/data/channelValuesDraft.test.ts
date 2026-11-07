import {channelValuesDraftOf, channelValuesOfDraft, newChannelValuesDraft, positionChoices} from './channelValuesDraft';

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
