import {mkdir, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {emptyFixtureSetup} from '@shared/fixtures';
import type {FixtureSetup} from '@shared/ipc';

import type {ProjectFileStore} from '@/project/ProjectFileStore';

import {fileProjectFileStoreFactory} from './fileProjectFileStoreFactory';

const setup: FixtureSetup = {
  version: 1,
  fixtures: [{id: 'smoke', name: 'Smoke machine', startAddress: 20, channels: [{name: 'Smoke', offset: 0}]}]
};

let dir: string;
let filePath: string;
let store: ProjectFileStore;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gluehwuermli-project-'));
  filePath = join(dir, 'Waldfest.glp');
  store = fileProjectFileStoreFactory();
});

afterEach(async () => {
  await rm(dir, {recursive: true, force: true});
});

test('reads what it wrote, leaving no temporary file behind', async () => {
  await store.write(filePath, setup);

  expect(await store.read(filePath)).toEqual({type: 'read', setup});
  expect(await readdir(dir)).toEqual(['Waldfest.glp']);
});

test('a missing file is a failed read', async () => {
  expect(await store.read(filePath)).toEqual({type: 'failed', error: {reason: 'missing'}});
});

test('a file that cannot be read is a failed read with the reason of the OS', async () => {
  await mkdir(filePath);

  expect(await store.read(filePath)).toEqual({
    type: 'failed',
    error: {reason: 'unreadable', message: expect.stringContaining('EISDIR')}
  });
});

test.each([
  ['no JSON', '{"version": 1, "fixtures": [', {reason: 'invalid'}],
  ['another shape', '{"fixtures": "none"}', {reason: 'invalid'}],
  ['a newer version', '{"version": 2, "fixtures": []}', {reason: 'too-new', version: 2}]
])('a file with %s is a failed read, and stays exactly as it is', async (_description, content, error) => {
  await writeFile(filePath, content, 'utf-8');

  expect(await store.read(filePath)).toEqual({type: 'failed', error});
  expect(await readdir(dir)).toEqual(['Waldfest.glp']);
  expect(await readFile(filePath, 'utf-8')).toBe(content);
});

test('a file that cannot be written rejects', async () => {
  await expect(store.write(join(dir, 'gone', 'Waldfest.glp'), setup)).rejects.toThrow();
});

test('overlapping writes to one file run one after the other, the last one wins', async () => {
  await Promise.all([store.write(filePath, setup), store.write(filePath, emptyFixtureSetup())]);

  expect(await store.read(filePath)).toEqual({type: 'read', setup: emptyFixtureSetup()});
  expect(await readdir(dir)).toEqual(['Waldfest.glp']);
});
