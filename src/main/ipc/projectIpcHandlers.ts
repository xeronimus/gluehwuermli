import {parseFixtureSetup} from '@shared/fixtures';
import {type ProjectOpenResult, parseProjectPathRequest, parseSaveFixturesRequest} from '@shared/ipc';

import type {ProjectSession} from '@/project/projectSession';

export interface ProjectIpcHandlers {
  openRecent: (payload: unknown) => Promise<ProjectOpenResult>;
  removeRecent: (payload: unknown) => Promise<void>;
  /** rejects for an invalid setup, and whatever the session refuses */
  saveFixtures: (payload: unknown) => Promise<void>;
}

/** What the project IPC channels with a payload do, without Electron: check it against its schema, then the session */
export function projectIpcHandlers(session: ProjectSession): ProjectIpcHandlers {
  const pathOf = (payload: unknown, channel: string) => {
    const request = parseProjectPathRequest(payload);
    if (!request) {
      throw new Error(`invalid ${channel} request`);
    }
    return request.path;
  };

  return {
    openRecent: async (payload) => session.openRecent(pathOf(payload, 'open-recent')),
    removeRecent: async (payload) => session.removeRecent(pathOf(payload, 'remove-recent')),
    saveFixtures: async (payload) => {
      const request = parseSaveFixturesRequest(payload);
      const setup = parseFixtureSetup(request?.setup);
      if (!request || !setup) {
        throw new Error('invalid fixture setup');
      }
      await session.saveFixtures(request.projectPath, setup);
    }
  };
}
