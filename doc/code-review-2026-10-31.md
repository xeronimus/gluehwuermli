# Code review 2026-10-31

The whole codebase (`src/` main, preload, shared, renderer and their tests, `scripts/`, build and test configs)
checked against `CODE_STYLE.md`, `CLAUDE.md` and ADRs 1–2. Medium strictness: clear violations, plus
inconsistencies that will cost something later.

**Sizes:** **S** under an hour · **M** half a day · **L** one to two days · **XL** more.
**Priority:** **P1** do next · **P2** soon, before the next feature in that area · **P3** when you're in that code.

## Summary

The code follows its rules closely. There are no `as` assertions, no `!`, no written `any`, no deep relative imports,
no cross-feature imports and no barrels. Every component is under 150 lines and every IPC payload is validated in
main. The layer rules are enforced by `architecture.test.ts`, the security defaults are on, and only `serialport` is
a runtime dependency. Nothing breaks a **must** rule.

The findings are mostly about four things: one latent race in the engine, test coverage of the action hooks (the
"stored first" rule has no test), untyped IPC responses, and docs or rules that no longer match the code.

| #   | Prio | Size | Severity | Finding                                                                      |
| --- | ---- | ---- | -------- | ---------------------------------------------------------------------------- |
| 1   | P1   | S    | 🟠       | Overlapping `connect` calls leave a port open or fail with "Access denied"   |
| 2   | P1   | M    | 🟠       | Action hooks untested, including the "fixture changes are stored first" rule |
| 3   | P2   | S    | 🟠       | IPC responses are `any`; the response schemas are never used                 |
| 4   | P2   | S–M  | 🟠       | "Theme tokens, not raw values" doesn't hold for spacing and font sizes       |
| 5   | P2   | S    | 🟠       | Docs drift: the env-reading rule, the project structure list                 |
| 6   | P2   | S    | 🟠       | Status subscription: service call in `components/`, a failure is only logged |
| 7   | P3   | S    | 🟢       | Both file stores duplicate the JSON and atomic-write code                    |
| 8   | P3   | S    | 🟢       | Four identical `*Log` interfaces, three identical `*StateSetter` types       |
| 9   | P3   | M    | 🟢       | IPC handlers untested, bound to `ipcMain` and the `log` singleton            |
| 10  | P3   | S    | 🟢       | Feature-folder and circular-import rules aren't enforced by a test           |
| 11  | P3   | S    | 🟢       | `FixtureNotesFields` borrows `FixtureEditor.css`                             |
| 12  | P3   | S    | 🟢       | Preset naming state: two variables instead of a union                        |
| 13  | P3   | S    | 🟢       | `'SIMULATED'` port path defined twice                                        |
| 14  | P3   | M    | 🟢       | `readonly` stops at the fixture list, fixtures themselves are mutable        |
| 15  | P3   | S    | 🟢       | `window.confirm` called directly in a component                              |

Suggested order: 1 → 2 → 5 → 3 → 6 → 4, then the 🟢 items when you touch the code. Do 7 before the scenes store,
which would be the third copy.

## 🔴 Critical (must)

None.

## 🟠 Important (should)

### 1. Overlapping `connect` calls leave a port open or fail with "Access denied"

- **Rule:** expected failures are values, and the engine owns the port (ADR 2). `connect` is documented as "closes
  the current port first".
- **Where:** `src/main/dmx/dmxEngine.ts:97-122`
- **Evidence:** `connect` closes the current connection before awaiting `connector.open`, but nothing stops a second
  `connect` (or a `disconnect`) from starting while the first is still opening. Both then assign `connection`:
  - **Different ports:** the first port stays open but is no longer tracked. On Windows the COM port stays locked
    until the app quits.
  - **The same port twice (a double click):** the second open fails with "Access denied", which then closes the first
    and ends in `failed`.
  - **`disconnect` while connecting:** it is overwritten by the late `connected`.

  The UI disables Connect while `connecting`, but that status arrives over IPC, so a fast double click gets through.
  It also becomes easy to hit with any later auto-reconnect.

- **Why it matters:** a locked port or a spurious failure in the middle of a show, and the engine's state no longer
  matches the open handle.
- **Fix (S):** run connect and disconnect one after the other with the existing `createSerialQueue`, and add a test
  with an in-memory connector that counts opens and closes.

  ```diff
  +import {createSerialQueue} from '@shared/serialQueue';
  ...
  +  // a second connect or a disconnect waits until the port being opened is tracked, so it can be closed
  +  const runSerially = createSerialQueue();
  -  const connect = async (path: string): Promise<DmxOutputStatus> => {
  +  const connect = (path: string): Promise<DmxOutputStatus> => runSerially(async () => {
       ...
  -  };
  +  });
  -  const disconnect = async (): Promise<DmxOutputStatus> => {
  +  const disconnect = (): Promise<DmxOutputStatus> => runSerially(async () => {
       ...
  -  };
  +  });
  ```

