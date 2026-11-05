import {BrowserWindow, dialog} from 'electron';

import {PROJECT_FILE_EXTENSION} from '@shared/projects';

import type {ProjectDialogs} from '@/project/ProjectDialogs';

/** the product name, not a text in a language: the OS dialog says the rest in the OS language */
const PROJECT_FILE_FILTERS = [{name: 'Glühwürmli', extensions: [PROJECT_FILE_EXTENSION]}];

/** Electron's dialogs, modal to the app window; they start in `defaultFolder` (Documents) */
export function electronProjectDialogsFactory(defaultFolder: string): ProjectDialogs {
  const parentWindow = () => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];

  return {
    chooseNewProjectPath: async () => {
      const window = parentWindow();
      const options = {defaultPath: defaultFolder, filters: PROJECT_FILE_FILTERS};
      const result = window ? await dialog.showSaveDialog(window, options) : await dialog.showSaveDialog(options);
      return result.canceled ? undefined : result.filePath;
    },
    chooseProjectToOpen: async () => {
      const window = parentWindow();
      const options = {
        defaultPath: defaultFolder,
        filters: PROJECT_FILE_FILTERS,
        properties: ['openFile' as const]
      };
      const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);
      return result.canceled ? undefined : result.filePaths[0];
    }
  };
}
