import type {RecentProject} from '@shared/ipc';

/** the recent projects to offer: the one open already isn't (paths compared ignoring case, as Windows does) */
export const recentProjectsBesides = (
  recentProjects: readonly RecentProject[],
  openPath: string | undefined
): readonly RecentProject[] =>
  openPath === undefined
    ? recentProjects
    : recentProjects.filter(({path}) => path.toLowerCase() !== openPath.toLowerCase());