### 2. Action hooks untested, including the "fixture changes are stored first" rule

- **Rule:** Testing: cover the boundaries, with a happy path and an error case for each new action; fakes at the
  service boundary. Architecture: fixture changes are stored first.
- **Where:** `src/renderer/src/state/actionHooks/*.ts`. None of the seven hooks has a test.
  `inMemoryFixtureServiceFactory` and `inMemoryDmxServiceFactory` say they are "for a test", but no test uses them.
- **Evidence:** `useStoreFixtures` (`saveFixtures.ts:20-38`) carries one of the architecture patterns in `CLAUDE.md`:
  save first, then update the store, and on failure set `fixturesError` and leave the setup unchanged. It also
  serialises saves so none gets lost. None of this is checked. The same goes for `connectOutput` (failure ends in
  `outputError`) and `loadPorts` (preselects a port, clears the error).
- **Why it matters:** these hooks are where the documented behaviour lives. A refactor that updates the store before
  the save resolves would still pass `pnpm ft`.
- **Fix (M):** move each hook's body into a plain function that takes the store and the service, keep the hook as a
  one-line wrapper, and test the function with the in-memory services and a failing fake.

  ```diff
  +// state/fixtures/storeFixtures.ts
  +export const storeFixturesWith =
  +  (store: StoreApi<AppStore>, service: FixtureService, runSerially: SerialQueue) =>
  +  (change: (fixtures: readonly Fixture[]) => Fixture[], failure: string): Promise<boolean> =>
  +    runSerially(async () => { ... });   // the body of useStoreFixtures, unchanged
  ```

  Tests to add: a failed save leaves `fixtureSetup` unchanged and sets `fixturesError`; two overlapping saves both
  end up stored; a failing `connect` sets `outputError`.

### 3. IPC responses are `any`; the response schemas are never used

- **Rule:** no `any`, use `unknown` plus a check at the boundary. Narrow IPC contract with "a TypeBox schema per
  payload".
- **Where:** `src/preload/index.ts:11-16, 22`. `DmxOutputStatusSchema` and `SerialPortDescriptionSchema` in
  `src/shared/ipc.ts:25-38` are only used for their types.
- **Evidence:** `ipcRenderer.invoke` returns `Promise<any>`, which is silently accepted as `Promise<DmxOutputStatus>`
  and the other bridge types. The status listener annotates an untyped argument as `status: DmxOutputStatus`. Neither
  the compiler nor a runtime check would notice if a main handler started returning something else.
- **Why it matters:** main is trusted, so this isn't a security problem. It is a contract the typecheck pretends to
  check but doesn't. The fixture setup is the payload most likely to change shape (scenes).
- **Fix (S):** add a response type per channel next to `IpcChannel` and a small typed `invoke` in the preload, so the
  single `any` sits in one place and a changed handler fails the typecheck. Optionally (M), check `DmxOutputStatus`
  in the renderer's electron factories with a `parseDmxOutputStatus` guard, since it arrives on every status push.

  ```diff
  +// shared/dmxBridge.ts (types only, the preload stays free of TypeBox)
  +export interface IpcResponses {
  +  [IpcChannel.LIST_PORTS]: readonly SerialPortDescription[];
  +  [IpcChannel.CONNECT]: DmxOutputStatus;
  +  ...
  +}
  +// preload: the one place the untyped result is narrowed
  +const invoke = <C extends keyof IpcResponses>(channel: C, ...args: unknown[]): Promise<IpcResponses[C]> =>
  +  ipcRenderer.invoke(channel, ...args);
  ```

### 4. "Theme tokens, not raw values" doesn't hold for spacing and font sizes

- **Rule:** Styling: theme tokens in `components/themes.css.ts`; components use the tokens, not raw values.
- **Where:** every `.css.ts`. Examples: `fontSize: '0.9em'` or `'0.85em'` appears 12 times, `fontWeight: 600` 5 times,
  and the gaps use eight different px values. `components/global.css.ts:9` repeats `#121110` by hand, with a comment
  saying so.
