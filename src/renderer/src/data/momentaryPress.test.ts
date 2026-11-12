import {createMomentaryPress} from './momentaryPress';

const NO_CAP = undefined;

test('a press sends the position, its release the value from before', () => {
  const press = createMomentaryPress();

  expect(press.pressed(100, 0, NO_CAP)).toBe(100);
  expect(press.released(100, NO_CAP)).toBe(0);
});

test('pressing the value the channel already has sends nothing, nor does its release', () => {
  const press = createMomentaryPress();

  expect(press.pressed(100, 100, NO_CAP)).toBeUndefined();
  expect(press.released(100, NO_CAP)).toBeUndefined();
});

test('a position above the cap sends nothing', () => {
  const press = createMomentaryPress();

  expect(press.pressed(100, 0, 50)).toBeUndefined();
  expect(press.released(0, 50)).toBeUndefined();
});

test('a second press while one is held sends nothing; the release puts back the value from before the first', () => {
  const press = createMomentaryPress();
  press.pressed(100, 0, NO_CAP);

  expect(press.pressed(200, 100, NO_CAP)).toBeUndefined();
  expect(press.released(100, NO_CAP)).toBe(0);
});

test('a press is released once: a pointerleave after the pointerup sends nothing', () => {
  const press = createMomentaryPress();
  press.pressed(100, 0, NO_CAP);
  press.released(100, NO_CAP);

  expect(press.released(0, NO_CAP)).toBeUndefined();
});

test('with the channel lock turned on during the press, the value put back is capped', () => {
  const press = createMomentaryPress();
  press.pressed(30, 200, NO_CAP);

  expect(press.released(30, 50)).toBe(50);
});

test('with the cap turned on during the press at the value from before, nothing needs to be sent', () => {
  const press = createMomentaryPress();
  press.pressed(30, 200, NO_CAP);

  expect(press.released(30, 30)).toBeUndefined();
});

test('a value set by something else during the press stays', () => {
  const press = createMomentaryPress();
  press.pressed(100, 0, NO_CAP);

  expect(press.released(42, NO_CAP)).toBeUndefined();
  expect(press.released(0, NO_CAP)).toBeUndefined();
});
