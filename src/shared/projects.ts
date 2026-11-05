import {parseFixtureSetup} from './fixtures';
import {type FixtureSetup, PROJECT_VERSION, type ProjectError} from './ipc';

/** Project files: what a .glp holds and how a project is named. Used by main (opening) and the renderer (showing). */

export const PROJECT_FILE_EXTENSION = 'glp';

const PROJECT_FILE_SUFFIX = `.${PROJECT_FILE_EXTENSION}`;

export type ProjectFileContent = {type: 'valid'; setup: FixtureSetup} | {type: 'invalid'; error: ProjectError};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** the version a file claims, if it claims a number at all */
const versionOf = (content: unknown): number | undefined =>
  isObject(content) && typeof content['version'] === 'number' ? content['version'] : undefined;

/**
 * The setup in a project file's parsed JSON (`undefined` for no JSON at all). A newer version is checked before the
 * shape: a file from a newer app is "too new", not "invalid", even if its shape changed.
 */
export function parseProjectFile(content: unknown): ProjectFileContent {
  const version = versionOf(content);
  if (version !== undefined && version > PROJECT_VERSION) {
    return {type: 'invalid', error: {reason: 'too-new', version}};
  }
  const setup = parseFixtureSetup(content);
  return setup ? {type: 'valid', setup} : {type: 'invalid', error: {reason: 'invalid'}};
}

export const isProjectFilePath = (path: string): boolean => path.toLowerCase().endsWith(PROJECT_FILE_SUFFIX);

/** the path as chosen in a save dialog, with .glp added if it isn't there */
export const withProjectFileExtension = (path: string): string =>
  isProjectFilePath(path) ? path : `${path}${PROJECT_FILE_SUFFIX}`;

/** the file name without folder and .glp: the project's name, e.g. "Waldfest" for D:\Shows\Waldfest.glp */
export function projectNameOf(path: string): string {
  const fileName = path.split(/[\\/]/).at(-1) ?? path;
  return isProjectFilePath(fileName) ? fileName.slice(0, -PROJECT_FILE_SUFFIX.length) : fileName;
}
