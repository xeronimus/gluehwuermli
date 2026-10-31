# Code Style Guidelines

How code is written in Glühwürmli. The frontend follows **my-life** (`~/Documents/git/my-life`): same libraries, same
rules. What the app is, its architecture and its project structure are in `CLAUDE.md`.

## Tooling and formatting

- **TypeScript strict mode**, with `noUnusedLocals` and `noUnusedParameters`.
- **Prettier** does all formatting (`.prettierrc`, the same as my-life's plus the `@shared/` and `@resources/` groups):
  - single quotes
  - no bracket spacing (`{a, b}`, not `{ a, b }`)
  - no trailing commas
  - print width 120
  - 2 spaces indentation
  - LF line endings
- **Import order** (sorted by the Prettier plugin): `react` > third-party packages > `@shared/` > `@resources/` > `@/` >
  relative imports.
- **Path alias:** `@/` is the source root of the current process (main or renderer). Use it for imports that cross two
  or more directory levels (`../../` and deeper); keep `./` and `../` otherwise. `scripts/normalizeImports.mjs` rewrites
  them, run by `pnpm format`.
- **One script for "done":** `pnpm ft` runs format, typecheck and tests. Run it before considering any task complete.

## Clean code

- **Meaningful names.** No abbreviations or single-letter names outside short loops.
- **Small, focused units.** If a section needs a comment to explain _what_ it does, extract it into a named function.
  Comments explain _why_.
- **No magic numbers or strings.** Named constants; DMX ranges (universe size, channel and value ranges) live in
  `src/shared/dmx.ts`.
- **DRY, but not prematurely.** Extract only when a pattern appears three times and the abstraction is obviously right.

## SOLID, adapted for React and TypeScript

- **Single responsibility** for components, hooks and services.
- **Open/closed:** extend by composition (a new `DmxPortConnector`, a new hook) rather than modifying stable code.
- **Liskov substitution:** implementations of an interface (`DmxPortConnector`, `DmxService`) honour its contract fully.
- **Interface segregation:** narrow props and service interfaces.
- **Dependency inversion:** components and the engine depend on interfaces, not on `serialport` or `window`.

## TypeScript discipline

- **Discriminated unions over optional fields** (see `DmxOutputStatus`).
- **No type assertions (`as`).** Write a type guard or a schema check instead. (`as const` is fine.)
- **No non-null assertions (`!`).** Handle nullability with early returns or optional chaining.
- **No `any`.** Use `unknown` plus a check at the boundary; IPC payloads and stored JSON go through the TypeBox
  `parse*` guards.
- **`readonly`** for data flowing from the store into components.

## React

- **`useEffect` is for external sync only** (the status subscription, listing ports); never to derive state.
- **No premature memoisation.** No `useMemo`/`useCallback` by default.
- **No boolean prop explosion:** use a variant (`Button`'s `variant`).
- **Custom hooks for logic:** async actions live under `state/actionHooks/`, not inside components.
- **Small components:** split a component that grows beyond ~150 lines.
- **Error boundaries around each view** (`App.tsx`).
- **Icons** only through `components/commons/icons.ts`, never imported from `@tabler/icons-react` directly.

## State (Zustand)

- **Stores built with `combine()`**, state and actions together.
- **No derived data in the store:** Reselect selectors instead.
- **Select narrowly:** a component subscribes to the smallest slice it needs.
- **Pure logic outside the store:** in `data/`, which never imports `state/` or `components/`.

## Styling (Vanilla Extract)

- **Colocate styles:** a `.css.ts` next to every `.tsx` with layout. No inline style objects; react-range's own
  positioning `style` is passed through, that's the exception.
- **Theme tokens** in `components/themes.css.ts`; components use the tokens, not raw values.
- **Variants** with `styleVariants` or recipes, not per-property booleans.

## Electron

- **Security defaults stay on:** `contextIsolation`, `sandbox`, no `nodeIntegration`, the CSP in `index.html`.
- **Nothing timing-critical in the renderer:** timers for DMX (refresh, later fades and chases) live in the main process.
- **New IPC = shared first:** add the channel to `ipcChannels.ts`, the payload schema to `ipc.ts`, the method to
  `DmxBridge`, then preload, handler and renderer service.
- **Runtime-loaded packages are `dependencies`**, bundled ones `devDependencies`.

## Testing (Vitest)

- **Test logic, not components.** Extract logic into pure functions and unit test those.
- **Fakes at the service boundary:** pass fakes (`inMemoryConnectorFactory`, the `inMemory` services) into the
  factories rather than mocking modules.
- **Deterministic tests:** fake timers for the tick, no real clock.
- **Cover the boundaries:** a happy path and an error or edge case for each new action or function.

## Module hygiene

- **No barrel `index.ts`** in feature folders.
- **No circular imports.**
- **Feature folders don't import each other's internals;** shared pieces go to `components/commons/`.
- **Layer imports** follow the rules in `CLAUDE.md`, enforced by `src/architecture.test.ts`.

## Error handling

- **No silent catch blocks:** action hooks log and surface errors (`outputError`, `fixturesError`).
- **Expected failures are values**, not exceptions (see `CLAUDE.md`).
- **Log through loglevel:** `data/service/Logger.ts` in the renderer, `src/main/log.ts` in main; no `console.*`.

## Commits and branches

- **Branches** are named `<issuenr>-description`, e.g. `1-add-fixtures`.
- **Reference the issue** in the commit message (e.g. `Refs #12`). Small tweaks without their own issue use `Refs #7`,
  the chore issue that is never closed.

## Post-task review

After each larger task, check:

1. No new `any`, `as` or `!`.
2. No component over ~150 lines.
3. New logic in pure functions with at least a smoke test.
4. Duplicated logic extracted or noted as a follow-up.
5. `pnpm ft` passes.
