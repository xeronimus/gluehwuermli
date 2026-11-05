import {canMove, moved, movedWithId} from './listOrder';

const letters = ['a', 'b', 'c', 'd'] as const;

test('moves an item one place earlier or later, the rest keeps its order', () => {
  expect(moved(letters, 2, 'earlier')).toEqual(['a', 'c', 'b', 'd']);
  expect(moved(letters, 1, 'later')).toEqual(['a', 'c', 'b', 'd']);
  expect(moved(letters, 0, 'later')).toEqual(['b', 'a', 'c', 'd']);
  expect(moved(letters, 3, 'earlier')).toEqual(['a', 'b', 'd', 'c']);
});

test('nothing moves past either end or from an index outside the list', () => {
  expect(moved(letters, 0, 'earlier')).toEqual(letters);
  expect(moved(letters, 3, 'later')).toEqual(letters);
  expect(moved(letters, -1, 'later')).toEqual(letters);
  expect(moved(letters, 4, 'earlier')).toEqual(letters);
  expect(moved([], 0, 'later')).toEqual([]);
});

test('leaves the given list as it is', () => {
  const items = ['a', 'b'];

  moved(items, 0, 'later');

  expect(items).toEqual(['a', 'b']);
});

test('the first item can only move later, the last only earlier, a single one not at all', () => {
  expect(canMove(3, 0, 'earlier')).toBe(false);
  expect(canMove(3, 0, 'later')).toBe(true);
  expect(canMove(3, 2, 'earlier')).toBe(true);
  expect(canMove(3, 2, 'later')).toBe(false);
  expect(canMove(1, 0, 'earlier')).toBe(false);
  expect(canMove(1, 0, 'later')).toBe(false);
});

test('moves the item with the id; an unknown id changes nothing', () => {
  const items = [{id: 'front'}, {id: 'back'}, {id: 'smoke'}];

  expect(movedWithId(items, 'smoke', 'earlier')).toEqual([{id: 'front'}, {id: 'smoke'}, {id: 'back'}]);
  expect(movedWithId(items, 'laser', 'earlier')).toEqual(items);
});
