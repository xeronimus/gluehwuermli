import {mkdtemp, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {atomicJsonWriter, readJsonFile} from './jsonFile';

let dir: string;
let filePath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gluehwuermli-json-file-'));
  filePath = join(dir, 'data.json');
});

afterEach(async () => {
  await rm(dir, {recursive: true, force: true});
});

test('a missing file is reported as missing', async () => {
  expect(await readJsonFile(filePath)).toEqual({type: 'missing'});
});

test('content that is no JSON reads as undefined', async () => {
  await writeFile(filePath, 'not json', 'utf-8');

  expect(await readJsonFile(filePath)).toEqual({type: 'read', content: undefined});
});

test('a file that cannot be read rejects', async () => {
  await expect(readJsonFile(dir)).rejects.toThrow();
});

test('overlapping writes all land in order, without leaving the temporary file', async () => {
  const write = atomicJsonWriter(filePath);

  await Promise.all([write({value: 1}), write({value: 2}), write({value: 3})]);

  expect(await readJsonFile(filePath)).toEqual({type: 'read', content: {value: 3}});
  expect(await readdir(dir)).toEqual(['data.json']);
});
