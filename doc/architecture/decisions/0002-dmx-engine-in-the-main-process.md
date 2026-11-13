# 2. The DMX engine lives in the main process

Date: 2026-10-31

## Status

Accepted

## Context

The Enttec DMX USB Pro (like the Eurolite USB-DMX512 PRO, the same protocol) keeps sending the last universe on its own DMX clock; the app only sends a packet when a
channel changes. But the Pro has no per-channel command, every packet is a full universe (label 6). A full DMX frame
takes ~22.7 ms on the wire, so sending more often than that is pointless.

Chromium slows down timers in hidden or minimized renderers. Fades and chases (planned) need timing that doesn't.

## Decision

- A **`DmxEngine`** (`src/main/dmx/dmxEngine.ts`) in the main process owns the 512-channel universe, the open port
  and the timing. `setChannel` only writes to the buffer and marks it changed; a **refresh tick** (23 ms) sends the
  whole universe when it changed and no write is still in flight. Any number of changes between two ticks cost one
  packet.
- The port is behind a **`DmxPortConnector`** interface (`src/main/dmx/DmxPortConnector.ts`), with implementations in
  `impl/`: `serialport` for the real widget, `inMemory` for tests and for working without hardware
  (`MAIN_VITE_SIMULATED_OUTPUT=1` in `.env.development.local`, see `.env.sample`). `src/main/services.ts` is the
  composition root.
- The renderer reaches the engine only through the **IPC contract** in `src/shared/`: channel names
  (`ipcChannels.ts`), TypeBox schemas for every payload (`ipc.ts`) and the preload API (`dmxBridge.ts`). Fader moves
  are fire-and-forget (`ipcRenderer.send`), everything else is request/response (`invoke`). The main process checks
  every payload against its schema; the renderer is not trusted.
- The renderer store keeps what the faders show and updates it optimistically; the main process is the source of
  truth for what is sent.
- Port failures (can't open, write error, unplugged) are values: the engine ends in the `failed` status and pushes it
  to the renderer (`dmx:status-changed`); it doesn't throw.

## Consequences

- A render error or a slow renderer never stops the output.
- Latency from the fader to the wire is one IPC hop plus at most one tick, dominated by the DMX frame time and the
  FTDI latency timer (`doc/dmx-latency-and-stack.md`).
- New outputs (Art-Net, sACN, a second universe) are new `DmxPortConnector`s or engines, without touching the UI.
