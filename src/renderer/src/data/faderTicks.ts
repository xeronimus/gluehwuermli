/**
 * Where the labels of a positions fader go: beside the track, each as close as it can be to its tick, but never
 * closer to the next label than `minGap`. Positions close together (5 and 6) push their labels apart; labels that
 * would run past the end of the track are pushed back from that end. Everything in pixels from the bottom of the
 * track, as the fader runs upwards.
 */

/** where each label goes, for ticks at `tickOffsets` (lowest first) on a track `trackLength` long */
export function tickLabelOffsets(tickOffsets: readonly number[], trackLength: number, minGap: number): number[] {
  if (tickOffsets.length === 0) {
    return [];
  }
  // more labels than fit: they share the track evenly instead
  const gap = Math.min(minGap, trackLength / Math.max(1, tickOffsets.length - 1));
  const pushedUp: number[] = [];
  tickOffsets.forEach((offset, index) => {
    const previous = pushedUp[index - 1];
    pushedUp.push(previous === undefined ? Math.max(0, offset) : Math.max(offset, previous + gap));
  });
  const offsets = [...pushedUp];
  for (let index = offsets.length - 1; index >= 0; index--) {
    const next = offsets[index + 1];
    offsets[index] = Math.min(offsets[index] ?? 0, next === undefined ? trackLength : next - gap);
  }
  return offsets;
}

/** a tick's distance from the bottom of the track, for a DMX value on a track of 0 to `maxValue` */
export const tickOffset = (value: number, maxValue: number, trackLength: number): number =>
  (value / maxValue) * trackLength;
