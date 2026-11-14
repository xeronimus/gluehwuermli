import type {MessageDescriptor} from '@lingui/core';

import type {ChaseStatus, ChaseSyncStatus} from '@shared/ipc';

export interface ChaseState {
  /** mirrors the chase player in main (useChaseSubscription); idle until main answered, as the app starts with none */
  chaseStatus: ChaseStatus;
  /** mirrors the sync and speed main keeps per chase; none differ from the default until main answered */
  chaseSync: ChaseSyncStatus;
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
  chaseSync: {chases: []},
  chaseError: undefined,
  stepOnRig: false
});
