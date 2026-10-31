import {fixtureErrors} from '@shared/fixtures';

import {
  draftOf,
  fixtureOfDraft,
  newFixtureDraft,
  withChannelChange,
  withNewChannel,
  withoutChannel
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

  expect(withNewChannel(withGap).channels[2]).toEqual({name: '', offset: '5'});
  expect(withNewChannel(withoutChannel(newFixtureDraft(), 0)).channels).toEqual([{name: '', offset: '0'}]);
});

test('removes the channel at the index', () => {
  expect(withoutChannel(draftOf(par), 0).channels).toEqual([{name: 'Green', offset: '1'}]);
});
