# 3. Show mode is enforced in the main process

Date: 2026-10-31

## Status

Accepted

## Context

The BeamZ LightBox5 has a red and a green laser. Where it can't be mounted 3 m high, the laser has to stay off for the
whole event, while guests and kids are near the laptop. Before this, anyone at the laptop could switch it on: a preset,
a fixture fader, a raw fader on its address, the Macro channel (its own programs drive the laser too), or by editing
the fixture.

Hiding controls in the renderer is not enough: the raw faders reach every address, a preset or a future scene or chase
sets channels without a fader, and the renderer is not trusted (ADR 2).

## Decision

- Two **independent locks**, both on after every start:
  - the **mode**: in **Show mode** fixtures can be played, not changed. **Setup mode** is unlocked with a password
    and returns to Show mode with the Lock button, after 10 minutes without input, and on restart.
  - the **channel lock**: caps the locked channels. Lifting it needs the password in Show mode (a confirmation in
    Setup mode, where the password was just typed). It stays lifted, also in Show mode, until it is turned on again
    or the app restarts: whether the laser is allowed is decided once per event, and the idle timeout of Setup mode
    must not switch it off in the middle of a show.
- An **`AppLock`** (`src/main/lock/appLock.ts`) in the main process owns the mode, the channel lock, the password
  check and the idle timer. The password is stored as a salted scrypt hash in `settings.json` in `userData`; a missing
  or invalid file means no password yet, and deleting it resets a forgotten password. A wrong password answers after a
  delay.
- A fixture channel can declare a cap, `"lock": {"max": 0}`. The **`DmxEngine`** caps every `setChannel` per DMX
  address while the limits are enforced, whichever view or feature sent the value, and caps the universe right away
  when they turn on. They are on from the engine's creation; only the password lifts them.
  The caps follow the fixture setup: loaded before the window opens, updated after every save.
- The main process refuses what Show mode doesn't allow (`fixtures:save`, opening the data folder, lifting the channel
  lock without the password). The renderer mirrors the status it is pushed (`app:lock-changed`) and only disables and
  hides; the controls are in a Settings view, the top bar only reminds while something is unlocked. It reports user
  input every 30 s at most, so the idle timer in main knows the user is still there.

## Consequences

- A render error, a hidden window or a renderer bug can't switch the laser on through the app, nor keep Setup mode
  open.
- Scenes, fades and chases (planned) are capped without any extra work, as long as they go through `setChannel`.
- This guards against guests and mistakes, not against someone with access to the laptop's files or another DMX app.
  Ways the laser comes on without DMX (its remote, its own menu, no DMX signal) need physical measures, described in
  the manual.
