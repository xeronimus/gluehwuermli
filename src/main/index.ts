import {BrowserWindow, app} from 'electron';
import {join} from 'node:path';

import appIcon from '../resources/favicon/android-chrome-512x512.png?asset';
import {loadMainConfig} from './config';
import {registerDmxIpc} from './ipc/registerDmxIpc';
import log, {configureLog} from './log';
import {createMainServices} from './services';

const MAIN_WINDOW_SIZE = {width: 1280, height: 800};

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    ...MAIN_WINDOW_SIZE,
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

  window.on('ready-to-show', () => window.show());

  // electron-vite sets the dev server URL in development (`pnpm dev`), with hot reload of the renderer
  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

const config = loadMainConfig(app.isPackaged);
configureLog(config.debug);
const services = createMainServices(config);

void app.whenReady().then(() => {
  registerDmxIpc(services.dmxEngine, services.dmxPortConnector);
  createMainWindow();

  // macOS: re-create the window when the dock icon is clicked and none is open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
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
