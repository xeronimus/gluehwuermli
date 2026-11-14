import {setupChases} from '@shared/chases';
import {
  type ChaseStatus,
  type ChaseSyncStatus,
  parseSetChaseSpeedRequest,
  parseSetChaseSyncRequest,
  parseStartChaseRequest
} from '@shared/ipc';

import type {ChasePlayer} from '@/chase/chasePlayer';
import type {ProjectSession} from '@/project/projectSession';

export interface ChaseIpcHandlers {
  status: () => ChaseStatus;
  /** rejects for an invalid request, without an open project and for an id the open project has no chase with */
  start: (payload: unknown) => Promise<ChaseStatus>;
  pause: () => ChaseStatus;
  resume: () => ChaseStatus;
  stop: () => ChaseStatus;
  syncStatus: () => ChaseSyncStatus;
  /** rejects for an invalid request; answers the sync status it leaves */
  setSync: (payload: unknown) => Promise<ChaseSyncStatus>;
  /** rejects for an invalid request; answers the sync status it leaves */
  setSpeed: (payload: unknown) => Promise<ChaseSyncStatus>;
}

/**
 * What the chase IPC channels do, without Electron. Not tied to the mode: Show mode plays chases, it only can't change
 * them. Start takes an id, never a chase: main plays it as saved in the open project (doc/chases.md). Sync and speed
 * take any chase id: they only change a setting, the open project isn't asked
 */
export function chaseIpcHandlers(player: ChasePlayer, session: Pick<ProjectSession, 'status'>): ChaseIpcHandlers {
  const savedChase = (chaseId: string) => {
    const status = session.status();
    return status.type === 'open' ? setupChases(status.project.setup).find(({id}) => id === chaseId) : undefined;
  };

  return {
    status: () => player.status(),
    start: async (payload) => {
      const request = parseStartChaseRequest(payload);
      if (!request) {
        throw new Error('invalid start-chase request');
      }
      const chase = savedChase(request.chaseId);
      if (!chase) {
        throw new Error(`the open project has no chase ${request.chaseId}`);
      }
      player.start(chase);
      return player.status();
    },
    pause: () => {
      player.pause();
      return player.status();
    },
    resume: () => {
      player.resume();
      return player.status();
    },
    stop: () => {
      player.stop();
      return player.status();
    },
    syncStatus: () => player.syncStatus(),
    setSync: async (payload) => {
      const request = parseSetChaseSyncRequest(payload);
      if (!request) {
        throw new Error('invalid set-chase-sync request');
      }
      player.setSync(request.chaseId, request.synced);
      return player.syncStatus();
    },
    setSpeed: async (payload) => {
      const request = parseSetChaseSpeedRequest(payload);
      if (!request) {
        throw new Error('invalid set-chase-speed request');
      }
      player.setSpeed(request.chaseId, request.speed);
      return player.syncStatus();
    }
  };
}
