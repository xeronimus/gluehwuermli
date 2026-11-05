/** one place towards the start of a list (shown to the left) or towards its end (to the right) */
export type MoveDirection = 'earlier' | 'later';

const STEP: Record<MoveDirection, number> = {earlier: -1, later: 1};

/** whether the item at `index` of `count` items can move one place in `direction`: never past either end */
export function canMove(count: number, index: number, direction: MoveDirection): boolean {
  const target = index + STEP[direction];
  return index >= 0 && index < count && target >= 0 && target < count;
}

/** a copy of `items` with the item at `index` swapped with its neighbour in `direction`; unchanged at either end */
export function moved<T>(items: readonly T[], index: number, direction: MoveDirection): T[] {
  if (!canMove(items.length, index, direction)) {
    return [...items];
  }
  const first = Math.min(index, index + STEP[direction]);
  return [
    ...items.slice(0, first),
    ...items.slice(first + 1, first + 2),
    ...items.slice(first, first + 1),
    ...items.slice(first + 2)
  ];
}

/** `moved` for the item with the id; an unknown id changes nothing */
export const movedWithId = <T extends {readonly id: string}>(
  items: readonly T[],
  id: string,
  direction: MoveDirection
): T[] =>
  moved(
    items,
    items.findIndex((item) => item.id === id),
    direction
  );
