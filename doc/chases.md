# Chases

Status: **built** (#69: #70 to #76; fade in #107). The Help view's manual explains chases to the operator.

## What a chase is

A chase is a named sequence of **steps** that the app plays one after the other. Each step sets the values of some DMX
channels, optionally **fading in** to them, and then **holds** for its time before the next step starts. When the last
step's hold is over, the chase is finished, unless it repeats.

Typical uses: a laser and a strobe taking turns, a slow color change over several PARs, a "chorus" look that flips
between two states eight times and then ends.

A step without a fade sends its values at once; one with a fade moves its channels there in a straight line first
(see [Fade in](#fade-in)).

The UI calls it **Chase** in English and German, the term console users know (QLC+, ChamSys, grandMA's chaser). A
"macro" on those consoles is a recorded series of commands, not a sequence of lighting states.

## Terms

| Term   | Meaning                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------- |
| Step   | A set of `(channel, value)` pairs, absolute DMX addresses 1–512, plus a fade in and a hold time           |
| Fade   | How long a step's channels move from what they held to the step's values, before its hold. 0: at once     |
| Hold   | How long a step stays before the chase moves to the next step. Part of the chase, set while editing       |
| Pause  | An operator action while the chase plays: the clock stops, the current step stays. Not the same as a hold |
| Stop   | An operator action (or Emergency off, a project switch): the chase is no longer running, the values stay  |
| Repeat | What happens after the last step: end (play once), play N times, or loop until stopped                    |
| Pass   | One run through all steps                                                                                 |

**Hold vs. pause:** the hold is designed into the chase ("step 2 lasts 0.5 s"), the pause is pressed live ("wait, the
singer is talking"). A paused chase doesn't count down its fade or hold. A step lasts its fade plus its hold; a pass
the sum of them over all steps.

## Behavior

### Values

- A step only sets the channels it names. **Every other channel stays as it is**: the previous step's values, a fader
  the operator moved, a scene. There is no release to a "before the chase" state.
- A step stores **values per absolute channel**. It knows nothing about fixtures, offsets, presets or scenes once it is
  saved. Moving, editing or deleting a fixture doesn't change a chase.
- Because of that, a step's values are **not checked against the channel value rules** (range, steps, positions) of a
  fixture on that address: a chase may send 37 to a channel whose fader only stops at 0, 64 and 128.
- **Locked channels stay capped**: a chase's values go through `DmxEngine.setChannel` like a fader's, so a channel
  under the channel lock (ADR 3) never gets more than its cap, whatever the step says. Lifting the lock mid-step
  doesn't raise the value (as with faders today): the channel gets the step's value the next time a step sets it.

### Fade in

- **From where:** each channel the step names fades from the value in the universe when the step begins: the previous
  step's value, a fader moved by hand or a scene. For step 1 it is whatever was there at Start; when the chase loops,
  the last step's values. Channels the step doesn't name stay as they are.
- **Linear, from the clock:** on every engine tick during the fade the player sets
  `round(from + (to - from) * elapsed / fade)` through `DmxEngine.setChannel`. The value comes from the clock, not from
  the previous tick, so a late tick doesn't stretch the fade, and a step that begins late lands partway along the line.
  When the fade ends, the channel has exactly the step's value; the step before always ends at its values before the
  next one takes its snapshot.
- **Resolution:** at one universe per 23 ms tick, a 1 s fade has about 43 frames: from 100 to 255 rises 3 to 4 values
  per frame. Only a fade longer than about 3.5 s hits every value in between.
- **Faders during a fade:** a channel the fade moves is set again on every tick, so a fader moved by hand on it is
  overwritten (and pushed back to the renderer) until the fade ends. Other channels, and the step's channels during its
  hold, stay live as before.
- **Channel lock (ADR 3):** the target is taken with `DmxEngine.cappedValue` when the step begins. Lifting the lock, or
  saving a fixture that removes the cap, during the fade never raises a capped channel: it stays at its cap until the
  next step sets it. A cap added during the fade (the lock turned on, a fixture saved) applies at once, since
  `capUniverse` caps the universe and every faded value goes through `setChannel`.
- **Stalled tick:** a tick so late that it skips steps applies the skipped ones in full, fading steps too, as before; a
  fade's middle values are never sent late. Then the current step begins and fades from there. After a stall longer
  than a pass, the steps of the pass before have landed, the current step's own values among them.
- **Reports:** a faded channel is pushed over `dmx:channels-changed` only on a tick where its value changed, all
  channels of a tick in one message. The status changes per step, never per tick.

### Running

- **One chase at a time.** While a chase runs or is paused, the other rows look dimmed, but their Start still works:
  it stops the running chase and starts the new one in the same tick, with no gap.
- **Faders stay live** while a chase runs. A value set by hand stays until a step sets that channel again; then the
  step wins.
- Applying a step writes all its values into the universe in one go, so they leave in the same packet (ADR 2).
- **Start** always starts at step 1, first pass.
- **Pause** keeps the current step and the values; a fade stops where it is. **Resume** continues the same step with
  the time that was left (paused 0.3 s into a 1 s step: 0.7 s more), the rest of the fade first, then the full hold. It
  doesn't send the step's values again: a fader moved during the pause keeps its value until the next step sets that
  channel. The exception is a channel still fading: it goes back onto the line of its fade with the next tick.
- **Stop** ends the chase; the values stay as they are, also in the middle of a fade. A stopped chase can be started
  again (from step 1), or another chase can be started.
- **Finished**: a chase that doesn't repeat ends after the last step's hold, like a stop. Its row goes back to normal,
  nothing marks it as done.
- **Stops by itself on**: Emergency off (before the blackout, so no step comes after it), opening or creating another
  project, quitting the app, saving a change to the running chase or deleting it in Setup mode (editing another chase
  doesn't).
- **Doesn't stop on**: switching between Show and Setup mode, the idle timer locking the app, turning the channel lock
  on or off, the DMX port disconnecting or failing (the chase keeps writing to the universe; it goes out once the port
  is back).
- The app always starts with no chase running.

### Where it runs

The player runs in **main**, next to the `DmxEngine` (ADR 2): a hidden window, a render error or a busy renderer never
delays or stops a step. The renderer only sends start, pause, resume and stop with the chase's id; main plays the chase
as it is saved in the open project, not a copy the renderer sends.

Timing is checked on the engine's 23 ms tick, so a step starts at most one tick late. Each step's time counts from
when it should have started, not from when the tick saw it, so the lateness doesn't add up over a long loop. A tick that
stalls past several steps writes all of them into the same packet, in order (at most one pass), so the channels end as
if every step had played.

## Show mode

Chases are listed in the Show view below the fixture groups, one row per chase, full width and low, in their saved
order.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ▶  Chorus flash            ● ○ ○ ○        step 1 / 4 · pass 3 / 8   ⏸   ■    │   running: highlighted
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────┐
│ ▶  Laser intro             ○ ○ ○ ○ ○ ○                          ∞            │   dimmed while another runs
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────┐
│ ▶  Slow colors             ○ ○ ○                                1×           │
└──────────────────────────────────────────────────────────────────────────────┘
```

Each row shows:

- the name
- Start (when not running), Pause / Resume and Stop (when running or paused)
- the steps as small boxes, the current one filled (also during its fade), each showing its fade and hold on hover. The
  boxes get narrower to fit the row; below a minimum width (4 px) the row only shows `step 12 / 100` while the chase
  plays, `100 steps` otherwise
- the repeat: `1×`, `8×` or `∞`, and while running or paused the current pass (`pass 3 / 8`, `pass 3` for `∞`; none for
  a chase played once)

The running or paused row is highlighted (paused distinguishable from running); the others look dimmed, their Start
still replaces the running chase.

Show mode can start, pause, resume and stop chases. It can't change them.

Only the chase rows show that a chase runs: nothing in the top bar or the window title, even when the rows are scrolled
out of view below the fixtures. Chases are started, paused and stopped with the mouse only, there are no keyboard
shortcuts.

## Setup mode

Each row also has **Move up** and **Move down**, **Edit** and **Delete** (asks first), like the fixtures; they are
disabled while the chase editor is open. An **Add chase** button sits below the list, shown in Setup mode even when the
project has no chases yet; the editor opens below it.

### The chase editor

- **Name** (required, at most 40 characters like a scene's). No color: a chase row is told apart by its name and its
  steps
- **Repeat**: Once · N times (N ≥ 2, N passes in total: "3 times" plays the steps three times) · Until stopped
- **Steps**, in order, one tab each, numbered and marked when something is wrong with the step (its problems on
  hover), with **Add step** after the last tab. Each step's panel has:
  - its own **fade in**, in seconds with two decimals: 0 (the values at once, also for an empty field) up to 3600 s
  - its own **hold time**, in seconds with two decimals: at least 0.05 s (about two engine ticks), at most 3600 s
  - its **values**: a table with the columns Ch · Channel · Value · ✕, its rows grouped under a heading per fixture
    using their addresses (the fixture's name once, a button removing all its rows), a shared address under each of
    its fixtures, addresses of no fixture under **Unassigned**. A row shows the channel's name with a dot in its color
    (the dot's slot stays without a color, so the names align), the value with a thin bar in that color (neutral
    without one, display only) and the name of a named position the value is on. The grouping is only a label: a step
    stores addresses. The rows are sorted and regrouped once a channel field is left, not while it is typed; a
    problem of a row (an invalid channel or value, a channel set twice) is marked on it, the step's own problems below
    the table. An empty step shows a hint instead of the table; **Add channel** below it adds a single channel by hand
  - the **Fill from** panel beside the table (above it below 900 px, compact; sticky while a long step is scrolled).
    Each button **merges** into the step: a channel the step already sets takes the new value, a new channel is added,
    the others stay. Taking several scenes or presets builds a step up. Hovering or focusing a button tints the rows
    it would change and says how many it adds and changes; after a click the changed and added rows flash:
    - **Current values**: **All**, and a button per fixture; all channels of it with the values they have now
    - **Scenes**: a button per scene, as in the Show view; its values, turned into absolute channels at the time of
      taking
    - **Presets**: the presets' buttons under the name of their fixture; the preset's values on its fixture's
      addresses
  - the step's header: Fade in and Hold on the left; move left / move right (the tab's place), duplicate (the copy's
    tab is shown) on the right, delete (the next tab is shown) set apart from them
- **Add step** appends an empty step with the fade and hold of the last step (no fade and 1 s for the first one) and
  shows its tab; at most 100 steps. Duplicate copies a step with its fade, hold and values right after it.
- The **All steps** panel sets the fade in or the hold of every step at once (**Fade in [ X ] s [Set]**, **Hold [ X ] s
  [Set]**), and adds or removes a channel in every step.
- A step needs at least one channel; a chase at least one step.

Save and Cancel stay at the bottom of the view while the editor is open. Saving follows the other editors: the whole project is written to its file first and only then shown; a failed save
keeps the editor open with the error. Enter in the name field saves, Escape cancels. Saving a change to the running chase
or deleting it stops it; main compares the chase as saved before and after, so saving it unchanged, saving a fixture or
reordering the chases lets it play on.

## Data

Stored in the project's `.glp`, as an optional `chases` list next to `fixtures` and `scenes`, so older files load
unchanged. There are no users with project files yet, so `PROJECT_VERSION` stays at 1.

```ts
const ChaseStepSchema = Type.Object({
  id: Type.String({minLength: 1}),
  /** how long the step's channels fade to its values, in milliseconds; missing is 0 (older files) */
  fadeMs: Type.Optional(Type.Integer({minimum: 0, maximum: CHASE_FADE_MAX_MS})),
  /** how long the step stays before the next one, in milliseconds */
  holdMs: Type.Integer({minimum: CHASE_HOLD_MIN_MS, maximum: CHASE_HOLD_MAX_MS}),
  values: Type.Array(Type.Object({channel: DmxChannelSchema, value: DmxValueSchema}), {minItems: 1})
});

const ChaseSchema = Type.Object({
  id: Type.String({minLength: 1}),
  name: Type.String({minLength: 1, maxLength: CHASE_NAME_MAX_LENGTH}),
  repeat: Type.Union([
    Type.Object({type: Type.Literal('once')}),
    Type.Object({type: Type.Literal('times'), count: Type.Integer({minimum: 2, maximum: CHASE_REPEAT_MAX})}),
    Type.Object({type: Type.Literal('forever')})
  ]),
  steps: Type.Array(ChaseStepSchema, {minItems: 1, maxItems: CHASE_STEPS_MAX})
});
```

Limits: `CHASE_NAME_MAX_LENGTH` 40, `CHASE_HOLD_MIN_MS` 50, `CHASE_HOLD_MAX_MS` 3 600 000, `CHASE_FADE_MAX_MS`
3 600 000, `CHASE_REPEAT_MAX` 99, `CHASE_STEPS_MAX` 100. `fadeMs` is optional, so files from before fades load
unchanged; the editor leaves it out for a fade of 0, so saving such a chase unchanged leaves the file as it was. 0.4.0
reads a file with fades too, but loses them if it saves it. The number of chases in a project isn't limited.

Validation (`shared/chases.ts`, codes like `SceneError`): name missing or too long, no steps, a step without values, a
channel twice in one step, a channel or value out of range, a hold or a fade out of range (`chase-step-fade-invalid`), too many steps, a repeat count out
of range, ids twice. Unlike scenes, nothing
refers to a fixture, so a fixture change never makes a chase invalid.

## IPC and status

- `chase:get-status`: the renderer asks once on load, then follows the pushes
- `chase:start` (id), `chase:pause`, `chase:resume`, `chase:stop`: `invoke`, allowed in Show and Setup mode
- `chase:status-changed` pushed by main: `idle`, or `running` / `paused` with the chase id, step index and pass. Sent
  on every step change, not on every tick
- `dmx:channels-changed` pushed by main: the values a step set (after the caps), so the faders, fixture and raw, show
  what goes out. Today the renderer is the only one changing values and updates its store itself; a chase is the
  first change coming from main. One message per step, and during a fade one per tick that changed a value
- Saving chases goes through the project save like fixtures and scenes, refused in Show mode

## Tests (what shows it's right)

- The player is a pure function of the chase and an injected clock: which step and pass at a given time. Tested with
  fake timers:
  - a once-chase plays every step once and ends after the last hold
  - an N-times chase plays exactly N × steps steps
  - a forever chase is still running after many passes, its steps not drifting
  - pause stops the clock, resume continues the same step
  - stop, Emergency off and a project switch end it, and no step is applied after them
- Engine: a step's values leave in one packet; a locked channel stays at its cap whatever the step says
- A recorded run on the `inMemory` port: the frames' timestamps against the expected step times, each within one tick
- On the rig: a two-step laser/strobe alternation at 0.5 s looks even and doesn't drift over a few minutes (#76)

## Also part of the change

- The Help view's manual has a tab on chases (what a chase is, hold vs. pause, what stops a chase and what
  doesn't, faders staying live, the values staying after a stop)
- German texts for everything new, a line under `Added` in `CHANGELOG.md`

## Not in this feature

Curves other than linear, fade out or per-channel fade times, BPM / tap tempo, several chases at once, a manual "go" step that waits for a button press,
keyboard shortcuts, a running chase shown in the top bar or the window title, starting a chase on app start.
