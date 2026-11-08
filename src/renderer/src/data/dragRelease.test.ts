import {createDragReleaseTracker} from './dragRelease';

const LEFT = 0;
const RIGHT = 2;
const NO_BUTTONS = 0;
const LEFT_DOWN = 1;
const RIGHT_DOWN = 2;

test('a drag with the left button down is not stuck', () => {
  const tracker = createDragReleaseTracker();
  tracker.pressed(LEFT);

  expect(tracker.isStuckOnMove(LEFT_DOWN)).toBe(false);
  expect(tracker.isStuckOnMove(LEFT_DOWN | RIGHT_DOWN)).toBe(false);
});

test('a move without the left button after a lost mouseup is stuck, once', () => {
  const tracker = createDragReleaseTracker();
  tracker.pressed(LEFT);

  expect(tracker.isStuckOnMove(NO_BUTTONS)).toBe(true);
  expect(tracker.isStuckOnMove(NO_BUTTONS)).toBe(false);
});

test('a move after the mouseup arrived is not stuck', () => {
  const tracker = createDragReleaseTracker();
  tracker.pressed(LEFT);
  tracker.released();

  expect(tracker.isStuckOnMove(NO_BUTTONS)).toBe(false);
});

test('a right click starts no drag', () => {
  const tracker = createDragReleaseTracker();
  tracker.pressed(RIGHT);

  expect(tracker.isStuckOnMove(NO_BUTTONS)).toBe(false);
  expect(tracker.isStuckOnBlur()).toBe(false);
});

test('losing focus while dragging is stuck, once; without a drag it is not', () => {
  const tracker = createDragReleaseTracker();
  expect(tracker.isStuckOnBlur()).toBe(false);

  tracker.pressed(LEFT);
  expect(tracker.isStuckOnBlur()).toBe(true);
  expect(tracker.isStuckOnBlur()).toBe(false);
});
