# 4. Projects as files outside userData

Date: 2026-11-05

## Status

Accepted

## Context

The fixtures and scenes lived in one `fixtures.json` in Electron's `userData` folder, its path fixed on start. Several
independent setups, one per venue or show, meant renaming and copying JSON files by hand in a hidden folder. An invalid
`fixtures.json` was renamed and set aside, so the next save couldn't overwrite it: fine for a file only the app writes,
not for a file the user keeps and copies around.

## Decision

- A **project** is one `.glp` file holding the fixture setup (fixtures and scenes) of one rig, wherever the user keeps
  it: Documents, the Desktop, a USB stick. The file name is the project's name; the file has no name field. Its
  `version` is `PROJECT_VERSION`.
- **Autosave, no save step**: every add, edit, move or delete of a fixture or scene writes the whole project to its
  file, atomically (a temporary file next to it, then renamed), before the renderer shows it. A project is only
  "unsaved" while an editor has a draft open.
- **What stays app-wide** in `settings.json` (`userData`): the password, the output port, the language, the blackout on
  quit, and now the last project and the recent projects (at most 8). They belong to the laptop and the operator, not
  to the rig.
- A **`ProjectSession`** (`src/main/project/projectSession.ts`) in main owns the open project. Opening, creating and
  saving run one after the other. A save names the project it belongs to, and main refuses it for any other, so a
  save from an editor of the previous project can't land in the new file.
- **Switching projects** blacks out the universe and applies the new project's channel caps in one synchronous step:
  no packet goes out between the two, and the new fixtures may sit on other addresses than the old ones.
- **A user's file is never changed by reading it**: a file that is missing, unreadable, no valid project or from a
  newer app version is not opened, the error is shown with its path, and the file stays exactly as it was. Nothing is
  renamed or set aside.
- **Creating** a project needs Setup mode, like any change to the setup; **opening** one doesn't (Show mode plays
  projects, it doesn't change them). The renderer can open a file by its path only if it is in the recent list or was
  named outside the app (command line, double-click); anything else goes through the OS file dialog in main.
- **One process**: the app takes the single-instance lock before it creates any service. A `.glp` double-clicked while
  it runs starts a second process that hands the path over (`second-instance`) and quits, so two processes never fight
  over the COM port. The running app asks about an open draft, then opens the file. The NSIS installer registers
  `.glp` with its own icon.

## Consequences

- One setup per file: copying, backing up or taking a rig to another laptop is a file copy.
- No migration: `fixtures.json` is no longer read (the app hadn't shipped to other users yet).
- The app's last write wins: changes made to the file outside the app while it is open are overwritten by the next
  save (no file watching).
- macOS and Linux would need `open-file` and other installers; out of scope while the app ships for Windows only.
