import {BrowserWindow, app, screen, shell} from 'electron';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

import appIcon from '../assets/favicon/android-chrome-512x512.png?asset';
import {loadMainConfig} from './config';
import {fixtureIpcHandlers} from './ipc/fixtureIpcHandlers';
import {localeIpcHandlers} from './ipc/localeIpcHandlers';
import {registerAppIpc} from './ipc/registerAppIpc';
import {registerDmxIpc} from './ipc/registerDmxIpc';
import {registerFixtureIpc} from './ipc/registerFixtureIpc';
import {registerLockIpc} from './ipc/registerLockIpc';
import log, {configureLog} from './log';
import {createMainServices} from './services';
import {guardExternalLinks} from './window/externalLinks';
import {persistWindowState} from './window/persistWindowState';
import {type WindowPlacement, restorableBounds} from './window/windowState';

const MAIN_WINDOW_SIZE = {width: 1280, height: 800};
const FIXTURE_FILE_NAME = 'fixtures.json';
const WINDOW_STATE_FILE_NAME = 'window-state.json';
const SETTINGS_FILE_NAME = 'settings.json';

const boundsOf = (placement: WindowPlacement) =>
  placement.type === 'restored' ? {...placement.bounds, fullscreen: placement.fullScreen} : placement.size;

function createMainWindow(placement: WindowPlacement): BrowserWindow {
  const window = new BrowserWindow({
    ...boundsOf(placement),
    show: false,
    autoHideMenuBar: true,
    title: 'Glühwürmli',
    icon: appIcon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      // the DMX timing lives in the main process, but the UI should stay responsive while minimized, too
      backgroundThrottling: false
    }
  });

  // electron-vite sets the dev server URL in development (`pnpm dev`), with hot reload of the renderer
  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  const appPageUrl =
    !app.isPackaged && devServerUrl ? devServerUrl : pathToFileURL(join(__dirname, '../renderer/index.html')).href;

  guardExternalLinks(window.webContents, appPageUrl, (url) => shell.openExternal(url), log);

  window.on('ready-to-show', () => {
    // maximized only now: maximize() shows a hidden window, before its content is there
    if (placement.type === 'restored' && placement.maximized) {
      window.maximize();
    }
    window.show();
  });

  void window.loadURL(appPageUrl);

  return window;
}

const config = loadMainConfig(app.isPackaged);
configureLog(config.debug);
const dataFolder = app.getPath('userData');
const services = createMainServices(config, {
  fixtureFilePath: join(dataFolder, FIXTURE_FILE_NAME),
  windowStateFilePath: join(dataFolder, WINDOW_STATE_FILE_NAME),
  settingsFilePath: join(dataFolder, SETTINGS_FILE_NAME)
});
const fixtureHandlers = fixtureIpcHandlers({
  store: services.fixtureStore,
  engine: services.dmxEngine,
  isSetupMode: services.appLock.isSetupMode
});

/** the channel locks apply from the start, also if the renderer never loads the fixtures */
async function applyStoredChannelLimits(): Promise<void> {
  try {
    await fixtureHandlers.load();
  } catch (error) {
    log.warn('loading the fixtures for their channel locks failed', error);
  }
}

/** where it was last time, if that is still on a connected display; screen is only available once the app is ready */
async function openMainWindow(): Promise<void> {
  const savedState = await services.windowStateStore.load();
  const displayWorkAreas = screen.getAllDisplays().map((display) => display.workArea);
  const window = createMainWindow(restorableBounds(savedState, displayWorkAreas, MAIN_WINDOW_SIZE));
  persistWindowState(window, services.windowStateStore, log);
}

void app.whenReady().then(async () => {
  await applyStoredChannelLimits();
  registerDmxIpc(services.dmxEngine, services.dmxPortConnector, services.portMemory);
  registerFixtureIpc(fixtureHandlers);
  registerAppIpc(dataFolder, services.appLock.isSetupMode, localeIpcHandlers(services.settings));
  registerLockIpc(services.appLock);
  // after the channel limits, so the output is capped from its first packet; the renderer gets the status pushed
  void services.portMemory.reconnect();
  void openMainWindow();

  // macOS: re-create the window when the dock icon is clicked and none is open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void openMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// The widget keeps sending the last universe after the port is closed, as long as it has USB power: quitting does not
// black out the rig (see doc/dmx-latency-and-stack.md, "Open questions")
app.on('will-quit', () => {
  services.dmxEngine.dispose().catch((error: unknown) => log.warn('closing the DMX port on quit failed', error));
});
