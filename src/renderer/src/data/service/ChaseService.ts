import type {ChaseSpeed, ChaseStatus, ChaseSyncStatus} from '@shared/ipc';

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
  /** the chases whose sync or speed differ from the default (not synced, 1×) */
  getSync: () => Promise<ChaseSyncStatus>;
  /** turning it on without a tempo changes nothing */
  setSync: (chaseId: string, synced: boolean) => Promise<ChaseSyncStatus>;
  setSpeed: (chaseId: string, speed: ChaseSpeed) => Promise<ChaseSyncStatus>;
  /** whenever a chase's sync or speed changes; returns the function that removes the listener again */
  onSyncChanged: (listener: (status: ChaseSyncStatus) => void) => () => void;
}
