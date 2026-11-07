# Changelog

All notable changes to Glühwürmli are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

What counts as a breaking change: an existing project file (`.glp`) or `settings.json` that can no longer be read without a
migration, or a change to Show and Setup mode that an operator has to relearn. While the version is `0.x`, a breaking
change bumps the minor version and everything else the patch version.

## [Unreleased]

### Added

- Works with the Eurolite USB-DMX512 PRO as well as the Enttec DMX USB Pro: the port is opened with the settings the
  Eurolite interface expects (250000 baud, 2 stop bits), which the Enttec Pro ignores

### Changed

- The app always starts disconnected, so nothing is sent to the rig before you press **Connect**. The port connected
  to last is still remembered and chosen again on start
- **Connect** and **Disconnect** are in the top bar now, next to the output status and the chosen port (still in the
  Settings view as well); the port is still chosen in the Settings view

## [0.2.0] - 2026-11-05

### Added

- Projects: the fixtures and scenes of a rig live in a `.glp` file wherever you keep it (Documents, Desktop, a USB
  stick), one per venue or show. Every change is saved to the file right away. **Create project** (Setup mode) and
  **Open project** in the Show view when no project is open, and in the new **Project** section of the Settings view
  with the recent projects (a missing file is marked and can be removed from the list). The app opens the last project
  again on start; the window title and the Help view show which one is open. Opening another project sets all channels
  to 0 first, and asks before it drops a fixture or scene being edited. A file that is no valid project, or one from a
  newer version of the app, is not opened and left as it is
- The installer registers `.glp` files with their own icon: a double-click opens the project in the app, in the
  running one if it is open already
- Scenes: named buttons above the fixtures that set the channels of several fixtures at once; the fixtures a scene
  leaves out stay as they are, so scenes can be layered. In Setup mode, **Add scene** stores the current fader values
  of the chosen fixtures, and each scene can be renamed, given other fixtures, recaptured or deleted. A scene touching
  a locked channel stays playable, the channel only goes up to its cap. Scenes are stored with the fixtures; a file
  without them loads as before
- Icons for fixtures (a cone) and scenes (a stack), in front of their names and on their Add buttons
- The order of the fixtures, the scene buttons and a fixture's presets can be changed in Setup mode, with arrows next
  to each of them (the presets' in the fixture editor)
- **Black out on quit** in the Output section of the Settings view: closing the app sets all channels to 0 before it
  closes the port, so the rig goes dark instead of keeping its last look. Off by default, no password needed, kept in
  `settings.json`
- The app version, small in the bottom left corner of every view
- While the channel lock is lifted, the faders of capped channels (e.g. a laser) have a red border, in the fixtures and
  in the raw channels, and so do the presets and scenes that set one of them above its cap (e.g. "Laser on"), so it is
  plain what can now go above its cap

### Changed

- The Fixtures view is now called **Show**
- In Setup mode, the Show view has an orange frame
- The Edit/Preview toggle of a fixture's description shows only icons, its names as tooltips
- A fixture or scene being edited and not saved yet is kept while another view is open (Settings, Channels, Help),
  instead of being dropped
- Checkboxes match the dark desk: a dark box, filled with the yellow accent when checked, instead of the browser's
  white and blue

### Fixed

- Quitting waits until the DMX port is closed (at most 2 s), instead of leaving that to chance

### Removed

- `fixtures.json` in the data folder is no longer read or written: create a project, or paste the content of an old
  `fixtures.json` into a `.glp` file and open it

## [0.1.2] - 2026-11-02

### Added

- The app is in German, too: an EN/DE switch in the top bar changes every text without a restart, also in Show mode. The
  choice is kept in `settings.json`; until one is made, the app follows the language of the OS

## [0.1.1] - 2026-11-01

### Added

- The app remembers the port it was last connected to (in `settings.json`, also after Disconnect) and connects to it on
  start if the widget is plugged in; the port list preselects it
- Change the password in Setup mode (Settings view), with the current password and the new one typed twice
- Fixture descriptions are Markdown: formatted on the fixture, with a preview in the editor; links to web pages open in
  the default browser, any other link shows as text

### Changed

- A capped fader shows its lock icon in the fader knob instead of above its value
- Fixture editor: the presets are columns beside the channels, in line with their rows, and scroll sideways when they
  don't fit; both section titles show their count. The help is below the description, scrollbars are thin and dark

## [0.1.0] - 2026-10-31

First release.

### Added

- DMX output through an Enttec DMX USB Pro: pick the port, connect and disconnect in the Settings view. A port that
  fails or is unplugged shows up as a failed output status; the output keeps running while the window is hidden
- Fixtures: named devices with a start address, named channels, an optional description and hint, a fader per channel.
  Stored in `fixtures.json` in the data folder; an unreadable file is set aside instead of overwritten
- Presets: buttons that set several channels of a fixture at once
- Raw channels: a bank of 16 faders that moves across all 512 DMX channels
- A click on a fader's value or label steps it by one
- Show mode: the app starts with fixtures that can be played but not changed; a password unlocks Setup mode, which
  locks again after a while without activity
- Channel lock: fixture channels can declare a cap (e.g. `"lock": {"max": 0}` for a laser) that applies while the lock
  is on, in every view; capped faders still move up to their cap. Lifting the lock needs the password
- Help view with a short manual, the data folder and a link to the repository
- Example fixtures with their manuals in `doc/devices`: Eurolite LED SLS-144 RGBW, BeamZ LightBox5
- The main window keeps its position and size between sessions
- Windows installer (NSIS)

[Unreleased]: https://github.com/xeronimus/gluehwuermli/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/xeronimus/gluehwuermli/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/xeronimus/gluehwuermli/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/xeronimus/gluehwuermli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/xeronimus/gluehwuermli/releases/tag/v0.1.0
