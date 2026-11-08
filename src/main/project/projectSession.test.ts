import {type ChannelLimits, emptyFixtureSetup, fixtureSetupOf} from '@shared/fixtures';
import type {Chase, Fixture, FixtureSetup, ProjectError, ProjectStatus} from '@shared/ipc';

import type {SettingsStore} from '@/settings/SettingsStore';
import {appSettingsFactory} from '@/settings/appSettings';
import {EMPTY_SETTINGS, type Settings} from '@/settings/settings';

import type {ProjectFileStore} from './ProjectFileStore';
import {type ProjectSession, projectSessionFactory} from './projectSession';

const WALDFEST = 'D:\\Shows\\Waldfest.glp';
const FASNACHT = 'E:\\Fasnacht.glp';
const silentLog = {info: () => {}, warn: () => {}};

const laserBox: Fixture = {
  id: 'box',
  name: 'LightBox',
  startAddress: 20,
  channels: [
    {name: 'Dimmer', offset: 0},
    {name: 'Laser', offset: 1, lock: {max: 0}}
  ]
};

const chaseOf = (id: string, value: number): Chase => ({
  id,
  name: id,
  repeat: {type: 'forever'},
  steps: [{id: 'step', holdMs: 500, values: [{channel: 1, value}]}]
});
const chorus = chaseOf('chorus', 255);
const intro = chaseOf('intro', 100);
const withChases = (setup: FixtureSetup, chases: Chase[]): FixtureSetup => ({...setup, chases});

/** what the engine was told, in order */
type EngineCall = {type: 'blackout'} | {type: 'limits'; limits: ChannelLimits};

let files: Map<string, FixtureSetup | ProjectError>;
let failingWrite: boolean;
let storedSettings: Settings | undefined;
let engineCalls: EngineCall[];
let runningChaseId: string | undefined;
/** how many engine calls came before each chase stop */
let chaseStops: number[];
let setupMode: boolean;
let chosenPath: string | undefined;
let existingFiles: Set<string>;
let session: ProjectSession;

const isProjectError = (content: FixtureSetup | ProjectError): content is ProjectError => 'reason' in content;

const store: ProjectFileStore = {
  read: async (path) => {
    const content = files.get(path);
    if (content === undefined) {
      return {type: 'failed', error: {reason: 'missing'}};
    }
    return isProjectError(content) ? {type: 'failed', error: content} : {type: 'read', setup: content};
  },
  write: async (path, setup) => {
    if (failingWrite) {
      throw new Error('EPERM: operation not permitted');
    }
    files.set(path, setup);
  }
};

const settingsStore: SettingsStore = {
  load: async () => storedSettings,
  save: async (settings) => {
    storedSettings = settings;
  }
};

const createSession = () =>
  projectSessionFactory({
    store,
    engine: {
      blackout: () => engineCalls.push({type: 'blackout'}),
      setChannelLimits: (limits) => engineCalls.push({type: 'limits', limits})
    },
    chasePlayer: {
      status: () =>
        runningChaseId === undefined
          ? {type: 'idle'}
          : {type: 'running', chaseId: runningChaseId, stepIndex: 0, passIndex: 0},
      stop: () => {
        runningChaseId = undefined;
        chaseStops.push(engineCalls.length);
      }
    },
    settings: appSettingsFactory(settingsStore),
    isSetupMode: () => setupMode,
    dialogs: {chooseNewProjectPath: async () => chosenPath, chooseProjectToOpen: async () => chosenPath},
    fileExists: async (path) => existingFiles.has(path),
    log: silentLog
  });

beforeEach(() => {
  files = new Map([
    [WALDFEST, fixtureSetupOf([laserBox])],
    [FASNACHT, emptyFixtureSetup()]
  ]);
  failingWrite = false;
  storedSettings = undefined;
  engineCalls = [];
  runningChaseId = undefined;
  chaseStops = [];
  setupMode = false;
  chosenPath = undefined;
  existingFiles = new Set([WALDFEST, FASNACHT]);
  session = createSession();
});

const openStatus = (path: string, setup: FixtureSetup): ProjectStatus => ({type: 'open', project: {path, setup}});

