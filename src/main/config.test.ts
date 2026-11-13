import {mainConfigOf} from './config';

test('the output is simulated only with MAIN_VITE_SIMULATED_OUTPUT=1', () => {
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: '1'}, false, []).simulatedOutput).toBe(true);
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: '0'}, false, []).simulatedOutput).toBe(false);
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: 'true'}, false, []).simulatedOutput).toBe(false);
  expect(mainConfigOf({}, false, []).simulatedOutput).toBe(false);
});

test('debug logging outside a packaged app, or in one started with --debug-log', () => {
  expect(mainConfigOf({}, false, []).debug).toBe(true);
  expect(mainConfigOf({}, true, []).debug).toBe(false);
  expect(mainConfigOf({}, true, ['Glühwürmli.exe', '--debug-log']).debug).toBe(true);
});
