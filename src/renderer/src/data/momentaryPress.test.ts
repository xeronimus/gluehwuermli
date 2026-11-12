import {createMomentaryPress} from './momentaryPress';

const NO_CAP = undefined;
const MOUSE = 1;
const FINGER = 2;
const SECOND_FINGER = 3;

test('a press sends the position, its release the value from before', () => {
  const press = createMomentaryPress();

  expect(press.pressed(100, 0, NO_CAP, MOUSE)).toBe(100);
  expect(press.released(100, NO_CAP, MOUSE)).toBe(0);
});

test('pressing the value the channel already has sends nothing, nor does its release', () => {
  const press = createMomentaryPress();

  expect(press.pressed(100, 100, NO_CAP, MOUSE)).toBeUndefined();
  expect(press.released(100, NO_CAP, MOUSE)).toBeUndefined();
});

test('a position above the cap sends nothing', () => {
  const press = createMomentaryPress();

  expect(press.pressed(100, 0, 50, MOUSE)).toBeUndefined();
  expect(press.released(0, 50, MOUSE)).toBeUndefined();
});

test('a second press while one is held sends nothing; the release puts back the value from before the first', () => {
  const press = createMomentaryPress();
  press.pressed(100, 0, NO_CAP, FINGER);

  expect(press.pressed(200, 100, NO_CAP, FINGER)).toBeUndefined();
  expect(press.released(100, NO_CAP, FINGER)).toBe(0);
});

test('another pointer releases nothing: a second finger, or the mouse passing over another button', () => {
  const press = createMomentaryPress();
  press.pressed(100, 0, NO_CAP, FINGER);

  expect(press.pressed(200, 100, NO_CAP, SECOND_FINGER)).toBeUndefined();
  expect(press.released(100, NO_CAP, SECOND_FINGER)).toBeUndefined();
  expect(press.released(100, NO_CAP, MOUSE)).toBeUndefined();
  expect(press.released(100, NO_CAP, FINGER)).toBe(0);
});

test('a release without a pointer (focus lost, buttons gone) releases any press', () => {
  const press = createMomentaryPress();
  press.pressed(100, 0, NO_CAP, FINGER);

  expect(press.released(100, NO_CAP)).toBe(0);
});

test('a press is released once: a pointerleave after the pointerup sends nothing', () => {
  const press = createMomentaryPress();
  press.pressed(100, 0, NO_CAP, MOUSE);
  press.released(100, NO_CAP, MOUSE);

  expect(press.released(0, NO_CAP, MOUSE)).toBeUndefined();
});

test('with the channel lock turned on during the press, the value put back is capped', () => {
  const press = createMomentaryPress();
  press.pressed(30, 200, NO_CAP, MOUSE);

  expect(press.released(30, 50, MOUSE)).toBe(50);
});

test('with the cap turned on during the press at the value from before, nothing needs to be sent', () => {
  const press = createMomentaryPress();
  press.pressed(30, 200, NO_CAP, MOUSE);

  expect(press.released(30, 30, MOUSE)).toBeUndefined();
});

test('a value set by something else during the press stays', () => {
  const press = createMomentaryPress();
  press.pressed(100, 0, NO_CAP, MOUSE);

  expect(press.released(42, NO_CAP, MOUSE)).toBeUndefined();
  expect(press.released(0, NO_CAP, MOUSE)).toBeUndefined();
});
