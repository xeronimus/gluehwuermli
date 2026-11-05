import {fixtureSetupOf} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import {getDefaultFixturesState} from '../fixtures/FixturesState';
import {type LockStatusState, getDefaultLockState} from './LockState';
import {selectChannelLimit, selectChannelLimits, selectIsSetupMode, selectLiftedChannelLimit} from './lockSelectors';

const laserBox: Fixture = {
  id: 'box',
  name: 'LightBox',
  startAddress: 20,
  channels: [
    {name: 'Dimmer', offset: 0},
    {name: 'Laser', offset: 1, lock: {max: 0}}
  ]
};

const stateWith = (lockStatus: LockStatusState) => ({
  ...getDefaultFixturesState(),
  ...getDefaultLockState(),
  project: {type: 'open' as const, project: {path: 'Rig.glp', setup: fixtureSetupOf([laserBox])}},
  lockStatus
});

test('only Setup mode is Setup mode, not the status still loading', () => {
  expect(selectIsSetupMode(stateWith({mode: 'setup', passwordSet: true, channelLocked: true}))).toBe(true);
  expect(selectIsSetupMode(stateWith({mode: 'show', passwordSet: true, channelLocked: true}))).toBe(false);
  expect(selectIsSetupMode(stateWith({mode: 'loading'}))).toBe(false);
});

test('the fixtures caps apply while loading and until the lock is lifted', () => {
  expect(selectChannelLimit(stateWith({mode: 'loading'}), 21)).toBe(0);
  expect(selectChannelLimit(stateWith({mode: 'show', passwordSet: true, channelLocked: true}), 21)).toBe(0);
  expect(selectChannelLimit(stateWith({mode: 'setup', passwordSet: true, channelLocked: true}), 21)).toBe(0);
  expect(selectChannelLimit(stateWith({mode: 'setup', passwordSet: true, channelLocked: true}), 20)).toBeUndefined();
  expect(selectChannelLimits(stateWith({mode: 'show', passwordSet: true, channelLocked: false}))).toEqual(new Map());
});

test('a lifted cap is the declared one, only once the channel lock is lifted', () => {
  expect(selectLiftedChannelLimit(stateWith({mode: 'setup', passwordSet: true, channelLocked: false}), 21)).toBe(0);
  expect(
    selectLiftedChannelLimit(stateWith({mode: 'setup', passwordSet: true, channelLocked: false}), 20)
  ).toBeUndefined();
  expect(
    selectLiftedChannelLimit(stateWith({mode: 'setup', passwordSet: true, channelLocked: true}), 21)
  ).toBeUndefined();
  expect(selectLiftedChannelLimit(stateWith({mode: 'loading'}), 21)).toBeUndefined();
});
