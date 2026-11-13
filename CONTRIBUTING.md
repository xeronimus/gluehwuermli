# Contributing to Glühwürmli

How to build and run the app from source. What the app is and how to use it: [README.md](README.md).

The app is Electron with electron-vite, React and TypeScript. Project context, structure and architecture:
[CLAUDE.md](CLAUDE.md); how code is written: [CODE_STYLE.md](CODE_STYLE.md).

## Getting started

Needs Node.js 24 and pnpm (the version is pinned in `package.json`, `corepack enable` picks it up).

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

| Command           | Description                                                                     |
| ----------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`        | Electron with the Vite dev server (HMR for the renderer)                        |
| `pnpm start`      | Build and run the production build (`electron-vite preview`)                    |
| `pnpm build`      | Build main, preload and renderer to `out/`                                      |
| `pnpm dist`       | Build and package the Windows installer (NSIS) to `dist/`                       |
| `pnpm test`       | Extract the texts, typecheck, all Vitest tests (fails on a missing German text) |
| `pnpm test:watch` | Vitest in watch mode                                                            |
| `pnpm format`     | Import normalizer + Prettier (code and Markdown)                                |
| `pnpm ft`         | Format + test, run it before considering a task done                            |

## Texts and translations

Every text the user sees is English in the code and translated to German in
`src/renderer/src/locales/de/messages.po` (Swiss High German, see [CODE_STYLE.md](CODE_STYLE.md)). `pnpm test`
extracts new texts into the catalogs and fails until each has its German translation.

## Testing with hardware, without the app

`scripts/dmxRangeTest.ps1` sends a channel range straight through either interface (`-Port`, `-From`, `-To`; `-Chase`,
`-Alternate`, `-Sweep`), to tell a problem of the app from one of the interface, cable or device. The interfaces and
their protocol: [doc/dmxInterfaces](doc/dmxInterfaces).

## The landing page

`ghpage/` holds the sources of [the website](https://xeronimus.github.io/gluehwuermli/), a package of its own. It
prerenders React to plain HTML, one page per language, and renders the user manual from the app's own topic components
(`src/renderer/src/components/help/topics/`) and catalogs, so the Help view and the website always say the same.

```sh
pnpm --dir ghpage install
pnpm --dir ghpage build     # to ghpageOut/ (gitignored)
pnpm --dir ghpage preview   # serves it at http://localhost:4173/gluehwuermli/
```

The page's own texts are extracted into the app's catalogs too, so `pnpm test` asks for their German translation as
well. A push to `main` that changes the page, the manual topics or the catalogs deploys it
(`.github/workflows/ghpage.yml`).

## Releases

A pushed `v*` tag releases (`.github/workflows/release.yml`): it tests, builds the installer, signs it through
[SignPath Foundation](https://signpath.org/) once that is set up, and publishes it with `latest.yml` as a GitHub
Release, its notes taken from the version's section in `CHANGELOG.md`. Installed apps update from the latest release
(`electron-updater`, `src/main/update/`): checked on start, downloaded in the background, installed on quit.

1. In `CHANGELOG.md`, rename `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD`, add a fresh empty `[Unreleased]` and the compare
   links, merge that to `main`
2. On `main`: `npm version <minor|patch>` (bumps `package.json`, commits, tags), then `git push --follow-tags`

The workflow refuses a tag that differs from the version in `package.json` or has no section in `CHANGELOG.md`.

## Docs

- [doc/dmx-latency-and-stack.md](doc/dmx-latency-and-stack.md): latency of a web stack with a USB DMX interface, why
  Electron in 2026
- [doc/chases.md](doc/chases.md): how chases behave, the spec they were built from
- [doc/dmxInterfaces](doc/dmxInterfaces): the two USB DMX interfaces, with links to their product pages and the protocol
- [doc/architecture/decisions](doc/architecture/decisions): the ADRs
- [CHANGELOG.md](CHANGELOG.md): what changed in each version

## Branches and commits

Branches are named `<issuenr>-description`, e.g. `1-add-fixtures`; commit messages reference the issue (`Refs #12`).
Every user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md`.
