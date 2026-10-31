import {type Rectangle, type WindowState, parseWindowState, restorableBounds} from './windowState';

const DEFAULT_SIZE = {width: 1280, height: 800};
const PRIMARY: Rectangle = {x: 0, y: 0, width: 1920, height: 1040};
const SECONDARY_RIGHT: Rectangle = {x: 1920, y: 0, width: 2560, height: 1400};

const onSecondary: WindowState = {x: 2200, y: 100, width: 1600, height: 900, maximized: false, fullScreen: false};

test('nothing saved opens the default size, centred', () => {
  expect(restorableBounds(undefined, [PRIMARY], DEFAULT_SIZE)).toEqual({type: 'centred', size: DEFAULT_SIZE});
});

test('restores bounds on a connected display, with the maximized and full-screen state', () => {
  const saved = {...onSecondary, maximized: true};

  expect(restorableBounds(saved, [PRIMARY, SECONDARY_RIGHT], DEFAULT_SIZE)).toEqual({
    type: 'restored',
    bounds: {x: 2200, y: 100, width: 1600, height: 900},
    maximized: true,
    fullScreen: false
  });
});

test('bounds on a display that is no longer connected open the default size, centred', () => {
  expect(restorableBounds(onSecondary, [PRIMARY], DEFAULT_SIZE)).toEqual({type: 'centred', size: DEFAULT_SIZE});
});

test('partly off-screen bounds are restored as they are', () => {
  const partlyOff: WindowState = {x: -400, y: 600, width: 1280, height: 800, maximized: false, fullScreen: false};

  expect(restorableBounds(partlyOff, [PRIMARY], DEFAULT_SIZE)).toEqual({
    type: 'restored',
    bounds: {x: -400, y: 600, width: 1280, height: 800},
    maximized: false,
    fullScreen: false
  });
});

test('bounds overlapping a display by only a few pixels open the default size, centred', () => {
  const barelyOn: WindowState = {x: 1900, y: 100, width: 1280, height: 800, maximized: false, fullScreen: false};

  expect(restorableBounds(barelyOn, [PRIMARY], DEFAULT_SIZE)).toEqual({type: 'centred', size: DEFAULT_SIZE});
});

test.each([
  ['nothing', undefined],
  ['another shape', {x: 0, y: 0}],
  ['a zero width', {...onSecondary, width: 0}],
  ['a fractional position', {...onSecondary, x: 10.5}]
])('%s is no window state', (_description, payload) => {
  expect(parseWindowState(payload)).toBeUndefined();
});

test('a valid window state parses', () => {
  expect(parseWindowState(onSecondary)).toEqual(onSecondary);
});
