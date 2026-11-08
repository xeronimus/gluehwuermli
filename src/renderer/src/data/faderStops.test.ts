import Fader from '@/domain/Fader';

import {
  faderKeyStops,
  faderMode,
  faderPositions,
  faderRange,
  loweredFaderValue,
  positionButtons,
  raisedFaderValue,
  showsAsButtons,
  snappedFaderValue,
  steppedFaderValue
} from './faderStops';

const raw: Fader = {channel: 1, label: '1'};
const strobe: Fader = {channel: 2, label: 'Strobe', values: {mode: 'steps', min: 10, max: 100, step: 30}};
const gobo: Fader = {
  channel: 3,
  label: 'Gobo',
  values: {mode: 'positions', positions: [{value: 200, name: 'Star'}, {value: 5}, {value: 6, name: 'Open'}]}
};

test('a fader without rules moves by one over 0 to 255, as before', () => {
  expect(snappedFaderValue(raw, 127.6)).toBe(128);
  expect(raisedFaderValue(raw, 40)).toBe(41);
  expect(loweredFaderValue(raw, 40)).toBe(39);
  expect(raisedFaderValue(raw, 255)).toBeUndefined();
  expect(loweredFaderValue(raw, 0)).toBeUndefined();
  expect(faderRange(raw)).toEqual({min: 0, max: 255});
  expect(faderMode(raw)).toBe('continuous');
});

test('a slider position snaps to the nearest stop, never below min or above max', () => {
  expect(snappedFaderValue(strobe, 0)).toBe(10);
  expect(snappedFaderValue(strobe, 52)).toBe(40);
  expect(snappedFaderValue(strobe, 255)).toBe(100);
  expect(snappedFaderValue(gobo, 90)).toBe(6);
});

test('the step buttons go to the next and the previous stop, also from a value off the stops', () => {
  expect(raisedFaderValue(strobe, 0)).toBe(10);
  expect(raisedFaderValue(strobe, 10)).toBe(40);
  expect(raisedFaderValue(strobe, 70)).toBe(100);
  expect(raisedFaderValue(strobe, 100)).toBeUndefined();
  expect(loweredFaderValue(gobo, 200)).toBe(6);
  expect(loweredFaderValue(gobo, 5)).toBeUndefined();
  expect(loweredFaderValue(gobo, 0)).toBeUndefined();
});

test('the keys on the handle move by stops, Page Up and Down by ten, as far as the fader goes', () => {
  expect(faderKeyStops('ArrowUp')).toBe(1);
  expect(faderKeyStops('PageDown')).toBe(-10);
  expect(faderKeyStops('Tab')).toBeUndefined();
  expect(steppedFaderValue(raw, 40, 10)).toBe(50);
  expect(steppedFaderValue(raw, 250, 10)).toBe(255);
  expect(steppedFaderValue(gobo, 6, 1)).toBe(200);
  expect(steppedFaderValue(gobo, 200, -10)).toBe(5);
  expect(steppedFaderValue(strobe, 100, 1)).toBeUndefined();
});

test('a positions fader lists its positions lowest first, the others none', () => {
  expect(faderPositions(gobo).map(({value}) => value)).toEqual([5, 6, 200]);
  expect(faderPositions(strobe)).toEqual([]);
  expect(faderRange(gobo)).toEqual({min: 5, max: 200});
});

test('only a positions channel set to buttons shows as buttons', () => {
  expect(showsAsButtons(raw)).toBe(false);
  expect(showsAsButtons(strobe)).toBe(false);
  expect(showsAsButtons(gobo)).toBe(false);
  expect(showsAsButtons({...gobo, values: {mode: 'positions', positions: [], display: 'buttons'}})).toBe(true);
});

test('the buttons go from the highest value on top to the lowest, named or by value; other channels have none', () => {
  expect(positionButtons(gobo)).toEqual([
    {value: 200, label: 'Star'},
    {value: 6, label: 'Open'},
    {value: 5, label: '5'}
  ]);
  expect(positionButtons(strobe)).toEqual([]);
});
