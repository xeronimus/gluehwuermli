# Glühwürmli - Project Context

## What is this project?

A desktop app that sends DMX to lighting fixtures through an **Enttec DMX USB Pro** (a virtual COM port) or a **Eurolite USB-DMX512 PRO** (same protocol, needs
250000 8N2). Today:
a Help view (short manual, the data folder, a link to the repo), projects (a `.glp` file wherever the user keeps it, holding the fixtures and scenes of one rig, saved on every change;
the last one reopens on start, a double-click on a `.glp` opens it, ADR 4), fixtures (named devices with a start address
and named channels, each with an optional color its fader fills and glows in and optional value rules: a range, steps
or named positions its fader stops at, shown as a fader or as buttons, a button optionally momentary) with a fader per channel and presets (named buttons setting several of a fixture's channels at once), scenes
(named buttons setting the channels of several fixtures at once, stored with the fixtures; in the Show view above the
fixture groups), chases (steps of absolute channel values played one after the other by main; a row each below the
fixture groups, started, paused, resumed and stopped there), a bank
of 16 raw 0–255 faders that moves across channels 1–512, port selection and connect/disconnect (the last connected
port is remembered and preselected on start, the app always starts disconnected; Connect / Disconnect in the top bar). The app starts in
**Show mode** (fixtures and scenes can be played, not changed); a password unlocks **Setup mode**. Fixture channels can declare a
cap (`"lock": {"max": 0}`, e.g. a laser) that applies while the channel lock is on; it is independent of the mode and
lifted with the password, too (ADR 3). The UI is in English and German (Swiss High German), switched in the Settings view.
In Setup mode chases are added, edited (name, repeat, steps with their hold and
channel values, filled from the current values of checked fixtures, a scene or a preset, merged into the step),
deleted and put in order. Planned: fades.

The widget sends the DMX signal on its own clock and repeats the last universe it got; the app only sends a full
universe when something changed. Why a web stack is fast enough, and why Electron: `doc/dmx-latency-and-stack.md`.

## Tech Stack

The frontend follows **my-life** (`~/Documents/git/my-life`), same libraries, same rules. How code is written:
`CODE_STYLE.md`.

- **Desktop:** Electron 45, built with **electron-vite** (Vite 8 for main, preload and renderer), packaged with
  electron-builder (Windows NSIS, `electron-builder.yml`). ADR 1
- **Serial port:** `serialport` in the main process; the only runtime `dependency`, everything Vite bundles is a
  `devDependency`
- **Framework:** React 19 + TypeScript 7 (strict mode)
- **Styling:** Vanilla Extract (zero-runtime CSS-in-JS)
- **State:** Zustand with `combine` + Reselect selectors
- **Validation:** TypeBox schemas for every IPC payload (`src/shared/ipc.ts`), like my-life's `@my-life/contract`
- **Faders:** react-range; **icons:** `@tabler/icons-react`
- **Logging:** loglevel
- **i18n:** Lingui (as in tinytrend), in the renderer only: `en` is the source language, `de` the catalog to keep
  complete; the macro runs through `lingui-macro-plugin.mts` (Babel), the `.po` catalogs compile in the build
- **Testing:** Vitest, one project per process (`vitest.config.mts`), `node` environment
- **Formatting:** Prettier with sorted imports
- **Package manager:** pnpm 12, a single package (`pnpm-workspace.yaml` only holds settings: hoisted `node_modules`
  for electron-builder, `allowBuilds`)

## Commands

| Command       | Description                                                                                |
| ------------- | ------------------------------------------------------------------------------------------ |
| `pnpm dev`    | Electron + Vite dev server; settings from `.env.development.local` (copy of `.env.sample`) |
| `pnpm start`  | Build and run the production build                                                         |
| `pnpm build`  | Build to `out/`                                                                            |
| `pnpm dist`   | Build and package the Windows installer to `dist/`                                         |
| `pnpm test`   | `lingui extract`, typecheck, Vitest (fails on a missing German text), `lingui compile`     |
| `pnpm format` | Import normalizer + Prettier (code and Markdown)                                           |
| `pnpm ft`     | Format + test                                                                              |

## Project Structure

```
electron.vite.config.ts      # aliases per process: `@/` = that process's source root, `@shared/`, `@assets/` (renderer)
vitest.config.mts            # one Vitest project per process, with the same aliases
CHANGELOG.md                 # release notes, Keep a Changelog; what counts as breaking
electron-builder.yml         # packaging; serialport's native binding is unpacked from the asar
build/project.ico            # the .glp file icon (the app icon on a page), registered by the installer
doc/
  dmx-latency-and-stack.md   # latency analysis, stack choice, open questions
  architecture/decisions/    # ADRs (.adr-dir)
scripts/normalizeImports.mjs # turns ../../ imports into @/ (main and renderer), run by `pnpm format`
scripts/dmxRangeTest.ps1     # hardware check without the app: sends a channel range through either interface (-Port,
                             # -From, -To; -Chase, -Alternate, -Sweep), follows doc/devices/enttec_dmx_usb_pro/
lingui.config.ts             # locales en (source) and de, catalogs in src/renderer/src/locales/
lingui-macro-plugin.mts      # runs the Lingui macro with Babel (plugin-react 6 compiles with OXC)
src/
  architecture.test.ts       # the import rules below
  assets/                    # images: app icon (favicon/), mascot
  shared/                    # used by every process, depends on nothing but packages (no Node, no Electron)
    dmx.ts                   # universe size, channel/value ranges
    ipcChannels.ts           # IPC channel names (kept apart so the preload doesn't bundle TypeBox)
    ipc.ts                   # TypeBox schemas + types of every IPC payload and of the output status, parse* guards
    fixtures.ts              # fixture addressing, validation and overlaps; parseFixtureSetup (used by main and renderer)
    projects.ts              # project files: parseProjectFile (too-new before invalid), the .glp extension, projectNameOf
    scenes.ts                # scene validation (SceneError codes), checked by parseFixtureSetup
    chases.ts                # chase validation (ChaseError codes), checked by parseFixtureSetup; per absolute
                             # channel, independent of the fixtures; passCount (main's player and the chase rows)
    time.ts                  # MS_PER_SECOND, MS_PER_MINUTE
    channelValueRules.ts     # a channel's value rules: its stops, nearest/next/previous stop, rule errors, preset and
                             # scene values checked against them
    validation.ts            # isBlank, duplicatesOf: shared by the fixture and scene validation
    colors.ts                # channel, preset and scene colors: stored form, normalizing what is typed, validity
    preloadBridge.ts         # the API the preload exposes as window.gluehwuermli
    links.ts                 # the repo URL: the Help view's link and main's external-link allow-list
    serialQueue.ts           # runs overlapping async tasks one after the other (saves, project switches)
  main/                      # Electron main process
    index.ts                 # single-instance lock (before any service), window, lifecycle, .glp from argv and
                             # second-instance, window title
    config.ts                # the only module reading the environment: `MAIN_VITE_*` from electron-vite's .env files (.env.sample)
    services.ts              # composition root, the only module importing from impl/
    ipc/registerDmxIpc.ts    # IPC handlers: validate, then call the engine; dmx:get-channel-values answers the
                             # capped universe (dmxIpcHandlers, also in Show mode)
    ipc/registerProjectIpc.ts # project:* channels wired to the session, pushes project:changed / project:open-requested
    ipc/projectIpcHandlers.ts # the project payloads checked against their schema, without Electron
    ipc/registerAppIpc.ts    # app:get-data-folder / app:open-data-folder (userData, shell.openPath via dataFolder/;
                             # refused in Show mode); app:get/set-blackout-on-quit (blackoutOnQuitIpcHandlers,
                             # also in Show mode)
    ipc/registerLockIpc.ts   # app:get-lock-status, app:unlock, app:lock, app:lift-channel-lock, app:lock-channels,
                             # app:change-password, app:user-activity, pushes app:lock-changed
    ipc/registerChaseIpc.ts  # chase:get-status/start/pause/resume/stop (chaseIpcHandlers: start takes an id, plays the
                             # chase saved in the open project; allowed in Show mode), pushes chase:status-changed and
                             # dmx:channels-changed (the values a step set, after the caps)
    storage/jsonFile.ts      # reading a JSON file, writing one atomically; used by every file store
    project/                 # ADR 4: projectSession (the open project: start, create, open, recent, save; blackout and
                             # channel limits on a switch), ProjectFileStore + impl/file (never touches a file it can't
                             # open), ProjectDialogs + impl/electron, recentProjects, commandLine (argv), windowTitle
    quit/quitGuard.ts        # holds the quit until the DMX port is closed (blackout first if set), at most 2 s
    lock/                    # Show/Setup mode (ADR 3): appLock (mode, unlock, idle timer, channel lock), passwordHash
                             # (scrypt)
    settings/                # settings.json: settings (schema), SettingsStore + impl/file, appSettings (the one owner,
                             # merges each change into the whole file: the lock's password, the output's port, the
                             # last and the recent projects)
    window/                  # main window position/size between sessions: windowState (schema, restorableBounds),
                             # WindowStateStore + impl/file, persistWindowState (debounced save, save on close);
                             # externalLinks: no navigation away from the app page or new window, only http(s) links
                             # open in the browser
    chase/                   # chasePosition (pure: step and pass of a chase at a given time), chasePlayer (one chase at
                             # a time on the engine's tick: start, pause, resume, stop; stopped by Emergency off, a
                             # project switch, quitting, saving or deleting the running chase)
    dmx/
      dmxEngine.ts           # owns universe, port and refresh tick (ADR 2), caps channels while the lock is on (ADR 3);
                             # onTick runs the chase player right before the universe is sent
      emergencyOff.ts        # stops the chase, then blacks out
      enttecProPacket.ts     # label 6 framing
      DmxPortConnector.ts    # port interface; impl/serialport (real), impl/inMemory (tests, simulated)
      portDetection.ts       # FTDI ids of the Pro
      portMemory.ts          # remembers the last connected port in the settings, connects to it on start (not with
                             # the simulated output)
  preload/index.ts           # contextBridge: the PreloadBridge over ipcRenderer
  renderer/
    index.html               # CSP
    tsconfig.json            # the renderer's own (DOM, JSX)
    src/
      index.tsx, envConfig.ts  # index.tsx loads the language before the first render
      i18n/                  # i18n.ts (locales, pickLocale, activateLocale); messages/: the codes of data/, shared/ and
                             # main as translated messages (fixture and scene errors, output status, password form)
      locales/{en,de}/       # messages.po, extracted by `lingui extract`; the German one is translated by hand
      components/            # UI by feature: output/ (top bar: open project, view toggle, lock indicator, output status, Emergency off), fixtures/
                             # (fixture groups and editor, scene buttons and editor), chases/ (a row per chase below the fixtures: Start, Pause /
                             # Resume, Stop, the step boxes, the repeat and pass; in Setup mode move, edit, delete,
                             # Add chase, and the chase editor below the rows), project/ (start view without a
                             # project, Create/Open, recent list, the Settings view's project section), faders/ (raw
                             # channels), settings/ (output port, language, mode and channel lock),
                             # help/ (the manual as tabs, one topics/ component each, open project, data folder, repo link); ShowView.tsx picks the start view
                             # or the fixtures; commons/ (Button, ChannelFader, MarkdownText, ModeToggle, PasswordForm,
                             # Tabs, FaderTicks, useFaderTitles, useElementWidth, ErrorBoundary, icons.ts)
      data/                  # pure logic (channelValues, channelBank, channelLocks, outputStatus, fixtureDraft,
                             # channelValuesDraft, fixtureEditorTabs, fixtureFaders, faderStops, fixtureList,
                             # presets, scenes, chaseRows, chaseDraft, chaseHold, chaseStepFill, chaseList, tabs, passwordForm, activityThrottle,
                             # recentProjects)
        service/             # DmxService, ProjectService, AppService, LockService, ChaseService, services.ts
                             # (composition root), impl/electron, impl/inMemory
      domain/                # types (Fader)
      state/                 # Zustand store: channels/, output/, fixtures/, dataFolder/, lock/, chase/, actionHooks/
```

## Key Architecture Patterns

- **The DMX engine runs in the main process** (ADR 2). The renderer only shows the UI; a render error or a hidden
  window never stops the output. Channel changes only write to the buffer, a 23 ms tick sends the universe when it
  changed, so any number of changes between two ticks cost one packet
- **Narrow IPC contract** in `src/shared/`: channel names, a TypeBox schema per payload, the preload API. The renderer
  never sees `ipcRenderer` or Node; the main process validates every payload (`parse*`) and drops invalid ones.
  Fader moves are fire-and-forget (`send`), the rest request/response (`invoke`)
- **Expected failures are values**: a port that can't be opened, fails or is unplugged ends in the `failed`
  `DmxOutputStatus`, pushed to the renderer over `dmx:status-changed`; the engine never throws for them
- **Codes, not sentences, outside the UI**: `shared/`, `main/` and the renderer's `data/` never say anything in a
  language. They return codes (`FixtureError`, the `reason` of a failed `DmxOutputStatus`, `PasswordFormError`) that
  `i18n/messages/` turns into text; `state/` keeps errors as Lingui `MessageDescriptor`s, so a language switch also
  changes an error already shown. Raw texts of `serialport` or the OS are shown as they are, inside a translated
  sentence
- **One way to wire services** (as in my-life): every provider-specific service is an interface, implemented by a
  factory `xxxFactory(deps)` in `impl/<provider>/`; `services.ts` in main and in the renderer is the single
  composition root and the only module importing from `impl/`. Tests pass fakes (`inMemory`) into the factories
  rather than mocking modules
- **Optimistic UI**: a fader updates the store and sends the value in the same handler (`useActionSetChannelValue`),
  no round trip. Each `ChannelFader` subscribes to its own channel only. A fixture fader is a `ChannelFader` on the
  fixture channel's absolute address, so fixtures and the raw channels always show the same values. A fixture fader
  with value rules snaps in the renderer (`faderStops`) and only sends valid values; main checks the rules only when
  saving (presets, scenes, shared addresses), not per address
- **Show mode is enforced in main** (ADR 3): the `AppLock` owns the mode, the channel lock (independent of each other),
  the password and the idle timer, the `DmxEngine` caps locked channels per address in `setChannel`, whichever view
  sent the value, and main refuses saving fixtures, creating a project, opening the data folder and lifting the channel lock without the
  password in Show mode. The renderer only mirrors the
  pushed status (`app:lock-changed`), disables and hides, and caps its faders the same way so they show what is sent
- **Projects are files, saved on every change** (ADR 4): the `ProjectSession` in main owns the open `.glp`; opening
  another one blacks out and applies its channel limits in one step. A file that can't be opened is never changed,
  renamed or set aside. A save names its project, main refuses it for any other. One process only (single-instance
  lock), a double-clicked `.glp` is handed to the running app
- **Fixture changes are stored first**: add/edit/delete of a fixture or scene save the whole setup to the project file
  and only then update the store; a failed save shows `fixturesError` and leaves the shown setup unchanged. A fixture change fits the scenes
  in the same save (`withFittedScenes`), since main refuses scenes naming a fixture or channel that is gone; before
  that, a saved fixture's scene values follow its channels to their new offsets (`withSceneOffsetsChanged`)
- **Layer imports** (enforced by `src/architecture.test.ts`): the renderer imports neither main, preload, Node nor
  Electron; main never imports the renderer; `shared/` depends only on itself and packages; in the renderer
  `domain/` imports only `domain/`, `shared/` and packages, `data/` never imports `state/` or `components/`, `state/`
  never imports `components/`

## Versioning and Releases

Semantic Versioning; the version lives in `package.json` and is tagged as `vX.Y.Z` on `main`. What counts as breaking
(an existing project file or `settings.json` no longer readable without a migration, or a Show/Setup mode change an
operator has to relearn) is written at the top of `CHANGELOG.md`. While on `0.x`, breaking changes bump the minor
version, everything else the patch version.

- Every user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md` in the same PR (Keep a Changelog
  sections: Added, Changed, Fixed, Removed); internal refactors, tests and docs don't
- A change to a stored file format bumps its `PROJECT_VERSION` / `SETTINGS_VERSION` and migrates older files
- Releasing: rename `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD` and add a fresh empty `[Unreleased]` with its compare
  link, then `npm version <minor|patch>` (bumps `package.json`, commits, tags) and push the tag

## Code Style and Workflow

All coding rules (formatting, imports, TypeScript, React, state, styling, Electron, testing, error handling, commits)
are in `CODE_STYLE.md`; read it before writing code. A task is done when its post-task review passes, including
`pnpm ft`.
