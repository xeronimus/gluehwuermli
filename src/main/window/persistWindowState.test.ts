import type {WindowStateStore} from './WindowStateStore';
import {type TrackedWindow, WINDOW_STATE_SAVE_DELAY_MS, persistWindowState} from './persistWindowState';
import type {Rectangle, WindowState} from './windowState';

type Listener = (event: {preventDefault: () => void}) => void;

/** a window whose events the test fires itself */
function fakeWindow() {
  const listeners = new Map<string, Listener[]>();
  const fake = {
    bounds: {x: 10, y: 20, width: 800, height: 600},
    maximized: false,
    destroyed: false,
    defaultPrevented: false,
    fire: (event: string) =>
      listeners.get(event)?.forEach((listener) =>
        listener({
          preventDefault: () => {
            fake.defaultPrevented = true;
          }
        })
      )
  };
  const window: TrackedWindow = {
    on: (event: string, listener: Listener) => listeners.set(event, [...(listeners.get(event) ?? []), listener]),
    getNormalBounds: (): Rectangle => fake.bounds,
    isMaximized: () => fake.maximized,
    isFullScreen: () => false,
    destroy: () => {
      fake.destroyed = true;
    }
  };
  return {fake, window};
}

let saved: WindowState[];
let failSaves: boolean;
let warnings: unknown[][];
const store: WindowStateStore = {
  load: () => Promise.resolve(undefined),
  save: (state) => {
    saved.push(state);
    return failSaves ? Promise.reject(new Error('disk full')) : Promise.resolve();
  }
};

beforeEach(() => {
  vi.useFakeTimers();
  saved = [];
  failSaves = false;
  warnings = [];
});

afterEach(() => {
  vi.useRealTimers();
});

const persist = (window: TrackedWindow) =>
  persistWindowState(window, store, {warn: (...message) => warnings.push(message)});

test('saves once after moving and resizing settled', async () => {
  const {fake, window} = fakeWindow();
  persist(window);

  fake.fire('move');
  fake.bounds = {x: 30, y: 40, width: 900, height: 700};
  fake.fire('resize');
  await vi.advanceTimersByTimeAsync(WINDOW_STATE_SAVE_DELAY_MS - 1);
  expect(saved).toEqual([]);

  await vi.advanceTimersByTimeAsync(1);
  expect(saved).toEqual([{x: 30, y: 40, width: 900, height: 700, maximized: false, fullScreen: false}]);
});

test('closing saves right away, drops the pending save and only then destroys the window', async () => {
  const {fake, window} = fakeWindow();
  persist(window);

  fake.fire('resize');
  fake.maximized = true;
  fake.fire('close');
  expect(fake.defaultPrevented).toBe(true);
  await vi.advanceTimersByTimeAsync(WINDOW_STATE_SAVE_DELAY_MS);

  expect(saved).toEqual([{x: 10, y: 20, width: 800, height: 600, maximized: true, fullScreen: false}]);
  expect(fake.destroyed).toBe(true);
});

test('a failed save is logged and the window still closes', async () => {
  const {fake, window} = fakeWindow();
  persist(window);
  failSaves = true;

  fake.fire('close');
  await vi.runAllTimersAsync();

  expect(warnings).toHaveLength(1);
  expect(fake.destroyed).toBe(true);
});
