import {mainConfigOf} from './config';

test('the output is simulated only with MAIN_VITE_SIMULATED_OUTPUT=1', () => {
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: '1'}, false).simulatedOutput).toBe(true);
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: '0'}, false).simulatedOutput).toBe(false);
  expect(mainConfigOf({MAIN_VITE_SIMULATED_OUTPUT: 'true'}, false).simulatedOutput).toBe(false);
  expect(mainConfigOf({}, false).simulatedOutput).toBe(false);
});

test('logs at info unless MAIN_VITE_LOG_LEVEL names another level', () => {
  expect(mainConfigOf({}, false).logLevel).toBe('info');
  expect(mainConfigOf({MAIN_VITE_LOG_LEVEL: 'debug'}, false).logLevel).toBe('debug');
  expect(mainConfigOf({MAIN_VITE_LOG_LEVEL: 'warn'}, true).logLevel).toBe('warn');
});

test('an unknown log level falls back to info', () => {
  expect(mainConfigOf({MAIN_VITE_LOG_LEVEL: 'DEBUG'}, false).logLevel).toBe('info');
  expect(mainConfigOf({MAIN_VITE_LOG_LEVEL: ''}, false).logLevel).toBe('info');
});

test('writes a log file in a packaged app only', () => {
  expect(mainConfigOf({}, true).logToFile).toBe(true);
  expect(mainConfigOf({}, false).logToFile).toBe(false);
});

test('updates itself in a packaged app only', () => {
  expect(mainConfigOf({}, true).autoUpdate).toBe(true);
  expect(mainConfigOf({}, false).autoUpdate).toBe(false);
});
