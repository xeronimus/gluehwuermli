import {openDataFolder} from './openDataFolder';

const FOLDER = 'C:\\Users\\someone\\AppData\\Roaming\\gluehwuermli';

let warnings: unknown[][];
const log = {warn: (...message: unknown[]) => warnings.push(message)};

beforeEach(() => {
  warnings = [];
});

test('opens the folder', async () => {
  const opened: string[] = [];
  const openPath = async (path: string) => {
    opened.push(path);
    return '';
  };

  expect(await openDataFolder(openPath, FOLDER, log)).toEqual({type: 'opened'});
  expect(opened).toEqual([FOLDER]);
  expect(warnings).toEqual([]);
});

test('the error message of the shell is a failed result', async () => {
  const openPath = async () => 'Failed to open path';

  expect(await openDataFolder(openPath, FOLDER, log)).toEqual({type: 'failed', message: 'Failed to open path'});
  expect(warnings).toHaveLength(1);
});

test('a rejection is a failed result, too', async () => {
  const openPath = () => Promise.reject(new Error('no shell'));

  expect(await openDataFolder(openPath, FOLDER, log)).toEqual({type: 'failed', message: 'no shell'});
  expect(warnings).toHaveLength(1);
});
