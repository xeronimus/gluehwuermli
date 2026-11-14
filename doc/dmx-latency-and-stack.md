# DMX latency and the choice of stack

Written while planning the app (October 2026): is a web stack (TypeScript, Node, React) fast enough to drive an
Enttec DMX USB Pro from a 0–255 fader, and is Electron still the way to build a desktop app in 2026?

## Short answer

Yes. The DMX protocol itself is slower than every piece of the web stack, so the stack doesn't add latency you can
notice. And Electron is still the right choice for this app.

## The Enttec DMX USB Pro (and the Eurolite USB-DMX512 PRO)

The Eurolite USB-DMX512 PRO, supported since 0.2.1, speaks the same protocol: everything below holds for both, except
the baud rate.

- The widget shows up as a virtual COM port (FTDI chip, USB ids `0403:6001`, see `src/main/dmx/portDetection.ts`).
- It generates the DMX signal **on its own clock** and keeps sending the last universe it received. The app only
  sends a packet when something changed.
- There is **no "set one channel" command**. The "Output Only Send DMX Packet Request" (label 6) always sends a whole
  universe, or the universe up to the highest channel used:

  ```
  0x7E | 0x06 | length LSB | length MSB | 0x00 (start code) | channel 1 … channel n | 0xE7
  ```

  So the app keeps a 512-byte buffer as the single source of truth, changes bytes in it and sends all of it
  (`src/main/dmx/enttecProPacket.ts`).

- The baud rate is ignored by the Pro's virtual COM port, USB full speed is what counts. The Eurolite interface
  expects 250000 baud, 8 data bits, no parity, 2 stop bits; the app opens every port that way
  (`src/main/dmx/impl/serialport/serialPortConnectorFactory.ts`).

## Where the latency comes from

| Stage                                                    | Typical                                           |
| -------------------------------------------------------- | ------------------------------------------------- |
| React fader `onChange` → store                           | < 1 ms (pointer events fire about 60× per second) |
| Electron IPC, renderer → main (`ipcRenderer.send`)       | < 1 ms                                            |
| `serialport` write of one 518-byte packet over USB       | about 1 ms                                        |
| **FTDI latency timer** (Windows driver, default)         | **up to 16 ms**, tune it (below)                  |
| Waiting for the widget's next DMX frame (512 ch ≈ 44 Hz) | 0–23 ms                                           |
| Fixture processing, dimmer curves, smoothing             | varies, often 10+ ms                              |

That's roughly 20–40 ms from moving the fader to the light changing, which feels immediate for a fader. Hardware
consoles behave the same way, because the bottleneck is DMX itself: a full frame takes ~22.7 ms on the wire.

## What matters more than the stack

1. **Lower the FTDI latency timer.** Device Manager → Ports (COM & LPT) → the widget's COM port → Port Settings →
   Advanced → Latency Timer: change it from 16 to **1 or 2 ms**. This is the biggest single improvement, and no code
   can replace it.
2. **One buffer, full universe.** The Pro has no per-channel command (see above).
3. **Coalesce, don't send per event.** The engine marks the buffer as changed and sends it at most once per
   ~23 ms tick (`DMX_REFRESH_INTERVAL_MS` in `src/main/services.ts`), and only while no write is still in flight. Sending
   faster than the DMX frame rate only fills the widget's buffer; moving several faders at once still costs one packet
   per tick (`src/main/dmx/dmxEngine.ts`).
4. **Keep the serial port and the timing out of the window.** The DMX engine lives in the **main process**. Chromium
   slows down timers in hidden or minimized windows, which would break fades and chases. The renderer only shows the
   UI, and a crash there doesn't stop the output. The window also has `backgroundThrottling: false`, so the UI stays
   current while minimized.
5. **Re-render only the fader that moved.** Each `ChannelFader` subscribes to its own channel only
   (`selectChannelValue`), so 512 faders don't re-render on every move.

## Is Electron still the way to go in 2026?

For this app, yes. The options:

- **Electron + `serialport` (Node)**, the choice (ADR 1). Everything stays TypeScript, `serialport` is mature, and
  its N-API prebuilds load in Electron without a compiler. electron-vite gives Vite (HMR, the usual plugins)
  for main, preload and renderer. The downsides are the usual ones: an installer of about 100 MB and higher RAM use.
  For a lighting tool that doesn't matter.
- **Tauri 2**: much smaller installers and less memory, with the same React frontend. But the serial and timing code
  would be Rust, using the `serialport` crate or a Tauri serial plugin. The Rust part would be around 100 lines. Worth
  it if size matters or you want to learn some Rust.
- **Web Serial API in Chrome/Edge, no wrapper**: the Pro is a normal COM port, so a plain web page in Chrome or Edge
  can talk to it directly. Good for a quick prototype, but every session needs a new port permission, and timers slow
  down in background tabs. Not something to run a show on.
- **Wails (Go), Neutralino**: workable, but they add nothing here.

The split between UI and engine keeps the options open: the `DmxEngine` in the main process owns the universe, the
port and the chase timing with its fades, and the UI talks to it only over the narrow IPC API in `src/shared/`. Adding
Art-Net/sACN output (another `DmxPortConnector`), or moving the engine to Tauri, doesn't touch the UI.

## Open questions

- **What happens on quit?** Resolved (#39). The widget keeps sending the last universe as long as it has USB power,
  even after the app closes the port. Quitting holds the quit until the port is closed (`main/quit/quitGuard.ts`, at
  most 2 s, so a hanging port can't keep the app open). The setting **Black out on quit** (off by default) sends an
  all-zero universe first, bypassing the tick, and waits until it has been written. An unplugged widget or a crash of
  the main process still leaves the rig with its last look.
- **Fades and chases** run on the engine's refresh tick in the main process (chases and their step fades since #73 and
  #107; fades for faders, presets and scenes will too). `setInterval` there has a jitter of a few ms, which is fine for
  lighting; a fade's values come from the clock, so a late tick doesn't stretch it. If it ever isn't, move the engine to a `utilityProcess` or a worker
  thread.
