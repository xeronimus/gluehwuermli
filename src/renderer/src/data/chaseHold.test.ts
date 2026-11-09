import {
  HOLD_INPUT_STEP_SECONDS,
  HOLD_MAX_SECONDS,
  HOLD_MIN_SECONDS,
  holdMsOf,
  holdSeconds,
  isValidHoldText
} from './chaseHold';

test('a hold reads in seconds with two decimals', () => {
  expect(holdSeconds(500)).toBe('0.50');
  expect(holdSeconds(50)).toBe('0.05');
  expect(holdSeconds(3_600_000)).toBe('3600.00');
});

test('a typed hold is stored in milliseconds', () => {
  expect(holdMsOf('0.05')).toBe(50);
  expect(holdMsOf('3600')).toBe(3_600_000);
  expect(holdMsOf('1.1')).toBe(1100);
  expect(holdMsOf(' 2 ')).toBe(2000);
  expect(holdMsOf('')).toBeNaN();
  expect(holdMsOf('abc')).toBeNaN();
});

test('a typed hold is rounded to a hundredth of a second, so it reads back as stored', () => {
  expect(holdMsOf('0.055')).toBe(60);
  expect(holdMsOf('0.054')).toBe(50);
  expect(holdMsOf('1.2345')).toBe(1230);
  [50, 60, 1230, 3_600_000].forEach((holdMs) => expect(holdMsOf(holdSeconds(holdMs))).toBe(holdMs));
});

test('the hold field takes hundredths from the shortest to the longest hold', () => {
  expect(HOLD_INPUT_STEP_SECONDS).toBe(0.01);
  expect(HOLD_MIN_SECONDS).toBe(0.05);
  expect(HOLD_MAX_SECONDS).toBe(3600);
});

test('a typed hold is valid from the shortest to the longest hold', () => {
  expect(isValidHoldText('0.05')).toBe(true);
  expect(isValidHoldText('3600')).toBe(true);
  expect(isValidHoldText('0.04')).toBe(false);
  expect(isValidHoldText('3600.01')).toBe(false);
  expect(isValidHoldText('')).toBe(false);
  expect(isValidHoldText('abc')).toBe(false);
});
