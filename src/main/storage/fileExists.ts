import {access} from 'node:fs/promises';

/** whether something is at the path; any error (missing, a drive not there, no access) counts as not */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
