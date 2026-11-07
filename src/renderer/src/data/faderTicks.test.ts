import {tickLabelOffsets, tickOffset} from './faderTicks';

const TRACK = 255;
const GAP = 12;

test('labels far apart sit at their ticks', () => {
  expect(tickLabelOffsets([20, 100, 200], TRACK, GAP)).toEqual([20, 100, 200]);
});

test('labels of close positions (5 and 6) are pushed apart, the first one stays at its tick', () => {
  expect(tickLabelOffsets([5, 6, 200], TRACK, GAP)).toEqual([5, 17, 200]);
});

test('labels near the top are pushed back down, so none runs past the end of the track', () => {
  expect(tickLabelOffsets([250, 252, 255], TRACK, GAP)).toEqual([231, 243, 255]);
});

test('more labels than fit share the track evenly', () => {
  const offsets = tickLabelOffsets([0, 1, 2, 3], 30, GAP);

  expect(offsets).toEqual([0, 10, 20, 30]);
});

test('no ticks, no labels; a tick sits at its value on the track', () => {
  expect(tickLabelOffsets([], TRACK, GAP)).toEqual([]);
  expect(tickOffset(51, 255, 260)).toBeCloseTo(52);
});
