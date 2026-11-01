import type {LockStatus, PasswordResult} from '@shared/ipc';

/** The renderer's view of Show and Setup mode; the main process decides and enforces both. */
export default interface LockService {
  getStatus: () => Promise<LockStatus>;
  /** Setup mode; with no password set yet, sets this one */
  unlock: (password: string) => Promise<PasswordResult>;
  /** back to Show mode, the channel lock stays as it is */
  lock: () => Promise<LockStatus>;
  /** the password is only needed in Show mode; rejects there without one */
  liftChannelLock: (password: string | undefined) => Promise<PasswordResult>;
  lockChannels: () => Promise<LockStatus>;
  /** Setup mode only; rejects in Show mode or when the new password can't be stored */
  changePassword: (currentPassword: string, newPassword: string) => Promise<PasswordResult>;
  /** fire-and-forget: keeps Setup mode from locking itself for being idle */
  reportActivity: () => void;
  /** returns the function that removes the listener again */
  onChanged: (listener: (status: LockStatus) => void) => () => void;
}
