import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import Value from 'typebox/value';

import {fixtureErrors} from './shared/fixtures';
import {FixtureSchema} from './shared/ipc';

/**
 * The fixture.json files under doc/devices, written to be pasted into the fixtures file: each must be a fixture the
 * app loads and saves.
 */
const DEVICES_DIR = path.resolve(__dirname, '..', 'doc', 'devices');

function listFixtureFiles(dir: string): string[] {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFixtureFiles(entryPath);
    }
    return entry.name === 'fixture.json' ? [entryPath] : [];
  });
}

const fixtureFiles = listFixtureFiles(DEVICES_DIR).map((file) => path.relative(DEVICES_DIR, file));

test('doc/devices holds fixture files', () => {
  expect(fixtureFiles).not.toEqual([]);
});

test.each(fixtureFiles)('%s is a valid fixture', (file) => {
  const fixture: unknown = JSON.parse(readFileSync(path.join(DEVICES_DIR, file), 'utf8'));

  expect([...Value.Errors(FixtureSchema, fixture)].map((error) => `${error.instancePath} ${error.message}`)).toEqual(
    []
  );
  // the schema only covers the shape; names, duplicate offsets and the universe's end are checked here
  expect(Value.Check(FixtureSchema, fixture) ? fixtureErrors(fixture) : ['not a fixture']).toEqual([]);
});
