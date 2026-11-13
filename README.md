# Glühwürmli

<img src="src/assets/gluehwuermli_favicon.png" alt="Glühwürmli" width="96" align="right" />

A desktop app that sends DMX through a USB DMX interface: an **Enttec DMX USB Pro** or a **Eurolite USB-DMX512 PRO**
(the same protocol). Fixtures with named channels and presets, scenes, chases, and a Show mode that plays but doesn't
change them. Electron + electron-vite, React, TypeScript.

## Safety

Glühwürmli comes without any warranty (GPL-3.0, see [LICENSE](LICENSE)). It is made for private use, such as a living
room, a party or a small band, not for professional shows or anything safety-critical. The channel lock is not a laser
safety system: it only caps what the app sends. Mount and aim a laser so that it can never hit anyone's eyes, whatever
the app does.

## Getting started

```sh
pnpm install   # also downloads the Electron binary (postinstall)
pnpm dev       # the app with hot reload of the UI
```

Without an interface, start with one simulated port instead of the real serial ports:

```sh
cp .env.sample .env.development.local   # MAIN_VITE_SIMULATED_OUTPUT=1, gitignored
pnpm dev
```

The settings in `.env.development.local` apply to `pnpm dev` only, never to a build or installer. Delete the file (or
set the value to `0`) to see the real ports again. All settings: [.env.sample](.env.sample).

### Windows: lower the FTDI latency timer

Device Manager → Ports (COM & LPT) → the interface's COM port → Port Settings → Advanced → **Latency Timer: 1–2 ms**
(default 16). It's the biggest single factor in how quickly a fader reaches the light; see
[doc/dmx-latency-and-stack.md](doc/dmx-latency-and-stack.md).

## Commands

| Command           | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `pnpm dev`        | Electron with the Vite dev server (HMR for the renderer)     |
| `pnpm start`      | Build and run the production build (`electron-vite preview`) |
| `pnpm build`      | Build main, preload and renderer to `out/`                   |
| `pnpm dist`       | Build and package the Windows installer (NSIS) to `dist/`    |
| `pnpm test`       | Typecheck (both tsconfigs), then all Vitest tests            |
| `pnpm test:watch` | Vitest in watch mode                                         |
| `pnpm format`     | Import normalizer + Prettier (code and Markdown)             |
| `pnpm ft`         | Format + test, run it before considering a task done         |

## Docs

- [doc/dmx-latency-and-stack.md](doc/dmx-latency-and-stack.md): latency of a web stack with a USB DMX interface, why
  Electron in 2026
- [doc/chases.md](doc/chases.md): how chases behave, the spec they were built from
- [doc/dmxInterfaces](doc/dmxInterfaces): the two USB DMX interfaces, with links to their product pages and the protocol
- [doc/architecture/decisions](doc/architecture/decisions): the ADRs
- [CLAUDE.md](CLAUDE.md): project context, structure and code guidelines
