import {emptyFixtureSetup} from '@shared/fixtures';
import type {FixtureSetup} from '@shared/ipc';

import type {ProjectSession} from '@/project/projectSession';

import {projectIpcHandlers} from './projectIpcHandlers';

const saved: {projectPath: string; setup: FixtureSetup}[] = [];
const opened: string[] = [];

const session: Pick<ProjectSession, 'openRecent' | 'removeRecent' | 'saveFixtures'> = {
  openRecent: async (path) => {
    opened.push(path);
    return {type: 'cancelled'};
  },
  removeRecent: async () => {},
  saveFixtures: async (projectPath, setup) => {
    saved.push({projectPath, setup});
  }
};

const handlers = projectIpcHandlers({
  ...session,
  start: async () => {},
  status: () => ({type: 'none'}),
  create: async () => ({type: 'cancelled'}),
  openWithDialog: async () => ({type: 'cancelled'}),
  requestOpen: () => {},
  listRecent: async () => [],
  onChanged: () => () => {},
  onOpenRequested: () => () => {}
});

beforeEach(() => {
  saved.length = 0;
  opened.length = 0;
});

test('a valid save reaches the session with its project', async () => {
  await handlers.saveFixtures({projectPath: 'D:\\Waldfest.glp', setup: emptyFixtureSetup()});

  expect(saved).toEqual([{projectPath: 'D:\\Waldfest.glp', setup: emptyFixtureSetup()}]);
});

test.each([
  ['no project', {setup: emptyFixtureSetup()}],
  ['an invalid setup', {projectPath: 'D:\\Waldfest.glp', setup: {version: 1, fixtures: 'none'}}],
  ['nothing', undefined]
])('a save with %s is refused', async (_description, payload) => {
  await expect(handlers.saveFixtures(payload)).rejects.toThrow('invalid fixture setup');
  expect(saved).toEqual([]);
});

test('opening a recent project needs a path', async () => {
  await expect(handlers.openRecent({path: ''})).rejects.toThrow('invalid open-recent request');
  await handlers.openRecent({path: 'D:\\Waldfest.glp'});

  expect(opened).toEqual(['D:\\Waldfest.glp']);
});
