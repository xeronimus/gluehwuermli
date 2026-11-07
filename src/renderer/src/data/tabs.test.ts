import {tabAfterKey} from './tabs';

test('the arrow keys switch to the next and the previous tab, wrapping around at the ends', () => {
  expect(tabAfterKey(0, 'ArrowRight', 3)).toBe(1);
  expect(tabAfterKey(2, 'ArrowRight', 3)).toBe(0);
  expect(tabAfterKey(1, 'ArrowLeft', 3)).toBe(0);
  expect(tabAfterKey(0, 'ArrowLeft', 3)).toBe(2);
});

test('Home and End switch to the first and the last tab', () => {
  expect(tabAfterKey(1, 'Home', 3)).toBe(0);
  expect(tabAfterKey(1, 'End', 3)).toBe(2);
});

test('other keys and an empty tab list switch nothing', () => {
  expect(tabAfterKey(1, 'ArrowDown', 3)).toBeUndefined();
  expect(tabAfterKey(1, 'a', 3)).toBeUndefined();
  expect(tabAfterKey(0, 'ArrowRight', 0)).toBeUndefined();
});
