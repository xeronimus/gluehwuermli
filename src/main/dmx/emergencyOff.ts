import type {ChasePlayer} from '@/chase/chasePlayer';

import type {DmxEngine} from './dmxEngine';

/**
 * Emergency off: the chase stops before the blackout, so no step comes after the zeros. Both are synchronous, no tick
 * runs between them
 */
export const emergencyOffFactory =
  (chasePlayer: Pick<ChasePlayer, 'stop'>, engine: Pick<DmxEngine, 'blackout'>) => (): void => {
    chasePlayer.stop();
    engine.blackout();
  };
