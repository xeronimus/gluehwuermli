import {type Updater, autoUpdateFactory} from './autoUpdate';

const fakeUpdater = (checkForUpdates: () => Promise<unknown>): Updater => ({
  autoDownload: false,
  autoInstallOnAppQuit: false,
  checkForUpdates: vi.fn(checkForUpdates)
});

let warn: ReturnType<typeof vi.fn<(...message: unknown[]) => void>>;

beforeEach(() => {
  warn = vi.fn<(...message: unknown[]) => void>();
});

it('downloads in the background and installs only on quit', () => {
  const updater = fakeUpdater(async () => null);

  autoUpdateFactory({updater, log: {warn}});

  expect(updater.autoDownload).toBe(true);
  expect(updater.autoInstallOnAppQuit).toBe(true);
  expect(updater.checkForUpdates).not.toHaveBeenCalled();
});

it('checks for an update once per check', async () => {
  const updater = fakeUpdater(async () => null);

  await autoUpdateFactory({updater, log: {warn}}).check();

  expect(updater.checkForUpdates).toHaveBeenCalledTimes(1);
  expect(warn).not.toHaveBeenCalled();
});

it('only warns when the check fails, e.g. offline', async () => {
  const offline = new Error('net::ERR_INTERNET_DISCONNECTED');
  const updater = fakeUpdater(async () => {
    throw offline;
  });

  await expect(autoUpdateFactory({updater, log: {warn}}).check()).resolves.toBeUndefined();

  expect(warn).toHaveBeenCalledWith('checking for an update failed', offline);
});
