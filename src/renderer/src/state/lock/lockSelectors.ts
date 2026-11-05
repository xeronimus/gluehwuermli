import {createSelector} from 'reselect';

import type {LockStatus} from '@shared/ipc';

import {activeLimits, liftedLimits} from '@/data/channelLocks';

import type {FixturesState} from '../fixtures/FixturesState';
import {selectFixtures} from '../fixtures/fixturesSelectors';
import type {LockState} from './LockState';

/** the status once the main process answered */
const selectKnownLockStatus = (state: LockState): LockStatus | undefined =>
  state.lockStatus.mode === 'loading' ? undefined : state.lockStatus;

export const selectIsSetupMode = (state: LockState): boolean => state.lockStatus.mode === 'setup';

/** the caps that apply now, per address; none once the channel lock is lifted */
export const selectChannelLimits = createSelector([selectFixtures, selectKnownLockStatus], (fixtures, lockStatus) =>
  activeLimits(fixtures, lockStatus)
);

/** per fader, so a fader re-renders only when its own channel's cap changes */
export const selectChannelLimit = (state: FixturesState & LockState, channel: number): number | undefined =>
  selectChannelLimits(state).get(channel);

/** the caps that don't apply now, per address: the fixtures' ones once the channel lock is lifted, none while it is on */
export const selectLiftedChannelLimits = createSelector(
  [selectFixtures, selectKnownLockStatus],
  (fixtures, lockStatus) => liftedLimits(fixtures, lockStatus)
);

/** the channel's cap while the channel lock is lifted, so its fader can show it goes higher than usual */
export const selectLiftedChannelLimit = (state: FixturesState & LockState, channel: number): number | undefined =>
  selectLiftedChannelLimits(state).get(channel);
