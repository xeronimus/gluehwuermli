import {BrowserWindow, app, screen, shell} from 'electron';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

import appIcon from '../assets/favicon/android-chrome-512x512.png?asset';
import {loadMainConfig} from './config';
import {blackoutOnQuitIpcHandlers} from './ipc/blackoutOnQuitIpcHandlers';
import {chaseIpcHandlers} from './ipc/chaseIpcHandlers';
import {localeIpcHandlers} from './ipc/localeIpcHandlers';
import {projectIpcHandlers} from './ipc/projectIpcHandlers';
import {registerAppIpc} from './ipc/registerAppIpc';
import {registerChaseIpc} from './ipc/registerChaseIpc';
import {registerDmxIpc} from './ipc/registerDmxIpc';
import {registerLockIpc} from './ipc/registerLockIpc';
import {registerProjectIpc} from './ipc/registerProjectIpc';
import log, {configureLog} from './log';
import {projectPathFromArgv} from './project/commandLine';
import {openFileRequestsFactory} from './project/openFileRequests';
import {windowTitleOf} from './project/windowTitle';
import {quitGuardFactory} from './quit/quitGuard';
import {createMainServices} from './services';
import {guardExternalLinks} from './window/externalLinks';
import {persistWindowState} from './window/persistWindowState';
import {type WindowPlacement, restorableBounds} from './window/windowState';

const MAIN_WINDOW_SIZE = {width: 1280, height: 800};
const WINDOW_STATE_FILE_NAME = 'window-state.json';
const SETTINGS_FILE_NAME = 'settings.json';
/** closing the port takes a few ms; a port that hangs must not keep the app from quitting */
const QUIT_TIMEOUT_MS = 2000;

const boundsOf = (placement: WindowPlacement) =>
  placement.type === 'restored' ? {...placement.bounds, fullscreen: placement.fullScreen} : placement.size;

