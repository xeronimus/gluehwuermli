import {dmxService} from '@/data/service/services';

import {useAppStore} from '../store';

/**
 * Emergency off: every fader to 0 and the main process blacks out the universe, sent on its next tick. Changes nothing
 * stored (fixtures, scenes, presets, the project file) and works in every mode, the main process doesn't check it.
 */
export function useActionEmergencyOff() {
  const clearChannelValues = useAppStore((state) => state.clearChannelValues);

  return () => {
    clearChannelValues();
    dmxService.blackout();
  };
}
