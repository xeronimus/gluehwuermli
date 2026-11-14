import type {TempoStatus} from '@shared/ipc';

/**
 * The renderer's access to the tempo clock in the main process, which timestamps the taps. Allowed in Show mode too.
 */
export default interface TempoService {
  /** fire-and-forget: one tap of the tempo pad */
  tap: () => void;
  getStatus: () => Promise<TempoStatus>;
  /** whenever a tap sets a tempo; returns the function that removes the listener again */
  onStatusChanged: (listener: (status: TempoStatus) => void) => () => void;
}
