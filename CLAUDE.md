# Glühwürmli - Project Context

## What is this project?

A desktop app that sends DMX to lighting fixtures through an **Enttec DMX USB Pro** (a virtual COM port). Today: a
bank of 0–255 faders for channels 1–16, port selection and connect/disconnect. Planned: patching fixtures, scenes,
fades and chases.

The widget sends the DMX signal on its own clock and repeats the last universe it got; the app only sends a full
universe when something changed. Why a web stack is fast enough, and why Electron: `doc/dmx-latency-and-stack.md`.

## Tech Stack

The frontend follows **my-life** (`~/Documents/git/my-life`), same libraries, same rules.

- **Desktop:** Electron 45, built with **electron-vite** (Vite 8 for main, preload and renderer), packaged with
  electron-builder (Windows NSIS, `electron-builder.yml`). ADR 1
- **Serial port:** `serialport` in the main process; the only runtime `dependency`, everything Vite bundles is a
  `devDependency`
- **Framework:** React 19 + TypeScript 7 (strict mode)
- **Styling:** Vanilla Extract (zero-runtime CSS-in-JS), `.css.ts` next to each component, `styleVariants`/recipes for
  variants, the theme in `components/themes.css.ts`
- **State:** Zustand with `combine` + Reselect selectors
- **Validation:** TypeBox schemas for every IPC payload (`src/shared/ipc.ts`), like my-life's `@my-life/contract`
- **Faders:** react-range; **icons:** `@tabler/icons-react` through `components/commons/icons.ts` only
- **Logging:** loglevel (renderer `data/service/Logger.ts`, main `src/main/log.ts`)
- **Testing:** Vitest, one project per process (`vitest.config.mts`), `node` environment
- **Formatting:** Prettier (single quotes, 120 chars, no bracket spacing, sorted imports), same `.prettierrc` as
  my-life plus the `@shared/` and `@resources/` groups
- **Package manager:** pnpm 12, a single package (`pnpm-workspace.yaml` only holds settings: hoisted `node_modules`
  for electron-builder, `allowBuilds`)

## Commands

| Command           | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `pnpm dev`        | Electron + Vite dev server; settings from `.env.development.local` (copy of `.env.sample`) |
| `pnpm start`      | Build and run the production build                                  |
| `pnpm build`      | Build to `out/`                                                     |
| `pnpm dist`       | Build and package the Windows installer to `dist/`                  |
| `pnpm test`       | Typecheck (`tsconfig.json` and `src/renderer/tsconfig.json`), then Vitest |
| `pnpm format`     | Import normalizer + Prettier                                        |
| `pnpm ft`         | Format + test                                                       |

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
    dmxBridge.ts             # the API the preload exposes as window.gluehwuermli
  main/                      # Electron main process
    index.ts                 # window, lifecycle
    config.ts                # the only module reading the environment: `MAIN_VITE_*` from electron-vite's .env files (.env.sample)
    services.ts              # composition root, the only module importing from impl/
    ipc/registerDmxIpc.ts    # IPC handlers: validate, then call the engine
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
      components/            # UI by feature: output/ (port bar), faders/; commons/ (Button, ErrorBoundary, icons.ts)
      data/                  # pure logic (channelValues, outputStatus)
        service/             # DmxService interface, services.ts (composition root), impl/electron, impl/inMemory
      domain/                # types (Fader)
      state/                 # Zustand store: channels/, output/, actionHooks/
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
  no round trip. Each `ChannelFader` subscribes to its own channel only
- **Layer imports** (enforced by `src/architecture.test.ts`): the renderer imports neither main, preload, Node nor
  Electron; main never imports the renderer; `shared/` depends only on itself and packages; in the renderer
  `domain/` imports only `domain/`, `shared/` and packages, `data/` never imports `state/` or `components/`, `state/`
  never imports `components/`

## Code Style

- **TypeScript strict mode**: `noUnusedLocals`, `noUnusedParameters`
- **Single quotes**, no bracket spacing, no trailing commas, 120 characters, 2 spaces, LF
- **Import order** (Prettier plugin): react > third-party > `@shared/` > `@resources/` > `@/` > relative
- **Path alias**: `@/` for imports crossing 2+ directory levels (`../../` and deeper), `./` and `../` otherwise.
  Enforced by `scripts/normalizeImports.mjs`, run via `pnpm format`

## Workflow

- Before considering any task complete, run `pnpm ft` (format + test).
- Include the GitHub issue id in commit messages (e.g. `Refs #12`) once there are issues.

## Code Quality & Design Principles

The same as my-life; after each larger task, apply this checklist.

### Clean Code
- **Meaningful names**: no abbreviations or single-letter names outside loops
- **Small, focused units**: if a section needs a comment to explain what it does, extract it into a named function
- **No magic numbers/strings**: named constants (DMX ranges live in `src/shared/dmx.ts`)
- **DRY but not premature**: extract only when a pattern appears three times and the abstraction is obviously right

### SOLID (adapted for React/TS)
- **Single Responsibility** for components, hooks and services
- **Open/Closed**: extend by composition (a new `DmxPortConnector`, a new hook) rather than modifying stable code
- **Liskov**: implementations of an interface (`DmxPortConnector`, `DmxService`) honor its contract fully
- **Interface Segregation**: narrow props and service interfaces
- **Dependency Inversion**: components and the engine depend on interfaces, not on `serialport` or `window`

### TypeScript Discipline
- **Discriminated unions over optional fields** (see `DmxOutputStatus`)
- **No type assertions** (`as`): write a type guard or a schema check instead
- **No non-null assertions** (`!`)
- **`readonly`** for data flowing from the store into components

### React-Specific Patterns
- **`useEffect` is for external sync only** (the status subscription, listing ports); never to derive state
- **No premature memoisation**
- **No boolean prop explosion**: use a variant (`Button`'s `variant`)
- **No derived data in the store**: Reselect selectors instead
- **Custom hooks for logic**: async actions under `state/actionHooks/`
- **Colocate styles**: a `.css.ts` next to every `.tsx` with layout; no inline style objects (react-range's own
  positioning `style` is passed through, that's the exception)

### Testing
- **Test logic, not components**: extract into pure functions and unit test those
- **Fakes at the service boundary**: `inMemoryConnectorFactory` for the engine, fake timers for the tick
- **Cover the boundaries**: a happy path and an error/edge case for each new action or function

### Module Hygiene
- **No barrel `index.ts`** in feature folders; **no circular imports**; feature folders don't import each other's
  internals

### Error Handling
- **No silent catch blocks**: action hooks log and surface errors (`outputError`)
- **Error Boundaries** around each view (`App.tsx`)

### Electron-Specific
- **Security defaults stay on**: `contextIsolation`, `sandbox`, no `nodeIntegration`, the CSP in `index.html`
- **Nothing timing-critical in the renderer**: timers for DMX (refresh, later fades/chases) live in the main process
- **New IPC = shared first**: add the channel to `ipcChannels.ts`, the payload schema to `ipc.ts`, the method to
  `DmxBridge`, then preload, handler and renderer service
- **Runtime-loaded packages are `dependencies`**, bundled ones `devDependencies`

### Post-Task Review Steps
1. No new `any`
2. No component over ~150 lines
3. New logic in pure functions with at least a smoke test
4. Duplicated logic extracted or noted as a follow-up
5. `pnpm ft` passes
