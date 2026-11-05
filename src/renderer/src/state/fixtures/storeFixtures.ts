import type {MessageDescriptor} from '@lingui/core';

import type {FixtureSetup} from '@shared/ipc';
import type {SerialQueue} from '@shared/serialQueue';

import type ProjectService from '@/data/service/ProjectService';

import type {FixturesActions} from './FixturesActions';
import type {FixturesState} from './FixturesState';
import {selectOpenProject} from './fixturesSelectors';

export interface StoreFixturesDependencies {
  getState: () => FixturesState & FixturesActions;
  projectService: Pick<ProjectService, 'saveFixtures'>;
  /** one queue for every save: each change starts from the setup the previous one stored, so none gets lost */
  runSerially: SerialQueue;
  log: {error: (...message: unknown[]) => void};
}

/**
 * changes the fixture setup; resolves to whether the change was stored. A failure shows `failure` and is logged as
 * "`action` failed" (in English: a production build keeps only the hashed id of `failure`)
 */
export type StoreFixtures = (
  change: (setup: FixtureSetup) => FixtureSetup,
  action: string,
  failure: MessageDescriptor
) => Promise<boolean>;

/**
 * Stores the changed setup in the open project's file first and only then shows it: unlike a fader move, a lost change
 * to the setup would go unnoticed. A failed save sets `fixturesError` and leaves the shown setup as it was; without an
 * open project there is nothing to change.
 */
export const storeFixturesWith =
  ({getState, projectService, runSerially, log}: StoreFixturesDependencies): StoreFixtures =>
  (change, action, failure) =>
    runSerially(async () => {
      const project = selectOpenProject(getState());
      if (!project) {
        log.error(`${action} failed: no project is open`);
        getState().setFixturesError(failure);
        return false;
      }
      const setup = change(project.setup);
      try {
        await projectService.saveFixtures(project.path, setup);
        getState().setProject({type: 'open', project: {path: project.path, setup}});
        getState().setFixturesError(undefined);
        return true;
      } catch (error) {
        log.error(`${action} failed`, error);
        getState().setFixturesError(failure);
        return false;
      }
    });