describe('start', () => {
  test('without a command line and a last project, there is none', async () => {
    await session.start(undefined);

    expect(session.status()).toEqual({type: 'none'});
    expect(engineCalls).toEqual([]);
  });

  test('opens the last project and applies its limits', async () => {
    storedSettings = {...EMPTY_SETTINGS, lastProjectPath: WALDFEST};
    session = createSession();

    await session.start(undefined);

    expect(session.status()).toEqual(openStatus(WALDFEST, fixtureSetupOf([laserBox])));
    expect(engineCalls).toEqual([{type: 'blackout'}, {type: 'limits', limits: new Map([[21, 0]])}]);
  });

  test('the double-clicked file wins over the last project, and becomes the last one', async () => {
    storedSettings = {...EMPTY_SETTINGS, lastProjectPath: WALDFEST};
    session = createSession();

    await session.start(FASNACHT);

    expect(session.status()).toEqual(openStatus(FASNACHT, emptyFixtureSetup()));
    expect(storedSettings?.lastProjectPath).toBe(FASNACHT);
    expect(storedSettings?.recentProjectPaths).toEqual([FASNACHT]);
  });

  test('a last project that is gone fails with its path and reason, and stays the last one', async () => {
    storedSettings = {...EMPTY_SETTINGS, lastProjectPath: 'F:\\stick\\Gone.glp'};
    session = createSession();

    await session.start(undefined);

    expect(session.status()).toEqual({type: 'failed', path: 'F:\\stick\\Gone.glp', error: {reason: 'missing'}});
    expect(storedSettings?.lastProjectPath).toBe('F:\\stick\\Gone.glp');
    expect(engineCalls).toEqual([]);
  });
});

describe('opening', () => {
  beforeEach(async () => {
    storedSettings = {...EMPTY_SETTINGS, lastProjectPath: WALDFEST, recentProjectPaths: [WALDFEST]};
    session = createSession();
    await session.start(undefined);
    engineCalls = [];
    chaseStops = [];
  });

  test('another project blacks out first, then applies its limits, and tells the listeners', async () => {
    const changes: ProjectStatus[] = [];
    session.onChanged((status) => changes.push(status));
    chosenPath = FASNACHT;

    expect(await session.openWithDialog()).toEqual({
      type: 'opened',
      project: {path: FASNACHT, setup: emptyFixtureSetup()}
    });

    expect(engineCalls).toEqual([{type: 'blackout'}, {type: 'limits', limits: new Map()}]);
    expect(changes).toEqual([openStatus(FASNACHT, emptyFixtureSetup())]);
    expect(storedSettings?.recentProjectPaths).toEqual([FASNACHT, WALDFEST]);
  });

  test('another project stops the running chase before the blackout', async () => {
    runningChaseId = 'chorus';
    chosenPath = FASNACHT;

    await session.openWithDialog();

    expect(runningChaseId).toBeUndefined();
    expect(chaseStops).toEqual([0]);
  });

  test('a file that fails keeps the chase running', async () => {
    runningChaseId = 'chorus';
    chosenPath = 'F:\\Gone.glp';

    await session.openWithDialog();

    expect(runningChaseId).toBe('chorus');
  });

  test('is allowed in Show mode', async () => {
    chosenPath = FASNACHT;

    expect((await session.openWithDialog()).type).toBe('opened');
  });

  test('a closed dialog changes nothing', async () => {
    expect(await session.openWithDialog()).toEqual({type: 'cancelled'});
    expect(engineCalls).toEqual([]);
  });

  test('a file that fails leaves the open project and the output as they are', async () => {
    files.set(FASNACHT, {reason: 'too-new', version: 2});
    chosenPath = FASNACHT;

    expect(await session.openWithDialog()).toEqual({
      type: 'failed',
      path: FASNACHT,
      error: {reason: 'too-new', version: 2}
    });
    expect(session.status()).toEqual(openStatus(WALDFEST, fixtureSetupOf([laserBox])));
    expect(engineCalls).toEqual([]);
  });

  test('a recent project opens by its path, in any case', async () => {
    expect((await session.openRecent('d:\\shows\\WALDFEST.glp')).type).toBe('opened');
  });

  test('any other path is refused, unless it was double-clicked', async () => {
    const requested: string[] = [];
    session.onOpenRequested((path) => requested.push(path));

    await expect(session.openRecent(FASNACHT)).rejects.toThrow('only a recent or double-clicked project');

    session.requestOpen(FASNACHT);
    expect(requested).toEqual([FASNACHT]);
    expect((await session.openRecent(FASNACHT)).type).toBe('opened');
  });

  test('the recent list says which files are gone, and an entry can be removed', async () => {
    storedSettings = {...EMPTY_SETTINGS, recentProjectPaths: [WALDFEST, 'F:\\Gone.glp']};
    session = createSession();

    expect(await session.listRecent()).toEqual([
      {path: WALDFEST, exists: true},
      {path: 'F:\\Gone.glp', exists: false}
    ]);

    await session.removeRecent('F:\\Gone.glp');
    expect(await session.listRecent()).toEqual([{path: WALDFEST, exists: true}]);
  });
});

