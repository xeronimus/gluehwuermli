import type {MessageDescriptor} from '@lingui/core';

import type {ChaseStatus} from '@shared/ipc';

export interface ChaseState {
  /** mirrors the chase player in main (useChaseSubscription); idle until main answered, as the app starts with none */
  chaseStatus: ChaseStatus;
  /** a failure talking to main about the chases */
  chaseError: MessageDescriptor | undefined;
}

export const getDefaultChaseState = (): ChaseState => ({
  chaseStatus: {type: 'idle'},
  chaseError: undefined
});
