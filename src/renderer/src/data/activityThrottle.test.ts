import {createActivityThrottle} from './activityThrottle';

test('reports the first activity, then at most once per interval', () => {
  let time = 1000;
  const shouldReport = createActivityThrottle(30_000, () => time);

  expect(shouldReport()).toBe(true);
  time += 29_999;
  expect(shouldReport()).toBe(false);
  time += 1;
  expect(shouldReport()).toBe(true);
  expect(shouldReport()).toBe(false);
});
