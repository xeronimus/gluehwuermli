import {type QuitEvent, quitGuardFactory} from './quitGuard';

const TIMEOUT_MS = 2000;

let quit: ReturnType<typeof vi.fn<() => void>>;
let warn: ReturnType<typeof vi.fn<(...message: unknown[]) => void>>;

const quitEvent = () => {
  const preventDefault = vi.fn<() => void>();
  const event: QuitEvent = {preventDefault};
  return {event, preventDefault};
};

/** a shutdown that finishes when the test says so */
const heldShutdown = () => {
  let finish = () => {};
  const shutdown = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  return {shutdown, finish: () => finish()};
};

beforeEach(() => {
  vi.useFakeTimers();
  quit = vi.fn<() => void>();
  warn = vi.fn<(...message: unknown[]) => void>();
});

afterEach(() => {
  vi.useRealTimers();
});

test('holds the first quit, shuts down, then quits for real', async () => {
  const {shutdown, finish} = heldShutdown();
  const onWillQuit = quitGuardFactory({shutdown, quit, timeoutMs: TIMEOUT_MS, log: {warn}});
  const first = quitEvent();

  onWillQuit(first.event);

  expect(first.preventDefault).toHaveBeenCalledOnce();
  expect(shutdown).toHaveBeenCalledOnce();
  expect(quit).not.toHaveBeenCalled();

  finish();
  await vi.advanceTimersByTimeAsync(0);

  expect(quit).toHaveBeenCalledOnce();
  expect(warn).not.toHaveBeenCalled();
});

test('a second quit while shutting down is held, without a second shutdown', async () => {
  const {shutdown, finish} = heldShutdown();
  const onWillQuit = quitGuardFactory({shutdown, quit, timeoutMs: TIMEOUT_MS, log: {warn}});
  onWillQuit(quitEvent().event);
  const second = quitEvent();

  onWillQuit(second.event);

  expect(second.preventDefault).toHaveBeenCalledOnce();
  expect(shutdown).toHaveBeenCalledOnce();

  finish();
  await vi.advanceTimersByTimeAsync(0);

  expect(quit).toHaveBeenCalledOnce();
});

test('a shutdown with nothing to do quits on a later task, not while the held quit is still handled', async () => {
  const onWillQuit = quitGuardFactory({shutdown: async () => {}, quit, timeoutMs: TIMEOUT_MS, log: {warn}});
  onWillQuit(quitEvent().event);

  // the microtasks that run before Electron finishes handling the will-quit
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
  expect(quit).not.toHaveBeenCalled();

  await vi.advanceTimersByTimeAsync(0);
  expect(quit).toHaveBeenCalledOnce();
});

test('the quit after the shutdown goes through', async () => {
  const onWillQuit = quitGuardFactory({shutdown: async () => {}, quit, timeoutMs: TIMEOUT_MS, log: {warn}});
  onWillQuit(quitEvent().event);
  await vi.advanceTimersByTimeAsync(0);
  const final = quitEvent();

  onWillQuit(final.event);

  expect(final.preventDefault).not.toHaveBeenCalled();
});

test('a shutdown that hangs is given up on after the timeout', async () => {
  const {shutdown} = heldShutdown();
  const onWillQuit = quitGuardFactory({shutdown, quit, timeoutMs: TIMEOUT_MS, log: {warn}});
  onWillQuit(quitEvent().event);

  await vi.advanceTimersByTimeAsync(TIMEOUT_MS - 1);
  expect(quit).not.toHaveBeenCalled();

  await vi.advanceTimersByTimeAsync(1);
  // the quit itself is the task after the timeout
  await vi.runOnlyPendingTimersAsync();
  expect(quit).toHaveBeenCalledOnce();
  expect(warn).toHaveBeenCalledOnce();
});

test('a shutdown that fails is logged and the app quits anyway', async () => {
  const shutdown = () => Promise.reject(new Error('port gone'));
  const onWillQuit = quitGuardFactory({shutdown, quit, timeoutMs: TIMEOUT_MS, log: {warn}});

  onWillQuit(quitEvent().event);
  await vi.advanceTimersByTimeAsync(0);

  expect(quit).toHaveBeenCalledOnce();
  expect(warn).toHaveBeenCalledOnce();
});
