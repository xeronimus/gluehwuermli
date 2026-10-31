import {mkdir, mkdtemp, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import type {SettingsStore} from '@/lock/SettingsStore';
import type {Settings} from '@/lock/settings';

import {fileSettingsStoreFactory} from './fileSettingsStoreFactory';

const settings: Settings = {version: 1, password: {salt: '00ff', hash: 'abcdef'}};

let dir: string;
let filePath: string;
let warnings: unknown[][];
let store: SettingsStore;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gluehwuermli-settings-'));
  filePath = join(dir, 'settings.json');
  warnings = [];
  store = fileSettingsStoreFactory({filePath, log: {warn: (...message) => warnings.push(message)}});
});

afterEach(async () => {
  await rm(dir, {recursive: true, force: true});
});

test('a missing file is no settings and a warning', async () => {
  expect(await store.load()).toBeUndefined();
  expect(warnings).toHaveLength(1);
});

test('loads what it saved, leaving no temporary file behind', async () => {
  await store.save(settings);

  expect(await store.load()).toEqual(settings);
  expect(await readdir(dir)).toEqual(['settings.json']);
  expect(warnings).toEqual([]);
});

test.each([
  ['no JSON', '{"version": 1'],
  ['another version', '{"version": 2}'],
  ['a password in plain text', '{"version": 1, "password": "laser-off"}'],
  ['a hash that is not hex', '{"version": 1, "password": {"salt": "00", "hash": "xyz"}}']
])('a file with %s is no settings and a warning', async (_description, content) => {
  await writeFile(filePath, content, 'utf-8');

  expect(await store.load()).toBeUndefined();
  expect(warnings).toHaveLength(1);
});

test('a file that cannot be read is no settings and a warning instead of a rejection', async () => {
  await mkdir(filePath);

  expect(await store.load()).toBeUndefined();
  expect(warnings).toHaveLength(1);
});