- **Evidence:** colours, radii, fonts and fader sizes come from `vars`; spacing and type sizes never do.
- **Why it matters:** either the rule or the code is wrong. As it stands, the next review flags every new `gap`.
- **Fix:** rule first, then the cheap tokens.
  - **(S)** Narrow the rule in `CODE_STYLE.md` to "colours, radii, fonts and repeated sizes".
  - **(S)** Add `fontSizes` (`small: '0.85em'`, `secondary: '0.9em'`) and `fontWeights.bold` and use them.
  - **(S)** Export the plain `colors` object from `themes.css.ts` and use `colors.background` in `global.css.ts`, so
    the hand-kept copy goes away.
  - **(M)** A spacing scale only if you want one. With ~8 distinct values it isn't pressing.

  ```diff
  -const colors = {
  +export const colors = {
  ...
  -  background: '#121110',
  +  background: colors.background,
  ```

### 5. Docs drift: the env-reading rule, the project structure list

- **Rule:** the docs describe the code (`CLAUDE.md` is the source of truth for the structure).
- **Where and evidence:**
  - **The env rule:** `CLAUDE.md` and the comment in `src/main/config.ts:2` say config.ts is "the only module reading
    the environment". `src/main/index.ts:46` reads `process.env['ELECTRON_RENDERER_URL']`.
  - **The `data/` list:** the list in `CLAUDE.md` is missing `fixtureOverlaps`.
  - **Main files:** `src/main/log.ts` and `env.d.ts` aren't listed, although `CODE_STYLE.md` points to `log.ts`.
- **Why it matters:** the next change follows the doc, not the code.
- **Fix (S):** move the dev server URL into `MainConfig` (`devServerUrl: string | undefined`, read in `loadMainConfig`
  and tested like `simulatedOutput`). That keeps the rule true instead of weakening it. Then update the structure
  list.

### 6. Status subscription: service call in `components/`, a failure is only logged

- **Rule:** async actions live under `state/actionHooks/`. No silent catch blocks: action hooks log **and surface**
  errors.
- **Where:** `src/renderer/src/components/output/useOutputStatusSubscription.ts:13-16`
- **Evidence:** the only hook in `components/` that calls a service. If `getStatus()` fails, the error is logged and
  the bar keeps showing "Not connected", which may be wrong, with no `outputError`.
- **Fix (S):** move it to `state/actionHooks/outputStatusSubscription.ts` and surface the failure:

  ```diff
  -      .catch((error: unknown) => logger.error('reading the output status failed', error));
  +      .catch((error: unknown) => {
  +        logger.error('reading the output status failed', error);
  +        setOutputError('Could not read the output status');
  +      });
  ```

## 🟢 Improvements (nice-to-have)

### 7. Both file stores duplicate the JSON and atomic-write code

- **Rule:** DRY at the third occurrence; post-task review step 4: extract it or note it as a follow-up.
- **Where:** `src/main/fixtures/impl/file/fileFixtureStoreFactory.ts:21-31, 81-86` and
  `src/main/window/impl/file/fileWindowStateStoreFactory.ts:18-29, 59-64`
- **Evidence:** `JSON_INDENT`, `isMissingFile`, `parseJson` and the serialised write-to-`.tmp`-then-rename are
  identical. That makes two copies; the planned scenes store would be the third.
- **Fix (S):** before the scenes store, add `src/main/storage/jsonFile.ts` with `readJsonFile(path)`, returning
  `{type: 'missing'} | {type: 'read'; content: unknown}`, and `atomicJsonWriter(path)`. Each store keeps its own
  policy for invalid files.

### 8. Four identical `*Log` interfaces, three identical `*StateSetter` types

- **Rule:** DRY (three or more occurrences, and the abstraction is obvious).
- **Where:**
  - **Log interfaces:** `DmxEngineLog` (`dmxEngine.ts:7`), `FixtureStoreLog` (`fileFixtureStoreFactory.ts:9`),
    `WindowStateStoreLog` (`fileWindowStateStoreFactory.ts:8`), `PersistWindowStateLog` (`persistWindowState.ts:17`).
  - **Setter types:** `ChannelsStateSetter`, `FixturesStateSetter` and `OutputStateSetter` in `state/*/*Actions.ts`.
- **Fix (S):** a `Log` type in `src/main/log.ts` (`Pick<Logger, 'debug' | 'info' | 'warn'>`), with each dependency
  narrowing to what it needs, and a generic `StateSetter<S>` in `state/`.

### 9. IPC handlers untested, bound to `ipcMain` and the `log` singleton

- **Rule:** cover the boundaries; dependency inversion. The engine and the stores get `log` passed in, the handlers
  import it.
