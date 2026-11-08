import type {MessageDescriptor} from '@lingui/core';

import type {ChaseStatus} from '@shared/ipc';

import type {ChaseState} from './ChaseState';

export type ChaseStateSetter = (
  partial: ChaseState | Partial<ChaseState> | ((state: ChaseState) => ChaseState | Partial<ChaseState>),
  replace?: false,
  action?: string
) => void;

export interface ChaseActions {
  setChaseStatus: (chaseStatus: ChaseStatus) => void;
  setChaseError: (chaseError: MessageDescriptor | undefined) => void;
}

export const getChaseActions = (set: ChaseStateSetter): ChaseActions => ({
  setChaseStatus: (chaseStatus) => set({chaseStatus}, undefined, 'chase/setChaseStatus'),
  setChaseError: (chaseError) => set({chaseError}, undefined, 'chase/setChaseError')
});
