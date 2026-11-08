import type {ChaseStatus} from '@shared/ipc';

import type ChaseService from '@/data/service/ChaseService';

const IDLE: ChaseStatus = {type: 'idle'};

/** a ChaseService that can push a status like main does on a step or a finish */
export interface InMemoryChaseService extends ChaseService {
  pushStatus: (status: ChaseStatus) => void;
}

/**
 * a ChaseService without the main process: the renderer opened in a plain browser, or a test. It knows no chases, so a
 * started one stays at its first step and sets no values
 */
export function inMemoryChaseServiceFactory(): InMemoryChaseService {
  const listeners = new Set<(status: ChaseStatus) => void>();
  let status: ChaseStatus = IDLE;

  const setStatus = (next: ChaseStatus) => {
    status = next;
    listeners.forEach((listener) => listener(next));
    return next;
  };

  return {
    getStatus: async () => status,
    start: async (chaseId) => setStatus({type: 'running', chaseId, stepIndex: 0, passIndex: 0}),
    pause: async () => (status.type === 'running' ? setStatus({...status, type: 'paused'}) : status),
    resume: async () => (status.type === 'paused' ? setStatus({...status, type: 'running'}) : status),
    stop: async () => (status.type === 'idle' ? status : setStatus(IDLE)),
    onStatusChanged: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    pushStatus: (next) => {
      setStatus(next);
    }
  };
}
