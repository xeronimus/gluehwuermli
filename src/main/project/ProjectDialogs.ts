/** The OS file dialogs for project files. Implemented with Electron's dialog in impl/electron, faked in tests. */
export interface ProjectDialogs {
  /** the path for a new project; undefined when cancelled. The OS asks before an existing file is replaced */
  chooseNewProjectPath: () => Promise<string | undefined>;
  /** a .glp to open; undefined when cancelled */
  chooseProjectToOpen: () => Promise<string | undefined>;
}
