import type {MessageDescriptor} from '@lingui/core';

import type {RecentProject} from '@shared/ipc';

import {FixturesState, ProjectFailure, ProjectState} from './FixturesState';

export type FixturesStateSetter = (
  partial: FixturesState | Partial<FixturesState> | ((state: FixturesState) => FixturesState | Partial<FixturesState>),
  replace?: false,
  action?: string
) => void;

export interface FixturesActions {
  setProject: (project: ProjectState) => void;
  /** another project was opened: shown in place of the one before, which drops any editor */
  switchProject: (project: ProjectState) => void;
  setFixturesError: (fixturesError: MessageDescriptor | undefined) => void;
  setProjectError: (projectError: ProjectFailure | undefined) => void;
  setRecentProjects: (recentProjects: readonly RecentProject[]) => void;
  setHasOpenDraft: (hasOpenDraft: boolean) => void;
}

export const getFixturesActions = (set: FixturesStateSetter): FixturesActions => ({
  setProject: (project) => set({project}, undefined, 'fixtures/setProject'),
  switchProject: (project) =>
    set(
      (state) => ({project, projectSwitches: state.projectSwitches + 1, fixturesError: undefined, hasOpenDraft: false}),
      undefined,
      'fixtures/switchProject'
    ),
  setFixturesError: (fixturesError) => set({fixturesError}, undefined, 'fixtures/setFixturesError'),
  setProjectError: (projectError) => set({projectError}, undefined, 'fixtures/setProjectError'),
  setRecentProjects: (recentProjects) => set({recentProjects}, undefined, 'fixtures/setRecentProjects'),
  setHasOpenDraft: (hasOpenDraft) => set({hasOpenDraft}, undefined, 'fixtures/setHasOpenDraft')
});
