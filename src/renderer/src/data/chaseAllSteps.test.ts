import type {Fixture} from '@shared/ipc';

import {
  channelInAllStepsEffect,
  holdOfAllStepsEffect,
  pickedRemovableChannel,
  removableChannels,
  stepIdsWithoutChannel,
  withoutChannelInAllStepsEffect
} from './chaseAllSteps';
import type {ChaseStepDraft} from './chaseDraft';

const par: Fixture = {
  id: 'par',
  name: 'PAR',
  startAddress: 10,
  channels: [
    {name: 'Red', offset: 0, color: '#ff0000'},
    {name: 'Green', offset: 1}
  ]
};

const wash: Fixture = {id: 'wash', name: 'Wash', startAddress: 11, channels: [{name: 'Dimmer', offset: 0}]};

const stepOf = (id: string, hold: string, channels: readonly string[]): ChaseStepDraft => ({
  id,
  hold,
  values: channels.map((channel, index) => ({id: `${id}-${index}`, channel, value: '0'}))
});

const steps = [stepOf('a', '1.00', ['10', '11', '40']), stepOf('b', '0.50', ['11']), stepOf('c', '1.00', ['40', 'x'])];

describe('the channels to remove', () => {
  test('grouped by fixture, a shared address under each, then Unassigned, each with how many steps set it', () => {
    expect(removableChannels([par, wash], steps)).toEqual([
      {
        kind: 'fixture',
        fixture: par,
        channels: [
          {channel: 10, stepCount: 1, fixtureChannel: par.channels[0]},
          {channel: 11, stepCount: 2, fixtureChannel: par.channels[1]}
        ]
      },
      {kind: 'fixture', fixture: wash, channels: [{channel: 11, stepCount: 2, fixtureChannel: wash.channels[0]}]},
      {kind: 'unassigned', channels: [{channel: 40, stepCount: 2}]}
    ]);
  });

  test('lowest first, a step setting a channel twice counted once, invalid channels left out', () => {
    const twice = [stepOf('a', '1.00', ['300', '7', '7', '0', '513', ''])];

    expect(removableChannels([], twice)).toEqual([
      {
        kind: 'unassigned',
        channels: [
          {channel: 7, stepCount: 1},
          {channel: 300, stepCount: 1}
        ]
      }
    ]);
  });

  test('none without channels', () => {
    expect(removableChannels([par], [])).toEqual([]);
    expect(removableChannels([par], [stepOf('a', '1.00', [])])).toEqual([]);
  });
});

test('setting the hold counts the steps holding for another time', () => {
  expect(holdOfAllStepsEffect(steps, 1000)).toEqual({changedCount: 1, holdMs: 1000});
  expect(holdOfAllStepsEffect(steps, 2000)).toEqual({changedCount: 3, holdMs: 2000});
  expect(holdOfAllStepsEffect([stepOf('a', '1', [])], 1000)).toEqual({changedCount: 0, holdMs: 1000});
  expect(holdOfAllStepsEffect([stepOf('a', '', [])], 1000)).toEqual({changedCount: 1, holdMs: 1000});
});

test('adding a channel counts the steps without it, of all steps', () => {
  expect(stepIdsWithoutChannel(steps, 11)).toEqual(['c']);
  expect(channelInAllStepsEffect(steps, 11)).toEqual({addedCount: 1, stepCount: 3});
  expect(channelInAllStepsEffect(steps, 1)).toEqual({addedCount: 3, stepCount: 3});
  expect(channelInAllStepsEffect([], 1)).toEqual({addedCount: 0, stepCount: 0});
});

test('Remove removes only the channel picked, while the steps set it', () => {
  const groups = removableChannels([par, wash], steps);
  expect(pickedRemovableChannel(groups, undefined)).toBeUndefined();
  expect(pickedRemovableChannel(groups, 40)).toBe(40);
  expect(
    pickedRemovableChannel(removableChannels([par, wash], [stepOf('a', '1.00', ['10', '11'])]), 40)
  ).toBeUndefined();
  expect(pickedRemovableChannel([], 40)).toBeUndefined();
});

describe('removing a channel', () => {
  test('counts the steps setting it and tells which are left empty', () => {
    expect(withoutChannelInAllStepsEffect(steps, 11, 'a')).toEqual({
      removedCount: 2,
      emptiedStepIndexes: [1],
      shownChangedIds: ['a-1']
    });
  });

  test('a step already empty is not left empty by it, nor one keeping an invalid channel', () => {
    const withEmpty = [...steps, stepOf('d', '1.00', [])];

    expect(withoutChannelInAllStepsEffect(withEmpty, 40, 'b')).toEqual({
      removedCount: 2,
      emptiedStepIndexes: [],
      shownChangedIds: []
    });
  });

  test('marks no row without a shown step', () => {
    expect(withoutChannelInAllStepsEffect(steps, 10, undefined).shownChangedIds).toEqual([]);
  });
});
