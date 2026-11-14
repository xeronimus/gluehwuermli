import {mainConfigOf} from './config';

test('the output is simulated only with MAIN_VITE_SIMULATED_OUTPUT=1', () => {
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: '1'}, false, 'win32').simulatedOutput).toBe(true);
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: '0'}, false, 'win32').simulatedOutput).toBe(false);
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: 'true'}, false, 'win32').simulatedOutput).toBe(false);
  expect(mainConfigOf({}, false, 'win32').simulatedOutput).toBe(false);
});

test('logs at info unless MAIN_VITE_LOG_LEVEL names another level', () => {
  expect(mainConfigOf({}, false, 'win32').logLevel).toBe('info');
  expect(mainConfigOf({MAIN_VITE_LOG_LEVEL: 'debug'}, false, 'win32').logLevel).toBe('debug');
  expect(mainConfigOf({MAIN_VITE_LOG_LEVEL: 'warn'}, true, 'win32').logLevel).toBe('warn');
});

test('an unknown log level falls back to info', () => {
  expect(mainConfigOf({MAIN_VITE_LOG_LEVEL: 'DEBUG'}, false, 'win32').logLevel).toBe('info');
  expect(mainConfigOf({MAIN_VITE_LOG_LEVEL: ''}, false, 'win32').logLevel).toBe('info');
});

test('writes a log file in a packaged app only', () => {
  expect(mainConfigOf({}, true, 'win32').logToFile).toBe(true);
  expect(mainConfigOf({}, false, 'win32').logToFile).toBe(false);
});

test('updates itself in a packaged app only', () => {
  expect(mainConfigOf({}, true, 'win32').autoUpdate).toBe(true);
  expect(mainConfigOf({}, false, 'win32').autoUpdate).toBe(false);
});

test('never updates itself on macOS, the app is not signed with a Developer ID', () => {
  expect(mainConfigOf({}, true, 'darwin').autoUpdate).toBe(false);
  expect(mainConfigOf({}, false, 'darwin').autoUpdate).toBe(false);
});

test('a packaged macOS app still writes a log file', () => {
  expect(mainConfigOf({}, true, 'darwin').logToFile).toBe(true);
});
