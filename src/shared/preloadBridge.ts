import type {
  BlackoutOnQuit,
  ChosenLocale,
  DataFolder,
  DmxOutputStatus,
  FixtureSetup,
  Locale,
  LockStatus,
  OpenDataFolderResult,
  PasswordResult,
  ProjectOpenResult,
  ProjectStatus,
  RecentProject,
  RememberedPort,
  SerialPortDescription,
  SetChannelRequest
} from './ipc';

/** the global under which the preload script exposes the PreloadBridge to the renderer (`window.gluehwuermli`) */
export const PRELOAD_BRIDGE_GLOBAL = 'gluehwuermli';

/** What the preload script exposes to the renderer. The renderer never sees ipcRenderer or any Node API. */
export interface PreloadBridge {
  setChannel: (channel: number, value: number) => void;
  setChannelValues: (values: readonly SetChannelRequest[]) => void;
  listPorts: () => Promise<readonly SerialPortDescription[]>;
  connect: (path: string) => Promise<DmxOutputStatus>;
  disconnect: () => Promise<DmxOutputStatus>;
  getStatus: () => Promise<DmxOutputStatus>;
  /** the port the output was last connected to, to preselect it */
  getRememberedPort: () => Promise<RememberedPort>;
  /** returns the function that removes the listener again */
  onStatusChanged: (listener: (status: DmxOutputStatus) => void) => () => void;
  getProjectStatus: () => Promise<ProjectStatus>;
  /** rejects in Show mode or when the new file can't be written */
  createProject: () => Promise<ProjectOpenResult>;
  openProject: () => Promise<ProjectOpenResult>;
  /** rejects for a path that is neither recent nor double-clicked */
  openRecentProject: (path: string) => Promise<ProjectOpenResult>;
  listRecentProjects: () => Promise<readonly RecentProject[]>;
  /** rejects if the list can't be stored */
  removeRecentProject: (path: string) => Promise<void>;
  /** rejects when the main process refuses the setup (Show mode, another project) or cannot write it */
  saveFixtures: (projectPath: string, setup: FixtureSetup) => Promise<void>;
  /** returns the function that removes the listener again */
  onProjectChanged: (listener: (status: ProjectStatus) => void) => () => void;
  /** returns the function that removes the listener again */
  onProjectOpenRequested: (listener: (path: string) => void) => () => void;
  getDataFolder: () => Promise<DataFolder>;
  /** a folder that can't be opened is a `failed` result, not a rejection; refused in Show mode */
  openDataFolder: () => Promise<OpenDataFolderResult>;
  /** the language chosen in the app, if any */
  getLocale: () => Promise<ChosenLocale>;
  /** remembers the language for the next start; allowed in Show mode too. Rejects if it can't be stored */
  setLocale: (locale: Locale) => Promise<void>;
  /** whether quitting sends an all-zero universe before the port is closed */
  getBlackoutOnQuit: () => Promise<BlackoutOnQuit>;
  /** allowed in Show mode too; rejects if it can't be stored */
  setBlackoutOnQuit: (enabled: boolean) => Promise<void>;
  getLockStatus: () => Promise<LockStatus>;
  /** Setup mode; with no password stored yet, stores this one and unlocks */
  unlock: (password: string) => Promise<PasswordResult>;
  /** back to Show mode; leaves the channel lock as it is */
  lock: () => Promise<LockStatus>;
  /** the password is needed in Show mode only (rejects without it there) */
  liftChannelLock: (password: string | undefined) => Promise<PasswordResult>;
  /** turns the channel lock on again; needs no password */
  lockChannels: () => Promise<LockStatus>;
  /** Setup mode only (rejects in Show mode, or when the new password can't be stored); the current password is checked */
  changePassword: (currentPassword: string, newPassword: string) => Promise<PasswordResult>;
  /** fire-and-forget: restarts the idle timer that locks Setup mode again */
  reportActivity: () => void;
  /** returns the function that removes the listener again */
  onLockChanged: (listener: (status: LockStatus) => void) => () => void;
}
