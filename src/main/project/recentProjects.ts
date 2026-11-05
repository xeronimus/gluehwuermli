import {RECENT_PROJECTS_MAX} from '@/settings/settings';

/** Windows paths: D:\Shows\Waldfest.glp and d:\shows\WALDFEST.GLP are the same file */
export const isSamePath = (first: string, second: string): boolean => first.toLowerCase() === second.toLowerCase();

/** the path first, once, and at most RECENT_PROJECTS_MAX paths: the oldest drops out */
export const withRecentProject = (paths: readonly string[], path: string): string[] =>
  [path, ...paths.filter((recent) => !isSamePath(recent, path))].slice(0, RECENT_PROJECTS_MAX);

export const withoutRecentProject = (paths: readonly string[], path: string): string[] =>
  paths.filter((recent) => !isSamePath(recent, path));
