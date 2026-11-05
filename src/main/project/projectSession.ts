import {channelLimits, emptyFixtureSetup} from '@shared/fixtures';
import type {FixtureSetup, ProjectOpenResult, ProjectStatus, RecentProject} from '@shared/ipc';
import {withProjectFileExtension} from '@shared/projects';
import {createSerialQueue} from '@shared/serialQueue';

import type {DmxEngine} from '@/dmx/dmxEngine';
import type {AppSettings} from '@/settings/appSettings';

import type {ProjectDialogs} from './ProjectDialogs';
import type {ProjectFileStore} from './ProjectFileStore';
import {isSamePath, withRecentProject, withoutRecentProject} from './recentProjects';

export interface ProjectSessionLog {
  info: (...message: unknown[]) => void;
  warn: (...message: unknown[]) => void;
}

/**
 * The one owner of the open project (ADR 4): which .glp it is, what it holds, and the engine's channel limits that
 * follow from it. Every saved change is written to the file right away. Opening another project blacks out the
 * output and applies its limits in one step, before the next packet. Opening, creating and saving run one after the
 * other, so a save never overlaps a switch.
 */
export interface ProjectSession {
  /**
   * on start, before the output connects: the .glp from the command line, else the last project. Never rejects, a
   * project that can't be opened ends in the `failed` status
   */
  start: (commandLinePath: string | undefined) => Promise<void>;
  status: () => ProjectStatus;
  /** Setup mode only (rejects in Show mode): asks for the new file, writes an empty project and opens it */
  create: () => Promise<ProjectOpenResult>;
  /** asks for a .glp; allowed in Show mode */
  openWithDialog: () => Promise<ProjectOpenResult>;
  /** rejects for a path that is neither recent nor requested: the renderer can't name just any file */
  openRecent: (path: string) => Promise<ProjectOpenResult>;
  /** a .glp double-clicked while the app runs: may be opened from now on, the listeners decide when */
  requestOpen: (path: string) => void;
  listRecent: () => Promise<RecentProject[]>;
  /** rejects if the settings can't be stored */
  removeRecent: (path: string) => Promise<void>;
  /** rejects in Show mode, without an open project, for another project's setup and if the file can't be written */
  saveFixtures: (projectPath: string, setup: FixtureSetup) => Promise<void>;
  /** another project was opened; returns the function that removes the listener again */
  onChanged: (listener: (status: ProjectStatus) => void) => () => void;
  /** returns the function that removes the listener again */
  onOpenRequested: (listener: (path: string) => void) => () => void;
}

export interface ProjectSessionDependencies {
  store: ProjectFileStore;
  engine: Pick<DmxEngine, 'blackout' | 'setChannelLimits'>;
  settings: Pick<AppSettings, 'load' | 'update'>;
  isSetupMode: () => boolean;
  dialogs: ProjectDialogs;
  fileExists: (path: string) => Promise<boolean>;
  log: ProjectSessionLog;
}

