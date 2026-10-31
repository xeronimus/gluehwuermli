import {mkdir, mkdtemp, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import type {WindowStateStore} from '@/window/WindowStateStore';
import type {WindowState} from '@/window/windowState';

import {fileWindowStateStoreFactory} from './fileWindowStateStoreFactory';

const state: WindowState = {x: 100, y: 50, width: 1400, height: 900, maximized: true, fullScreen: false};

let dir: string;
let filePath: string;
let warnings: unknown[][];
let store: WindowStateStore;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gluehwuermli-window-state-'));
  filePath = join(dir, 'window-state.json');
  warnings = [];
  store = fileWindowStateStoreFactory({filePath, log: {warn: (...message) => warnings.push(message)}});
});

afterEach(async () => {
  await rm(dir, {recursive: true, force: true});
});

test('a missing file is no state and a warning', async () => {
  expect(await store.load()).toBeUndefined();
  expect(warnings).toHaveLength(1);
});

test('loads what it saved, leaving no temporary file behind', async () => {
  await store.save(state);

  expect(await store.load()).toEqual(state);
  expect(await readdir(dir)).toEqual(['window-state.json']);
  expect(warnings).toEqual([]);
});

test.each([
  ['no JSON', '{"x": 1'],
  ['another shape', '{"width": "wide"}']
])('a file with %s is no state and a warning, and the next save replaces it', async (_description, content) => {
  await writeFile(filePath, content, 'utf-8');

  expect(await store.load()).toBeUndefined();
  expect(warnings).toHaveLength(1);

  await store.save(state);
  expect(await store.load()).toEqual(state);
});

test('a file that cannot be read is no state and a warning instead of a rejection', async () => {
  await mkdir(filePath);

  expect(await store.load()).toBeUndefined();
  expect(warnings).toHaveLength(1);
});

test('overlapping saves run one after the other, the last one wins', async () => {
  const normal = {...state, maximized: false};

  await Promise.all([store.save(state), store.save(normal)]);

  expect(await store.load()).toEqual(normal);
  expect(await readdir(dir)).toEqual(['window-state.json']);
});
