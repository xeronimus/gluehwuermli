import type {MessageDescriptor} from '@lingui/core';

import type {ChaseStatus, ChaseSyncStatus} from '@shared/ipc';

import type {ChaseState} from './ChaseState';

export type ChaseStateSetter = (
  partial: ChaseState | Partial<ChaseState> | ((state: ChaseState) => ChaseState | Partial<ChaseState>),
  replace?: false,
  action?: string
) => void;

export interface ChaseActions {
  setChaseStatus: (chaseStatus: ChaseStatus) => void;
  setChaseSync: (chaseSync: ChaseSyncStatus) => void;
  setChaseError: (chaseError: MessageDescriptor | undefined) => void;
  setStepOnRig: (stepOnRig: boolean) => void;
}

export const getChaseActions = (set: ChaseStateSetter): ChaseActions => ({
  setChaseStatus: (chaseStatus) => set({chaseStatus}, undefined, 'chase/setChaseStatus'),
  setChaseSync: (chaseSync) => set({chaseSync}, undefined, 'chase/setChaseSync'),
  setChaseError: (chaseError) => set({chaseError}, undefined, 'chase/setChaseError'),
  setStepOnRig: (stepOnRig) => set({stepOnRig}, undefined, 'chase/setStepOnRig')
});
