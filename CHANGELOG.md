# Changelog

All notable changes to Glühwürmli are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

What counts as a breaking change: an existing project file (`.glp`) or `settings.json` that can no longer be read without a
migration, or a change to Show and Setup mode that an operator has to relearn. While the version is `0.x`, a breaking
change bumps the minor version and everything else the patch version.

## [Unreleased]

### Added

- A position of a channel shown as buttons can be momentary: its button, a raised key that sinks while held, sets the
  value only while held and puts back the value from before on release (#95)
- Chase editor: "Preview on rig" sends the shown step to the output while it is edited (#91)
- Chase editor: arrows left of the step tabs step to the previous or the next step, round from the last to the
  first and back (#91)

### Changed

- Chase editor: Save and Cancel no longer stay at the bottom of the window, they scroll with the editor like the rest
- Disabled buttons are fainter, so they stand out more from the ones that can be pressed

### Fixed

- A fixture no longer grows a little wider when a channel shown as buttons changes its value or its active button

## [0.3.1] - 2026-11-09

### Added

- An "All steps" panel at the top of the chase editor changes every step at once: it adds a channel (at 0, in the steps
  that don't set it yet), removes a channel the steps set, or sets the hold of all steps. Hovering an action says what
  it would do and marks the shown step's rows it changes; nothing is stored until Save (#85)

### Changed

- The top bar shows the name of the open project next to the app title, and the view toggle sits in the middle of the
  bar
- The chase step editor shows a step's channels as a table grouped by fixture (the fixture's name once, with a button
  removing all its channels; addresses of no fixture under Unassigned), with aligned columns, a bar in the channel's
  color beside each value and the name of a named position the value is on; a problem is marked on its row. A "Fill
  from" panel beside the table (above it on a narrow window) takes the current values of one fixture or of all, a scene
  or a preset in one click; hovering a button marks the rows it would change, and the rows a click changed flash. Save
  and Cancel stay in view while the chase editor is open (#90)
- A chase's Start button is in the accent color, the important action of its row
- Tabs (fixture editor, chase steps) have a light handle each, a little apart, the active one lighter over its accent
  bar
- The presets in the fixture editor have more room between them, and the channel under the mouse is outlined like a
  row in the channels tab
- Radio buttons (the repeat of a chase) look like the app's checkboxes: a dark circle, a ring and a dot in the accent
  when chosen

### Fixed

- After the window was reloaded, the faders showed 0 until a chase step set each channel again, while the output kept
  sending the real values; the app now reads every channel's value from the output when it starts (#81)
- The color fields of channels, presets and scenes were too narrow for `#` and six hex digits

## [0.3.0] - 2026-11-08

### Added

- **Chases**: a project's chases are listed below the fixtures, one row each with its steps (the current one filled, its
  hold on hover) and its repeat (`1×`, `8×` or `∞`); Start, Pause, Resume and Stop play them in Show and Setup mode, one
  at a time, Start of another chase replaces the running one (#73). In Setup mode chases are added, edited, deleted and
  moved up and down; the chase editor sets the name, the repeat (once, N times, until stopped) and the steps, each with
  its hold in seconds and the channels it sets, sorted by channel and labelled with the fixture channels on them, each
  with a dot in its color if it has one; steps can be moved, duplicated and deleted. Saving or deleting the running
  chase stops it (#74). The steps are tabs, numbered, with Add step after the last one. A step can be filled from the
  current values of the checked fixtures, from a scene or from a preset; each merges into the step (a channel it sets
  takes the new value, a new one is added, the others stay), and only the channels and values are stored (#75). The
  Help view's manual explains chases: hold vs. pause, what stops a chase and what doesn't, the faders staying live and
  the values staying after a stop (#76)

### Changed

- The Help view's manual shows one topic at a time, a tab each with a short label, instead of one long page with a
  contents list (#76)
- The text in the Help view can be selected and copied (#76)

## [0.2.4] - 2026-11-08

### Added

- An **Emergency off** button in the top bar sets all 512 channels to 0 at once, in Show and Setup mode, with or
  without a project; fixtures, scenes and presets stay as they are (#63)
- Channels can be moved up and down in the fixture editor, which changes the order of the fixture's faders; their
  addresses stay the same, and presets and scenes keep setting the same channels (#64)
- A channel with positions can be shown as buttons instead of a fader (Fader / Buttons next to Add position): one
  button per position, the one of the current value lit; positions above the channel lock's cap are disabled (#65)

### Changed

- The fixture editor's Channels tab shows the fixture's start address above the channels
- The window title separates the project and the app name with a plain hyphen
- Add scene is an icon button right after the scenes, Add fixture one right after the last fixture, instead of both
  below the fixtures; without fixtures, Add fixture follows the hint
- Unlocking Setup mode, creating a project and opening one switch to the Show view
- The Help view has a table of contents left of the manual; the manual and the Output section name both the Enttec
  DMX USB Pro and the Eurolite USB-DMX512 PRO
- A port that looks like a DMX interface is marked with a ▸ in front instead of "Enttec?" after it
- The language is switched in the Settings view instead of the top bar

### Fixed

- A scene keeps setting the same channel after the channel's offset is changed in the fixture editor (#64)

### Removed

- The "N channels above 0" counter in the top bar, to make room for Emergency off (#63)

## [0.2.3] - 2026-11-08

### Added

- A color can be picked with the color picker: a click on the swatch beside a color field (channels, presets,
  scenes) opens it; typing the code still works (#61)

### Fixed

- A fader no longer sticks to the mouse pointer after the button was released outside the window or the window lost
  focus while dragging (#59)

## [0.2.2] - 2026-11-07

### Added

- Presets and scenes can have a color (a hex value like `#ff00ff`, in the fixture editor's Presets tab and the scene
  editor): their button shows a glowing dot in it before the name, in Show and in Setup mode
- A right click on a fader sets its channel to the fader's lowest value: 0, or the min of a channel with value rules

## [0.2.1] - 2026-11-07

### Added

- Works with the Eurolite USB-DMX512 PRO as well as the Enttec DMX USB Pro: the port is opened with the settings the
  Eurolite interface expects (250000 baud, 2 stop bits), which the Enttec Pro ignores
- A fixture channel can have a color (a hex value like `#ff00ff`, in the fixture editor): its fader is tinted with it,
  also at 0, filled with it below the handle and glows the brighter the higher the value. The Channels view stays as it
  is
- A fixture channel can restrict its fader (the **Values** column in the fixture editor's Channels tab): **Continuous**
  from a min to a max, e.g. a dimmer that does nothing below 100; **Steps** of a step size; or **Positions**, only the
  values listed, each with an optional name, e.g. the slots of a gobo wheel. The fader stops only at those values, its
  step buttons and the arrow keys on its handle go to the next and the previous one, and a positions fader shows a tick per position on its track
  (named on mouse over) to click. A preset picks a position from a list. Presets and scenes are moved to the nearest valid value when the rules
  change. Fixtures sharing an address need the same values there. The Channels view, blackout and the channel lock
  stay as they are

### Changed

- The app always starts disconnected, so nothing is sent to the rig before you press **Connect**. The port connected
  to last is still remembered and chosen again on start
- **Connect** and **Disconnect** are in the top bar now, next to the output status and the chosen port (still in the
  Settings view as well); the port is still chosen in the Settings view
- The fixture editor is split into the tabs **General** (name, start address, hint, description), **Channels** and
  **Presets**, each with its own help. Errors and **Save** stay below the tabs, and a tab with an error is marked. In
  the Presets tab a channel with a color shows it next to its name
- In a preset, the value of a channel that isn't ticked can be entered right away: entering it (typing or the arrows)
  ticks the channel, also for a value of 0

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

[Unreleased]: https://github.com/xeronimus/gluehwuermli/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/xeronimus/gluehwuermli/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/xeronimus/gluehwuermli/compare/v0.2.4...v0.3.0
[0.2.4]: https://github.com/xeronimus/gluehwuermli/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/xeronimus/gluehwuermli/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/xeronimus/gluehwuermli/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/xeronimus/gluehwuermli/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/xeronimus/gluehwuermli/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/xeronimus/gluehwuermli/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/xeronimus/gluehwuermli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/xeronimus/gluehwuermli/releases/tag/v0.1.0
