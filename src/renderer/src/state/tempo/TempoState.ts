import type {MessageDescriptor} from '@lingui/core';

import type {TempoStatus} from '@shared/ipc';

export interface TempoState {
  /** mirrors main's tempo clock (useTempoSubscription); none until main answered */
  tempoStatus: TempoStatus;
  /** the renderer's performance.now() when the status arrived: its `sinceBeatMs` was measured then */
  tempoReceivedAtMs: number;
  /** a failure talking to main about the tempo */
  tempoError: MessageDescriptor | undefined;
}

export const getDefaultTempoState = (): TempoState => ({
  tempoStatus: {type: 'none'},
  tempoReceivedAtMs: 0,
  tempoError: undefined
});
