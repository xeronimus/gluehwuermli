import {fixtureSetupOf} from '@shared/fixtures';
import type {Chase, ProjectStatus} from '@shared/ipc';

import {type ChasePlayer, chasePlayerFactory} from '@/chase/chasePlayer';
import {type DmxEngine, dmxEngineFactory} from '@/dmx/dmxEngine';
import {inMemoryConnectorFactory} from '@/dmx/impl/inMemory/inMemoryConnectorFactory';

import {type ChaseIpcHandlers, chaseIpcHandlers} from './chaseIpcHandlers';

const silentLog = {debug: () => {}, info: () => {}, warn: () => {}};

const strobe: Chase = {
  id: 'strobe',
  name: 'Strobe',
  repeat: {type: 'forever'},
  steps: [{id: 'on', holdMs: 500, values: [{channel: 30, value: 255}]}]
};

const projectWith = (chases: Chase[]): ProjectStatus => ({
  type: 'open',
  project: {path: 'D:\Waldfest.glp', setup: {...fixtureSetupOf([]), chases}}
});

let projectStatus: ProjectStatus;
let engine: DmxEngine;
let player: ChasePlayer;
let handlers: ChaseIpcHandlers;

beforeEach(() => {
  vi.useFakeTimers();
  projectStatus = projectWith([strobe]);
  engine = dmxEngineFactory({connector: inMemoryConnectorFactory(), refreshIntervalMs: 23, log: silentLog});
  player = chasePlayerFactory({engine, now: () => Date.now(), log: silentLog});
  handlers = chaseIpcHandlers(player, {status: () => projectStatus});
});

afterEach(async () => {
  await engine.dispose();
  vi.useRealTimers();
});

test('is idle before anything is started', () => {
  expect(handlers.status()).toEqual({type: 'idle'});
});

test('starts the chase saved in the open project with that id', async () => {
  expect(await handlers.start({chaseId: 'strobe'})).toEqual({
    type: 'running',
    chaseId: 'strobe',
    stepIndex: 0,
    passIndex: 0
  });
  expect(engine.channelValue(30)).toBe(255);
});

test('plays the saved chase, not what the request carries along', async () => {
  await handlers.start({chaseId: 'strobe', steps: [{id: 'x', holdMs: 500, values: [{channel: 30, value: 1}]}]});

  expect(engine.channelValue(30)).toBe(255);
});

test('refuses an unknown id, an invalid request and a start without a project', async () => {
  await expect(handlers.start({chaseId: 'smoke'})).rejects.toThrow('no chase smoke');
  await expect(handlers.start({chaseId: ''})).rejects.toThrow('invalid start-chase request');
  await expect(handlers.start('strobe')).rejects.toThrow('invalid start-chase request');

  projectStatus = {type: 'none'};
  await expect(handlers.start({chaseId: 'strobe'})).rejects.toThrow('no chase strobe');
  expect(handlers.status()).toEqual({type: 'idle'});
});

test('pause, resume and stop answer the status they leave', async () => {
  await handlers.start({chaseId: 'strobe'});

  expect(handlers.pause()).toMatchObject({type: 'paused', chaseId: 'strobe'});
  expect(handlers.resume()).toMatchObject({type: 'running', chaseId: 'strobe'});
  expect(handlers.stop()).toEqual({type: 'idle'});
  expect(handlers.pause()).toEqual({type: 'idle'});
});
