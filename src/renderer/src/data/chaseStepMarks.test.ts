import {NO_STEP_ROW_MARKS, rowMarkOf, withRowsPreviewed, withRowsTaken, withTakeForgotten} from './chaseStepMarks';

test('no row is marked at first', () => {
  expect(rowMarkOf(NO_STEP_ROW_MARKS, 'a', '0')).toBe('none');
});

test('a preview marks its rows in its step only, the same row id in another step is not', () => {
  const state = withRowsPreviewed(NO_STEP_ROW_MARKS, {stepId: 'a', valueIds: ['0']});

  expect(rowMarkOf(state, 'a', '0')).toBe('affected');
  expect(rowMarkOf(state, 'a', '1')).toBe('none');
  expect(rowMarkOf(state, 'b', '0')).toBe('none');
  expect(rowMarkOf(withRowsPreviewed(state, undefined), 'a', '0')).toBe('none');
});

test('a click flashes its rows in its step, alternating the flash on each click', () => {
  const first = withRowsTaken(NO_STEP_ROW_MARKS, {stepId: 'a', valueIds: ['0']});
  const second = withRowsTaken(first, {stepId: 'a', valueIds: ['0']});

  expect(rowMarkOf(first, 'a', '0')).toBe('flashOdd');
  expect(rowMarkOf(second, 'a', '0')).toBe('flashEven');
  expect(rowMarkOf(first, 'b', '0')).toBe('none');
  expect(rowMarkOf(first, 'a', '1')).toBe('none');
});

test('a click ends the preview; a preview after it forgets the clicked rows, so leaving it does not flash them again', () => {
  const previewed = withRowsPreviewed(NO_STEP_ROW_MARKS, {stepId: 'a', valueIds: ['1']});
  const taken = withRowsTaken(previewed, {stepId: 'a', valueIds: ['0']});
  const left = withRowsPreviewed(withRowsPreviewed(taken, {stepId: 'a', valueIds: ['1']}), undefined);

  expect(rowMarkOf(taken, 'a', '1')).toBe('none');
  expect(rowMarkOf(left, 'a', '0')).toBe('none');
  expect(left.takeCount).toBe(1);
});

test('another step shown forgets the clicked rows, so they do not flash again when their step is shown again', () => {
  const taken = withRowsTaken(NO_STEP_ROW_MARKS, {stepId: 'a', valueIds: ['0']});

  expect(rowMarkOf(withTakeForgotten(taken), 'a', '0')).toBe('none');
  expect(withTakeForgotten(NO_STEP_ROW_MARKS)).toBe(NO_STEP_ROW_MARKS);
});
