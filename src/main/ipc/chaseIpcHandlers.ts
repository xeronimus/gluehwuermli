import {setupChases} from '@shared/chases';
import {type ChaseStatus, parseStartChaseRequest} from '@shared/ipc';

import type {ChasePlayer} from '@/chase/chasePlayer';
import type {ProjectSession} from '@/project/projectSession';

export interface ChaseIpcHandlers {
  status: () => ChaseStatus;
  /** rejects for an invalid request, without an open project and for an id the open project has no chase with */
  start: (payload: unknown) => Promise<ChaseStatus>;
  pause: () => ChaseStatus;
  resume: () => ChaseStatus;
  stop: () => ChaseStatus;
}

/**
 * What the chase IPC channels do, without Electron. Not tied to the mode: Show mode plays chases, it only can't change
 * them. Start takes an id, never a chase: main plays it as saved in the open project (doc/chases.md)
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
    }
  };
}
