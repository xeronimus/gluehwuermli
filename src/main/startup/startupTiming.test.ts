import {startupTimingFactory} from './startupTiming';

test('the summary lists the milestones in the order reached, in seconds since the process started', () => {
  const uptimes = [0.214, 0.5, 1.987];
  const timing = startupTimingFactory(() => uptimes.shift() ?? 0);

  timing.mark('main-entered');
  timing.mark('app-ready');
  timing.mark('window-shown');

  expect(timing.summary()).toBe('main-entered 0.21 s, app-ready 0.50 s, window-shown 1.99 s');
});

test('nothing reached, an empty summary', () => {
  expect(startupTimingFactory(() => 1).summary()).toBe('');
});
