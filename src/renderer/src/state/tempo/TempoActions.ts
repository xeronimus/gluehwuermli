import type {MessageDescriptor} from '@lingui/core';

import type {TempoStatus} from '@shared/ipc';

import type {TempoState} from './TempoState';

export type TempoStateSetter = (
  partial: TempoState | Partial<TempoState> | ((state: TempoState) => TempoState | Partial<TempoState>),
  replace?: false,
  action?: string
) => void;

export interface TempoActions {
  /** the status and when it arrived, on the renderer's clock */
  setTempoStatus: (tempoStatus: TempoStatus, tempoReceivedAtMs: number) => void;
  setTempoError: (tempoError: MessageDescriptor | undefined) => void;
}

export const getTempoActions = (set: TempoStateSetter): TempoActions => ({
  setTempoStatus: (tempoStatus, tempoReceivedAtMs) =>
    set({tempoStatus, tempoReceivedAtMs}, undefined, 'tempo/setTempoStatus'),
  setTempoError: (tempoError) => set({tempoError}, undefined, 'tempo/setTempoError')
});
