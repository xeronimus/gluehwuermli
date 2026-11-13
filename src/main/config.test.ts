import {mainConfigOf} from './config';

test('the output is simulated only with MAIN_VITE_SIMULATED_OUTPUT=1', () => {
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: '1'}, false).simulatedOutput).toBe(true);
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: '0'}, false).simulatedOutput).toBe(false);
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: 'true'}, false).simulatedOutput).toBe(false);
  expect(mainConfigOf({}, false).simulatedOutput).toBe(false);
});

test('debug logging outside a packaged app only', () => {
  expect(mainConfigOf({}, false).debug).toBe(true);
  expect(mainConfigOf({}, true).debug).toBe(false);
});

test('updates itself in a packaged app only', () => {
  expect(mainConfigOf({}, true).autoUpdate).toBe(true);
  expect(mainConfigOf({}, false).autoUpdate).toBe(false);
});