const CANCELLED: ProjectOpenResult = {type: 'cancelled'};

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function projectSessionFactory({
  store,
  engine,
  settings,
  isSetupMode,
  dialogs,
  fileExists,
  log
}: ProjectSessionDependencies): ProjectSession {
  let currentStatus: ProjectStatus = {type: 'none'};
  /** paths the user named outside the app (command line, double-click): openRecent accepts them like recent ones */
  const requestedPaths = new Set<string>();
  const changeListeners = new Set<(status: ProjectStatus) => void>();
  const openRequestListeners = new Set<(path: string) => void>();
  const runSerially = createSerialQueue();

  const recentPaths = async () => (await settings.load()).recentProjectPaths ?? [];

  /** a project that opened but can't be remembered still plays: the settings are only the next start's convenience */
  const remember = async (path: string) => {
    try {
      await settings.update({lastProjectPath: path, recentProjectPaths: withRecentProject(await recentPaths(), path)});
    } catch (error) {
      log.warn(`remembering the project ${path} failed`, error);
    }
  };

  /** blackout and the new limits in one synchronous step: no tick can send between them */
  const switchTo = (path: string, setup: FixtureSetup) => {
    engine.blackout();
    engine.setChannelLimits(channelLimits(setup.fixtures));
    currentStatus = {type: 'open', project: {path, setup}};
    changeListeners.forEach((listener) => listener(currentStatus));
  };

  const open = async (path: string): Promise<ProjectOpenResult> => {
    const file = await store.read(path);
    if (file.type === 'failed') {
      log.warn(`opening the project ${path} failed: ${file.error.reason}`);
      return {type: 'failed', path, error: file.error};
    }
    switchTo(path, file.setup);
    log.info(`opened the project ${path}`);
    await remember(path);
    return {type: 'opened', project: {path, setup: file.setup}};
  };

  /** the path as the user named it (recent list, command line, double-click), if it is one of these */
  const allowedPathOf = async (path: string) =>
    [...requestedPaths, ...(await recentPaths())].find((allowed) => isSamePath(allowed, path));

  const start = (commandLinePath: string | undefined) =>
    runSerially(async () => {
      if (commandLinePath !== undefined) {
        requestedPaths.add(commandLinePath);
      }
      const path = commandLinePath ?? (await settings.load()).lastProjectPath;
      if (path === undefined) {
        log.info('no project to open on start');
        return;
      }
      const result = await open(path);
      // the last project stays remembered: its error shows again on the next start, until another one is opened
      if (result.type === 'failed') {
        currentStatus = {type: 'failed', path, error: result.error};
      }
    });

  const create = () =>
    runSerially(async (): Promise<ProjectOpenResult> => {
      if (!isSetupMode()) {
        throw new Error('a project can only be created in Setup mode');
      }
      const chosenPath = await dialogs.chooseNewProjectPath();
      if (chosenPath === undefined) {
        return CANCELLED;
      }
      const path = withProjectFileExtension(chosenPath);
      try {
        await store.write(path, emptyFixtureSetup());
      } catch (error) {
        log.warn(`creating the project ${path} failed`, error);
        return {type: 'failed', path, error: {reason: 'not-writable', message: messageOf(error)}};
      }
      return open(path);
    });

  const openWithDialog = () =>
    runSerially(async (): Promise<ProjectOpenResult> => {
      const path = await dialogs.chooseProjectToOpen();
      return path === undefined ? CANCELLED : open(path);
    });

  const openRecent = (path: string) =>
    runSerially(async () => {
      const allowedPath = await allowedPathOf(path);
      if (allowedPath === undefined) {
        throw new Error('only a recent or double-clicked project can be opened by its path');
      }
      return open(allowedPath);
    });

  const saveFixtures = (projectPath: string, setup: FixtureSetup) =>
    runSerially(async () => {
      if (!isSetupMode()) {
        throw new Error('fixtures can only be changed in Setup mode');
      }
      if (currentStatus.type !== 'open') {
        throw new Error('there is no project to save the fixtures to');
      }
      const {path} = currentStatus.project;
      if (!isSamePath(path, projectPath)) {
        throw new Error(`the fixtures belong to ${projectPath}, not to the open project ${path}`);
      }
      await store.write(path, setup);
      currentStatus = {type: 'open', project: {path, setup}};
      engine.setChannelLimits(channelLimits(setup.fixtures));
    });

  return {
    start,
    status: () => currentStatus,
    create,
    openWithDialog,
    openRecent,
    requestOpen: (path) => {
      requestedPaths.add(path);
      openRequestListeners.forEach((listener) => listener(path));
    },
    listRecent: async () =>
      Promise.all((await recentPaths()).map(async (path) => ({path, exists: await fileExists(path)}))),
    // in the queue: an open running at the same time would otherwise put back the list from before
    removeRecent: (path) =>
      runSerially(async () => {
        await settings.update({recentProjectPaths: withoutRecentProject(await recentPaths(), path)});
      }),
    saveFixtures,
    onChanged: (listener) => {
      changeListeners.add(listener);
      return () => changeListeners.delete(listener);
    },
    onOpenRequested: (listener) => {
      openRequestListeners.add(listener);
      return () => openRequestListeners.delete(listener);
    }
  };
}
