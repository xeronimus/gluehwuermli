# 1. Electron with electron-vite

Date: 2026-10-31

## Status

Accepted

## Context

Glühwürmli is a desktop app that drives DMX fixtures through an Enttec DMX USB Pro, a virtual COM port. It needs
serial port access, timing that keeps running while the window is in the background, and a UI built with the stack
known from my-life (TypeScript, React, Vite, Vanilla Extract, Zustand).

The alternatives (Tauri 2, a plain web app on the Web Serial API, Wails) are compared in
`doc/dmx-latency-and-stack.md`.

## Decision

- **Electron**, with the serial port accessed through **`serialport`** (Node, N-API prebuilds) in the main process.
- **electron-vite** builds main, preload and renderer with Vite; the renderer uses the my-life frontend stack
  unchanged.
- **electron-builder** packages a Windows NSIS installer (`electron-builder.yml`, `pnpm dist`).
- Only what the packaged app loads at runtime is a `dependency` (`serialport`); everything Vite bundles is a
  `devDependency`, so the installer only carries what it needs.
- One pnpm package (not a workspace): main, preload, renderer and `src/shared` share one `package.json`. The process
  boundaries are enforced by `src/architecture.test.ts` instead of by package boundaries.

## Consequences

- One language and one test runner (Vitest) for the whole app.
- About 100 MB installer and the RAM use of Chromium; accepted for a lighting tool.
- Security follows the Electron defaults for apps without remote content: `contextIsolation`, `sandbox`, no
  `nodeIntegration`, a CSP in `index.html`, and a narrow preload API (`src/shared/dmxBridge.ts`) instead of
  `ipcRenderer` in the renderer.
- Electron 45 no longer downloads its binary in its own install script; the root `postinstall` runs
  `install-electron`, which electron-vite needs before `pnpm dev`.
