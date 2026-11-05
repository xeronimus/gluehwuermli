import type {ProjectStatus} from '@shared/ipc';
import {projectNameOf} from '@shared/projects';

export const APP_NAME = 'Glühwürmli';

/** "Waldfest — Glühwürmli" while a project is open, so the taskbar tells which one */
export const windowTitleOf = (status: ProjectStatus): string =>
  status.type === 'open' ? `${projectNameOf(status.project.path)} — ${APP_NAME}` : APP_NAME;
