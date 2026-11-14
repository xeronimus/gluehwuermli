import {fixtureSetupOf} from '@shared/fixtures';
import type {Chase, ProjectStatus} from '@shared/ipc';

import {type ChasePlayer, chasePlayerFactory} from '@/chase/chasePlayer';
import {type DmxEngine, dmxEngineFactory} from '@/dmx/dmxEngine';
import {inMemoryConnectorFactory} from '@/dmx/impl/inMemory/inMemoryConnectorFactory';
import {type TempoClock, tempoClockFactory} from '@/tempo/tempoClock';

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
  project: {path: 'D:\\Waldfest.glp', setup: {...fixtureSetupOf([]), chases}}
});

let projectStatus: ProjectStatus;
let engine: DmxEngine;
let tempo: TempoClock;
let player: ChasePlayer;
let handlers: ChaseIpcHandlers;

beforeEach(() => {
  vi.useFakeTimers();
  projectStatus = projectWith([strobe]);
  engine = dmxEngineFactory({
    connector: inMemoryConnectorFactory(),
    refreshIntervalMs: 23,
    log: silentLog,
    logUniverse: false
  });
  tempo = tempoClockFactory({now: () => Date.now(), log: silentLog});
  player = chasePlayerFactory({engine, tempo, now: () => Date.now(), log: silentLog});
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
    passIndex: 0,
    synced: false,
    speed: 1
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

test('set-sync and set-speed answer the sync status, without asking the project or the mode', async () => {
  tempo.tap();
  vi.advanceTimersByTime(500);
  tempo.tap();
  vi.advanceTimersByTime(500);
  tempo.tap();
  vi.advanceTimersByTime(500);
  tempo.tap();
  projectStatus = {type: 'none'};

  expect(await handlers.setSync({chaseId: 'smoke', synced: true})).toEqual({
    chases: [{chaseId: 'smoke', synced: true, speed: 1}]
  });
  expect(await handlers.setSpeed({chaseId: 'smoke', speed: 2})).toEqual({
    chases: [{chaseId: 'smoke', synced: true, speed: 2}]
  });
  expect(handlers.syncStatus()).toEqual({chases: [{chaseId: 'smoke', synced: true, speed: 2}]});
});

test('refuses an invalid set-sync or set-speed request', async () => {
  await expect(handlers.setSync({chaseId: '', synced: true})).rejects.toThrow('invalid set-chase-sync request');
  await expect(handlers.setSync({chaseId: 'strobe'})).rejects.toThrow('invalid set-chase-sync request');
  await expect(handlers.setSpeed({chaseId: 'strobe', speed: 3})).rejects.toThrow('invalid set-chase-speed request');
  expect(handlers.syncStatus()).toEqual({chases: []});
});

test('pause, resume and stop answer the status they leave', async () => {
  await handlers.start({chaseId: 'strobe'});

  expect(handlers.pause()).toMatchObject({type: 'paused', chaseId: 'strobe'});
  expect(handlers.resume()).toMatchObject({type: 'running', chaseId: 'strobe'});
  expect(handlers.stop()).toEqual({type: 'idle'});
  expect(handlers.pause()).toEqual({type: 'idle'});
});
