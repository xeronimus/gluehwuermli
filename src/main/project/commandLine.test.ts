import {resolve} from 'node:path';

import {projectPathFromArgv} from './commandLine';

const WORKING_DIRECTORY = resolve('/shows');

test('the double-clicked file of an installed app', () => {
  const projectPath = resolve('/shows/Waldfest.glp');

  expect(projectPathFromArgv(['Glühwürmli.exe', projectPath], WORKING_DIRECTORY)).toBe(projectPath);
});

test('a relative path is resolved against the working directory of the process that got it', () => {
  expect(projectPathFromArgv(['Glühwürmli.exe', 'Fasnacht.GLP'], WORKING_DIRECTORY)).toBe(
    resolve(WORKING_DIRECTORY, 'Fasnacht.GLP')
  );
});

test("Electron's own arguments are no project", () => {
  expect(projectPathFromArgv(['electron.exe', '.', '--inspect=5858'], WORKING_DIRECTORY)).toBeUndefined();
  expect(projectPathFromArgv(['electron.exe', '--allow-file=x.glp'], WORKING_DIRECTORY)).toBeUndefined();
  expect(projectPathFromArgv(['x.glp'], WORKING_DIRECTORY)).toBeUndefined();
});