function createMainWindow(placement: WindowPlacement, title: string): BrowserWindow {
  const window = new BrowserWindow({
    ...boundsOf(placement),
    show: false,
    autoHideMenuBar: true,
    title,
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

  // the title names the open project (set by main), not the page's <title>
  window.on('page-title-updated', (event) => event.preventDefault());

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

const config = loadMainConfig(app.isPackaged, process.platform);
configureLog({consoleLevel: config.logLevel, logToFile: config.logToFile});

/**
 * One process only: a second one would fight over the COM port. A .glp double-clicked while the app runs starts a
 * second process that hands its arguments to this one (second-instance) and quits before it creates any service.
 */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  startApp();
}

function startApp(): void {
  const dataFolder = app.getPath('userData');
  const services = createMainServices(config, {
    projectFolder: app.getPath('documents'),
    windowStateFilePath: join(dataFolder, WINDOW_STATE_FILE_NAME),
    settingsFilePath: join(dataFolder, SETTINGS_FILE_NAME),
    platform: process.platform
  });
  const {projectSession} = services;

  /**
   * macOS hands a double-clicked .glp over as `open-file`, also before `ready` when the double-click starts the app;
   * registered right away, so none is missed. preventDefault: the app opens the file itself
   */
  const openFileRequests = openFileRequestsFactory();
  app.on('open-file', (event, path) => {
    event.preventDefault();
    openFileRequests.received(path);
  });

  /** the window being opened: an open-file and a dock click at the same time open one window, not two */
  let windowOpening: Promise<void> | undefined;

  /** where it was last time, if that is still on a connected display; screen is only available once the app is ready */
  async function createWindowAtSavedPlace(): Promise<void> {
    const savedState = await services.windowStateStore.load();
    const displayWorkAreas = screen.getAllDisplays().map((display) => display.workArea);
    const window = createMainWindow(
      restorableBounds(savedState, displayWorkAreas, MAIN_WINDOW_SIZE),
      windowTitleOf(projectSession.status())
    );
    persistWindowState(window, services.windowStateStore, log);
  }

  function openMainWindow(): Promise<void> {
    windowOpening ??= createWindowAtSavedPlace().finally(() => {
      windowOpening = undefined;
    });
    return windowOpening;
  }

  function focusMainWindow(): void {
    const [window] = BrowserWindow.getAllWindows();
    if (window?.isMinimized()) {
      window.restore();
    }
    window?.focus();
  }

  /** on macOS the app keeps running with its window closed: the project is opened in a new one */
  async function requestOpenInWindow(projectPath: string): Promise<void> {
    if (BrowserWindow.getAllWindows().length === 0) {
      await openMainWindow();
    } else {
      focusMainWindow();
    }
    projectSession.requestOpen(projectPath);
  }

  app.on('second-instance', (_event, argv, workingDirectory) => {
    focusMainWindow();
    const projectPath = projectPathFromArgv(argv, workingDirectory);
    if (projectPath !== undefined) {
      projectSession.requestOpen(projectPath);
    }
  });

  projectSession.onChanged((status) => {
    BrowserWindow.getAllWindows().forEach((window) => window.setTitle(windowTitleOf(status)));
  });

  void app.whenReady().then(async () => {
    // the project's channel locks apply before anything can be connected, so the output is capped from its first packet
    await projectSession.start(openFileRequests.takeStartPath() ?? projectPathFromArgv(process.argv, process.cwd()));
    registerDmxIpc(services.dmxEngine, services.dmxPortConnector, services.portMemory, services.chasePlayer);
    registerProjectIpc(projectSession, projectIpcHandlers(projectSession));
    registerAppIpc(
      dataFolder,
      services.appLock.isSetupMode,
      localeIpcHandlers(services.settings),
      blackoutOnQuitIpcHandlers(services.settings)
    );
    registerLockIpc(services.appLock);
    registerChaseIpc(services.chasePlayer, chaseIpcHandlers(services.chasePlayer, projectSession));
    void openMainWindow();
    // registerProjectIpc listens for open requests by now, so the renderer gets them
    openFileRequests.forwardTo((projectPath) => void requestOpenInWindow(projectPath));
    // once per start, in the background: a newer release is installed when the app quits, never during a show
    void services.autoUpdate.check();

    // macOS: re-create the window when the dock icon is clicked and none is open
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void openMainWindow();
      }
    });
  });

  /**
   * Set by every quit (⌘Q, the menu, app.quit). The window's close waits for its state to be saved
   * (persistWindowState), and Electron takes a held close as a cancelled quit: without this, macOS would keep the app
   * running after the first quit closed the window
   */
  let quitRequested = false;
  app.on('before-quit', () => {
    log.info(`quit requested, ${BrowserWindow.getAllWindows().length} window(s) open`);
    quitRequested = true;
  });

  // macOS keeps the app running with its window closed, unless the window closed because the app quits
  app.on('window-all-closed', () => {
    log.info(`all windows closed, quit requested: ${quitRequested}`);
    if (process.platform !== 'darwin' || quitRequested) {
      app.quit();
    }
  });

  /**
   * The widget keeps sending the last universe after the port is closed, as long as it has USB power: without the
   * blackout setting, quitting leaves the rig as it is (doc/dmx-latency-and-stack.md)
   */
  const shutDownOutput = async () => {
    // before anything awaits: no step goes out after the blackout, or while the port closes
    services.chasePlayer.stop();
    log.info('shutting down the DMX output before quitting');
    const {blackoutOnQuit} = await services.settings.load();
    await services.dmxEngine.dispose({blackout: blackoutOnQuit === true});
    log.info('the DMX output is shut down');
  };

  // will-quit, not before-quit: the windows are closed by then, nobody sees a window that doesn't react
  app.on(
    'will-quit',
    quitGuardFactory({
      shutdown: shutDownOutput,
      quit: () => {
        log.info('quitting');
        app.quit();
      },
      timeoutMs: QUIT_TIMEOUT_MS,
      log
    })
  );
}
