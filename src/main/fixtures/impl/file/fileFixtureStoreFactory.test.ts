import {mkdir, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import type {FixtureSetup} from '@shared/ipc';

import type {FixtureStore} from '@/fixtures/FixtureStore';

import {fileFixtureStoreFactory} from './fileFixtureStoreFactory';

const SET_ASIDE_MOMENT = new Date('2026-10-31T07:52:16.000Z');
const INVALID_FILE_NAME = 'fixtures.invalid-2026-10-31T07-52-16-000Z.json';

const setup: FixtureSetup = {
  version: 1,
  fixtures: [{id: 'smoke', name: 'Smoke machine', startAddress: 20, channels: [{name: 'Smoke', offset: 0}]}]
};

let dir: string;
let filePath: string;
let warnings: unknown[][];
let store: FixtureStore;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gluehwuermli-fixtures-'));
  filePath = join(dir, 'fixtures.json');
  warnings = [];
  store = fileFixtureStoreFactory({
    filePath,
    log: {warn: (...message) => warnings.push(message)},
    now: () => SET_ASIDE_MOMENT
  });
});

afterEach(async () => {
  await rm(dir, {recursive: true, force: true});
});

test('a missing file is an empty setup and a warning', async () => {
  expect(await store.load()).toEqual({version: 1, fixtures: []});
  expect(warnings).toHaveLength(1);
});

test('loads what it saved, leaving no temporary file behind', async () => {
  await store.save(setup);

  expect(await store.load()).toEqual(setup);
  expect(await readdir(dir)).toEqual(['fixtures.json']);
  expect(warnings).toEqual([]);
});

test('saving replaces the stored setup', async () => {
  await store.save(setup);
  await store.save({version: 1, fixtures: []});

  expect(await store.load()).toEqual({version: 1, fixtures: []});
});

test.each([
  ['no JSON', '{"version": 1, "fixtures": ['],
  ['another shape', '{"fixtures": "none"}'],
  ['a fixture outside the universe', JSON.stringify({...setup, fixtures: [{...setup.fixtures[0], startAddress: 600}]})]
])('a file with %s is an empty setup and a warning, and is kept aside', async (_description, content) => {
  await writeFile(filePath, content, 'utf-8');

  expect(await store.load()).toEqual({version: 1, fixtures: []});
  expect(warnings).toHaveLength(1);
  expect(await readdir(dir)).toEqual([INVALID_FILE_NAME]);
  expect(await readFile(join(dir, INVALID_FILE_NAME), 'utf-8')).toBe(content);
});

test('a file that cannot be read rejects instead of loading as an empty setup', async () => {
  await mkdir(filePath);

  await expect(store.load()).rejects.toThrow(`reading the fixture file ${filePath} failed`);
});

test('an invalid file that cannot be moved aside rejects and stays where it is', async () => {
  await writeFile(filePath, '{"fixtures": "none"}', 'utf-8');
  await mkdir(join(dir, INVALID_FILE_NAME, 'in-the-way'), {recursive: true});

  await expect(store.load()).rejects.toThrow('moving it aside failed');
  expect(await readFile(filePath, 'utf-8')).toBe('{"fixtures": "none"}');
});

test('overlapping saves run one after the other, the last one wins', async () => {
  const empty: FixtureSetup = {version: 1, fixtures: []};

  await Promise.all([store.save(setup), store.save(empty)]);

  expect(await store.load()).toEqual(empty);
  expect(await readdir(dir)).toEqual(['fixtures.json']);
});