describe('creating', () => {
  test('is refused in Show mode, before any dialog', async () => {
    chosenPath = 'D:\\New';

    await expect(session.create()).rejects.toThrow('only be created in Setup mode');
    expect(files.has('D:\\New.glp')).toBe(false);
  });

  test('writes an empty project with .glp added, and opens it', async () => {
    setupMode = true;
    chosenPath = 'D:\\New';

    expect(await session.create()).toEqual({
      type: 'opened',
      project: {path: 'D:\\New.glp', setup: emptyFixtureSetup()}
    });
    expect(files.get('D:\\New.glp')).toEqual(emptyFixtureSetup());
    expect(session.status()).toEqual(openStatus('D:\\New.glp', emptyFixtureSetup()));
  });

  test('a file that cannot be written fails with the reason of the OS', async () => {
    setupMode = true;
    chosenPath = 'D:\\New.glp';
    failingWrite = true;

    expect(await session.create()).toEqual({
      type: 'failed',
      path: 'D:\\New.glp',
      error: {reason: 'not-writable', message: 'EPERM: operation not permitted'}
    });
    expect(session.status()).toEqual({type: 'none'});
  });
});

describe('saving', () => {
  beforeEach(async () => {
    await session.start(FASNACHT);
    engineCalls = [];
  });

  test('writes the setup to the open project, then updates the limits', async () => {
    setupMode = true;

    await session.saveFixtures(FASNACHT, fixtureSetupOf([laserBox]));

    expect(files.get(FASNACHT)).toEqual(fixtureSetupOf([laserBox]));
    expect(session.status()).toEqual(openStatus(FASNACHT, fixtureSetupOf([laserBox])));
    expect(engineCalls).toEqual([{type: 'limits', limits: new Map([[21, 0]])}]);
  });

  test('is refused in Show mode', async () => {
    await expect(session.saveFixtures(FASNACHT, fixtureSetupOf([laserBox]))).rejects.toThrow('Setup mode');
    expect(files.get(FASNACHT)).toEqual(emptyFixtureSetup());
  });

  test("is refused for another project's setup", async () => {
    setupMode = true;

    await expect(session.saveFixtures(WALDFEST, emptyFixtureSetup())).rejects.toThrow('not to the open project');
    expect(files.get(FASNACHT)).toEqual(emptyFixtureSetup());
  });

  test('a failed write keeps the project as it was', async () => {
    setupMode = true;
    failingWrite = true;

    await expect(session.saveFixtures(FASNACHT, fixtureSetupOf([laserBox]))).rejects.toThrow('EPERM');
    expect(session.status()).toEqual(openStatus(FASNACHT, emptyFixtureSetup()));
    expect(engineCalls).toEqual([]);
  });
});

describe('saving while a chase runs', () => {
  const setup = withChases(emptyFixtureSetup(), [chorus, intro]);

  beforeEach(async () => {
    files.set(FASNACHT, setup);
    await session.start(FASNACHT);
    setupMode = true;
    runningChaseId = 'chorus';
  });

  test('saving the running chase changed stops it', async () => {
    await session.saveFixtures(FASNACHT, withChases(setup, [chaseOf('chorus', 10), intro]));

    expect(runningChaseId).toBeUndefined();
  });

  test('deleting the running chase stops it', async () => {
    await session.saveFixtures(FASNACHT, withChases(setup, [intro]));

    expect(runningChaseId).toBeUndefined();
  });

  test("saving another chase, a fixture or a new order doesn't", async () => {
    await session.saveFixtures(FASNACHT, withChases(setup, [chorus, chaseOf('intro', 1)]));
    await session.saveFixtures(FASNACHT, withChases(fixtureSetupOf([laserBox]), [chorus, intro]));
    await session.saveFixtures(FASNACHT, withChases(setup, [intro, chorus]));

    expect(runningChaseId).toBe('chorus');
  });

  test('a failed save keeps it running', async () => {
    failingWrite = true;

    await expect(session.saveFixtures(FASNACHT, withChases(setup, [intro]))).rejects.toThrow('EPERM');

    expect(runningChaseId).toBe('chorus');
  });
});

test('saving without an open project is refused', async () => {
  setupMode = true;

  await expect(session.saveFixtures(WALDFEST, emptyFixtureSetup())).rejects.toThrow('no project');
});
