# Changelog

All notable changes to Glühwürmli are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

What counts as a breaking change: an existing `fixtures.json` or `settings.json` that can no longer be read without a
migration, or a change to Show and Setup mode that an operator has to relearn. While the version is `0.x`, a breaking
change bumps the minor version and everything else the patch version.

## [Unreleased]

### Added

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

[Unreleased]: https://github.com/xeronimus/gluehwuermli/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/xeronimus/gluehwuermli/releases/tag/v0.1.0
