import {parseTempoStatus} from '@shared/ipc';
import type {PreloadBridge} from '@shared/preloadBridge';

import logger from '@/data/service/Logger';
import type TempoService from '@/data/service/TempoService';

/** the TempoService over the bridge the preload script exposes; a push that isn't a tempo status is dropped */
export const electronTempoServiceFactory = (bridge: PreloadBridge): TempoService => ({
  tap: () => bridge.tapTempo(),
  getStatus: () => bridge.getTempoStatus(),
  onStatusChanged: (listener) =>
    bridge.onTempoStatusChanged((payload) => {
      const status = parseTempoStatus(payload);
      if (!status) {
        logger.warn('dropped invalid tempo status', payload);
        return;
      }
      listener(status);
    })
});
