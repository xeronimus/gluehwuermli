import type {ChaseStatus} from '@shared/ipc';

/**
 * The renderer's access to the chase player, in the main process, which plays the chases as saved in the open project.
 * Allowed in Show mode too.
 */
export default interface ChaseService {
  getStatus: () => Promise<ChaseStatus>;
  /** replaces a chase already running; rejects for an id the open project has no chase with */
  start: (chaseId: string) => Promise<ChaseStatus>;
  pause: () => Promise<ChaseStatus>;
  resume: () => Promise<ChaseStatus>;
  /** the values stay */
  stop: () => Promise<ChaseStatus>;
  /** on every step and on start, pause, resume, stop and finish; returns the function that removes the listener again */
  onStatusChanged: (listener: (status: ChaseStatus) => void) => () => void;
}
