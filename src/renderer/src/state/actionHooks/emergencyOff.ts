import type DmxService from '@/data/service/DmxService';
import {dmxService} from '@/data/service/services';

import type {ChannelsActions} from '../channels/ChannelsActions';
import type {ChaseActions} from '../chase/ChaseActions';
import {useAppStore} from '../store';

/**
 * Emergency off: every fader to 0 and the main process blacks out the universe, sent on its next tick; a previewed
 * chase step stops being sent. Changes nothing stored (fixtures, scenes, presets, the project file) and works in every
 * mode, the main process doesn't check it.
 */
export function emergencyOff(
  service: Pick<DmxService, 'blackout'>,
  actions: Pick<ChannelsActions, 'clearChannelValues'> & Pick<ChaseActions, 'setStepOnRig'>
): void {
  actions.setStepOnRig(false);
  actions.clearChannelValues();
  service.blackout();
}

export function useActionEmergencyOff() {
  return () => emergencyOff(dmxService, useAppStore.getState());
}
