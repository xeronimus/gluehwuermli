import type {MessageDescriptor} from '@lingui/core';

import type {ChaseStatus} from '@shared/ipc';

export interface ChaseState {
  /** mirrors the chase player in main (useChaseSubscription); idle until main answered, as the app starts with none */
  chaseStatus: ChaseStatus;
  /** a failure talking to main about the chases */
  chaseError: MessageDescriptor | undefined;
  /**
   * the chase editor's "Preview on rig": the shown step is sent while it is edited. Here, not in the editor, as Start,
   * Resume and Emergency off turn it off
   */
  stepOnRig: boolean;
}

export const getDefaultChaseState = (): ChaseState => ({
  chaseStatus: {type: 'idle'},
  chaseError: undefined,
  stepOnRig: false
});