- **Where:** `src/main/ipc/registerDmxIpc.ts:14`, `registerFixtureIpc.ts:9`
- **Evidence:** the "validate, drop invalid ones" behaviour from `CLAUDE.md` lives here, and no test checks it.
- **Fix (M):** pass in an `IpcMainLike` (`on`, `handle`) and the `log`, then test with a fake: an invalid set-channel
  payload is dropped and logged, an invalid fixture setup rejects.

### 10. Feature-folder and circular-import rules aren't enforced by a test

- **Rule:** Module hygiene: no circular imports; feature folders don't import each other's internals.
- **Where:** `src/architecture.test.ts`. Both rules hold today (checked by grep).
- **Fix (S):** add a test that files in `components/<feature>/` import only their own folder, `commons/` and
  `themes.css`. Circular imports would need a small graph walk over `allImports` (S–M). Worth it only if a cycle ever
  appears.

### 11. `FixtureNotesFields` borrows `FixtureEditor.css`

- **Rule:** colocate styles, a `.css.ts` next to every `.tsx` with layout.
- **Where:** `src/renderer/src/components/fixtures/FixtureNotesFields.tsx:5`
- **Fix (S):** move `descriptionInput` and `hintInput` into `FixtureNotesFields.css.ts`. `field` is shared with the
  editor, so it can stay there or move to a `fixtureForm.css.ts`.

### 12. Preset naming state: two variables instead of a union

- **Rule:** discriminated unions over optional fields.
- **Where:** `src/renderer/src/components/fixtures/FixturePresetButtons.tsx:25-28`
- **Evidence:** `newPresetName: string | undefined` plus `saving: boolean` allow "saving without a name", which
  `canSave` then has to rule out.
- **Fix (S):** `{type: 'idle'} | {type: 'naming'; name: string} | {type: 'saving'; name: string}`

### 13. `'SIMULATED'` port path defined twice

- **Rule:** no magic strings, named constants in one place.
- **Where:** `src/main/dmx/impl/inMemory/inMemoryConnectorFactory.ts:3`,
  `src/renderer/src/data/service/impl/inMemory/inMemoryDmxServiceFactory.ts:5`
- **Fix (S):** `export const SIMULATED_PORT_PATH = 'SIMULATED'` in `src/shared/dmx.ts`, used by both.

### 14. `readonly` stops at the fixture list, fixtures themselves are mutable

- **Rule:** `readonly` for data flowing from the store into components.
- **Where:** `src/renderer/src/state/fixtures/FixturesState.ts:9` holds `readonly Fixture[]`, but `Fixture`
  (`src/shared/ipc.ts:87`) has mutable `channels` and `presets` arrays, so a component could push into them.
- **Fix (M):** a `ReadonlyFixture` type, or `Type.Readonly` on the schema arrays. That touches the pure functions'
  signatures, which is why it is an M.

### 15. `window.confirm` called directly in a component

- **Rule:** dependency inversion: components don't depend on `window`.
- **Where:** `src/renderer/src/components/fixtures/FixtureView.tsx:51`
- **Evidence:** it works in Electron, but blocks the renderer and can't be styled.
- **Fix (S, optional):** a `ConfirmButton` in `commons/` (click, then "Really delete?" inline), like the inline preset
  naming already does instead of `window.prompt`.

## Checked and compliant

- **TypeScript:** no `as` assertions (only `as const` and export renames), no `!`, no written `any`.
- **Imports:** no `../../` imports, no barrel `index.ts`, no cross-feature imports. Icons only through `icons.ts`
  (enforced).
- **Layers and composition roots:** both enforced by `architecture.test.ts`.
- **IPC:** every request payload has a schema and is validated in main. Fader moves are `send`, everything else
  `invoke`.
- **Engine:** the 23 ms tick coalesces changes, and failures are values (`failed`), as ADR 2 says.
- **Electron:** `contextIsolation`, `sandbox`, no `nodeIntegration`, the CSP (`unsafe-inline` styles documented for
  react-range). `serialport` is the only runtime dependency.
- **React:** every component is under 150 lines. `useEffect` is only used for external sync (port list, fixture load,
  status). There is no `useMemo` or `useCallback`, and `Button` has a variant instead of boolean props.
- **State:** Zustand with `combine` and Reselect selectors, no derived data in the store, and `ChannelFader` reads its
  own channel only.
- **Errors:** errors are logged through loglevel, with no `console.*` in app code. Error boundaries are around the bar
  and each view.
- **Tests:** the pure logic in `data/` and `shared/` is unit tested, the engine runs on fake timers with the
  in-memory connector, and the file stores are tested against a temp directory.
