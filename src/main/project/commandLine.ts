import {resolve} from 'node:path';

import {isProjectFilePath} from '@shared/projects';

/**
 * The .glp the app was started with, as an absolute path: Windows passes the double-clicked file as an argument.
 * Electron's own arguments (`.`, the app path in `pnpm dev`, switches) are no .glp and are skipped.
 */
export function projectPathFromArgv(argv: readonly string[], workingDirectory: string): string | undefined {
  const projectArgument = argv.slice(1).find((argument) => !argument.startsWith('-') && isProjectFilePath(argument));
  return projectArgument === undefined ? undefined : resolve(workingDirectory, projectArgument);
}
