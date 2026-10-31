import Type, {type Static} from 'typebox';
import Value from 'typebox/value';

/**
 * The main window between sessions. The bounds are the normal (un-maximized) ones, so un-maximizing after a restart
 * returns to the previous size. Stays in main: nothing of it crosses IPC.
 */
export const WindowStateSchema = Type.Object({
  x: Type.Integer(),
  y: Type.Integer(),
  width: Type.Integer({minimum: 1}),
  height: Type.Integer({minimum: 1}),
  maximized: Type.Boolean(),
  fullScreen: Type.Boolean()
});
export type WindowState = Static<typeof WindowStateSchema>;

export const parseWindowState = (payload: unknown): WindowState | undefined =>
  Value.Check(WindowStateSchema, payload) ? payload : undefined;

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

/** where the window opens: where it was, or the default size centred on the primary display (Electron centres it) */
export type WindowPlacement =
  {type: 'centred'; size: Size} | {type: 'restored'; bounds: Rectangle; maximized: boolean; fullScreen: boolean};

/** enough of the window on a display to grab it and drag it back; a corner of a few pixels doesn't count */
const MIN_VISIBLE_PIXELS = 50;

const overlapLength = (start: number, length: number, otherStart: number, otherLength: number) =>
  Math.min(start + length, otherStart + otherLength) - Math.max(start, otherStart);

const isVisibleOn = (bounds: Rectangle, workArea: Rectangle) =>
  overlapLength(bounds.x, bounds.width, workArea.x, workArea.width) >= MIN_VISIBLE_PIXELS &&
  overlapLength(bounds.y, bounds.height, workArea.y, workArea.height) >= MIN_VISIBLE_PIXELS;

/**
 * The saved placement if the window would be visible on one of the connected displays (partly off-screen is fine),
 * otherwise the default, e.g. when the display it was on is unplugged.
 */
export function restorableBounds(
  saved: WindowState | undefined,
  displayWorkAreas: readonly Rectangle[],
  defaultSize: Size
): WindowPlacement {
  if (!saved) {
    return {type: 'centred', size: defaultSize};
  }
  const {maximized, fullScreen, ...bounds} = saved;
  return displayWorkAreas.some((workArea) => isVisibleOn(bounds, workArea))
    ? {type: 'restored', bounds, maximized, fullScreen}
    : {type: 'centred', size: defaultSize};
}
