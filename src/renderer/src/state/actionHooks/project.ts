import {useEffect} from 'react';

import type {I18n} from '@lingui/core';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react/macro';

import type {ProjectOpenResult, ProjectStatus} from '@shared/ipc';

import logger from '@/data/service/Logger';
import {projectService} from '@/data/service/services';

import {useAppStore} from '../store';
import {capShownChannelValues} from './capShownChannelValues';

/** the main process opened another project and blacked out the output: the faders show 0, capped by the new locks */
export function applySwitchedProject(status: ProjectStatus): void {
  const state = useAppStore.getState();
  state.clearChannelValues();
  state.switchProject(status);
  capShownChannelValues();
}

/** whether the switch may go ahead: an open fixture or scene editor is only dropped once the user agreed */
const mayDropDraft = (i18n: I18n): boolean =>
  !useAppStore.getState().hasOpenDraft ||
  window.confirm(i18n._(msg`Discard the fixture or scene you are editing, and open the other project?`));

async function loadRecentProjects(): Promise<void> {
  try {
    useAppStore.getState().setRecentProjects(await projectService.listRecent());
  } catch (error) {
    logger.error('listing the recent projects failed', error);
  }
}

export function useActionLoadRecentProjects() {
  return loadRecentProjects;
}

/**
 * Asks about a draft, then lets the main process open or create the project. A file that can't be opened shows in
 * projectError, the project open before stays; a call that fails is logged as "`action` failed".
 */
async function openWith(open: () => Promise<ProjectOpenResult>, action: string, i18n: I18n): Promise<void> {
  if (!mayDropDraft(i18n)) {
    return;
  }
  const {setProjectError} = useAppStore.getState();
  setProjectError(undefined);
  try {
    const result = await open();
    if (result.type === 'opened') {
      // the main process pushes the switch too; applying it here doesn't wait for that
      applySwitchedProject({type: 'open', project: result.project});
    } else if (result.type === 'failed') {
      setProjectError({type: 'file', path: result.path, error: result.error});
    }
  } catch (error) {
    logger.error(`${action} failed`, error);
    setProjectError({type: 'call', message: msg`Could not ask the app to open the project`});
  }
  await loadRecentProjects();
}

/** Setup mode only: the main process asks for the new file */
export function useActionCreateProject() {
  const {i18n} = useLingui();
  return () => openWith(() => projectService.create(), 'creating a project', i18n);
}

export function useActionOpenProject() {
  const {i18n} = useLingui();
  return () => openWith(() => projectService.openWithDialog(), 'opening a project', i18n);
}

export function useActionOpenRecentProject() {
  const {i18n} = useLingui();
  return (path: string) => openWith(() => projectService.openRecent(path), `opening the project ${path}`, i18n);
}

export function useActionRemoveRecentProject() {
  return async (path: string) => {
    const {setProjectError} = useAppStore.getState();
    try {
      setProjectError(undefined);
      await projectService.removeRecent(path);
    } catch (error) {
      logger.error(`removing ${path} from the recent projects failed`, error);
      setProjectError({type: 'call', message: msg`Could not remove the project from the list`});
    }
    await loadRecentProjects();
  };
}

/**
 * Keeps the store's project in sync with the main process (external sync, so useEffect is right here): the status on
 * start, every switch, and a .glp double-clicked while the app runs, opened once a draft may be dropped
 */
export function useProjectSubscription(): void {
  const {i18n} = useLingui();

  useEffect(() => {
    const unsubscribeChanged = projectService.onChanged(applySwitchedProject);
    const unsubscribeOpenRequested = projectService.onOpenRequested(
      (path) => void openWith(() => projectService.openRecent(path), `opening the double-clicked ${path}`, i18n)
    );
    projectService
      .getStatus()
      .then((status) => {
        useAppStore.getState().setProject(status);
        capShownChannelValues();
      })
      .catch((error: unknown) => {
        logger.error('reading the project status failed', error);
        useAppStore
          .getState()
          .setProject({type: 'unreachable', message: msg`Could not ask the app which project is open`});
      });
    void loadRecentProjects();
    return () => {
      unsubscribeChanged();
      unsubscribeOpenRequested();
    };
  }, [i18n]);
}
