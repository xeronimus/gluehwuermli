# Glühwürmli - Project Context

## What is this project?

A desktop app that sends DMX to lighting fixtures through an **Enttec DMX USB Pro** (a virtual COM port). Today:
fixtures (named devices with a start address and named channels, stored in `fixtures.json` in Electron's `userData`
folder) with a fader per channel and presets (named buttons setting several of a fixture's channels at once), a bank
of 16 raw 0–255 faders that moves across channels 1–512, port selection and connect/disconnect.
Planned: scenes, fades and chases.

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
| `pnpm test`   | Typecheck (`tsconfig.json` and `src/renderer/tsconfig.json`), then Vitest                  |
| `pnpm format` | Import normalizer + Prettier (code and Markdown)                                           |
| `pnpm ft`     | Format + test                                                                              |

## Project Structure

```
electron.vite.config.ts      # aliases per process: `@/` = that process's source root, `@shared/`, `@resources/` (renderer)
vitest.config.mts            # one Vitest project per process, with the same aliases
electron-builder.yml         # packaging; serialport's native binding is unpacked from the asar
doc/
  dmx-latency-and-stack.md   # latency analysis, stack choice, open questions
  architecture/decisions/    # ADRs (.adr-dir)
scripts/normalizeImports.mjs # turns ../../ imports into @/ (main and renderer), run by `pnpm format`
src/
  architecture.test.ts       # the import rules below
  resources/                 # images: app icon (favicon/), mascot
  shared/                    # used by every process, depends on nothing but packages (no Node, no Electron)
    dmx.ts                   # universe size, channel/value ranges
    ipcChannels.ts           # IPC channel names (kept apart so the preload doesn't bundle TypeBox)
    ipc.ts                   # TypeBox schemas + types of every IPC payload and of the output status, parse* guards
    fixtures.ts              # fixture addressing, validation and overlaps; parseFixtureSetup (used by main and renderer)
    dmxBridge.ts             # the API the preload exposes as window.gluehwuermli
    serialQueue.ts           # runs overlapping async tasks one after the other (fixture saves in main and renderer)
  main/                      # Electron main process
    index.ts                 # window, lifecycle
    config.ts                # the only module reading the environment: `MAIN_VITE_*` from electron-vite's .env files (.env.sample)
    services.ts              # composition root, the only module importing from impl/
    ipc/registerDmxIpc.ts    # IPC handlers: validate, then call the engine
    ipc/registerFixtureIpc.ts # fixtures:load / fixtures:save, validated against parseFixtureSetup
    storage/jsonFile.ts      # reading a JSON file, writing one atomically; used by every file store
    fixtures/FixtureStore.ts # store interface; impl/file (JSON in userData, atomic write, invalid file set aside)
    window/                  # main window position/size between sessions: windowState (schema, restorableBounds),
                             # WindowStateStore + impl/file, persistWindowState (debounced save, save on close)
    dmx/
      dmxEngine.ts           # owns universe, port and refresh tick (ADR 2)
      enttecProPacket.ts     # label 6 framing
      DmxPortConnector.ts    # port interface; impl/serialport (real), impl/inMemory (tests, simulated)
      portDetection.ts       # FTDI ids of the Pro
  preload/index.ts           # contextBridge: the DmxBridge over ipcRenderer
  renderer/
    index.html               # CSP
    tsconfig.json            # the renderer's own (DOM, JSX)
    src/
      index.tsx, envConfig.ts
      components/            # UI by feature: output/ (top bar: view toggle, port), fixtures/ (groups, editor), faders/ (raw channels);
                             # commons/ (Button, ChannelFader, ModeToggle, ErrorBoundary, icons.ts)
      data/                  # pure logic (channelValues, channelBank, outputStatus, fixtureDraft, fixtureFaders, fixtureList,
                             # presets)
        service/             # DmxService, FixtureService, services.ts (composition root), impl/electron, impl/inMemory
      domain/                # types (Fader)
      state/                 # Zustand store: channels/, output/, fixtures/, actionHooks/
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
- **One way to wire services** (as in my-life): every provider-specific service is an interface, implemented by a
  factory `xxxFactory(deps)` in `impl/<provider>/`; `services.ts` in main and in the renderer is the single
  composition root and the only module importing from `impl/`. Tests pass fakes (`inMemory`) into the factories
  rather than mocking modules
- **Optimistic UI**: a fader updates the store and sends the value in the same handler (`useActionSetChannelValue`),
  no round trip. Each `ChannelFader` subscribes to its own channel only. A fixture fader is a `ChannelFader` on the
  fixture channel's absolute address, so fixtures and the raw channels always show the same values
- **Fixture changes are stored first**: add/edit/delete save the whole setup and only then update the store; a failed
  save shows `fixturesError` and leaves the shown setup unchanged
- **Layer imports** (enforced by `src/architecture.test.ts`): the renderer imports neither main, preload, Node nor
  Electron; main never imports the renderer; `shared/` depends only on itself and packages; in the renderer
  `domain/` imports only `domain/`, `shared/` and packages, `data/` never imports `state/` or `components/`, `state/`
  never imports `components/`

## Code Style and Workflow

All coding rules (formatting, imports, TypeScript, React, state, styling, Electron, testing, error handling, commits)
are in `CODE_STYLE.md`; read it before writing code. A task is done when its post-task review passes, including
`pnpm ft`.
