import {describeOutputStatus, describePort, preferredPortPath} from './outputStatus';

const COM1 = {path: 'COM1', likelyEnttecPro: false};
const COM3 = {path: 'COM3', manufacturer: 'FTDI', likelyEnttecPro: true};

describe('preferredPortPath', () => {
  test('keeps the current choice while the port is still there', () => {
    expect(preferredPortPath([COM1, COM3], 'COM1')).toBe('COM1');
  });

  test('otherwise prefers a likely Enttec Pro', () => {
    expect(preferredPortPath([COM1, COM3], undefined)).toBe('COM3');
    expect(preferredPortPath([COM1, COM3], 'COM7')).toBe('COM3');
  });

  test('otherwise the first port, or none', () => {
    expect(preferredPortPath([COM1], undefined)).toBe('COM1');
    expect(preferredPortPath([], 'COM1')).toBeUndefined();
  });
});

test('describePort names manufacturer and the Enttec hint', () => {
  expect(describePort(COM3)).toBe('COM3 (FTDI) – Enttec?');
  expect(describePort(COM1)).toBe('COM1');
});

test('describeOutputStatus', () => {
  expect(describeOutputStatus({type: 'connected', path: 'COM3'})).toBe('Sending on COM3');
  expect(describeOutputStatus({type: 'failed', path: 'COM3', message: 'Access denied'})).toBe('COM3: Access denied');
});
