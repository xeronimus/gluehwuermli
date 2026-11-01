import {describeOutputStatus, describePort, preferredPortPath} from './outputStatus';

const COM1 = {path: 'COM1', likelyEnttecPro: false};
const COM2 = {path: 'COM2', likelyEnttecPro: false};
const COM3 = {path: 'COM3', manufacturer: 'FTDI', likelyEnttecPro: true};

const NONE = {type: 'none'} as const;
const remembered = (path: string) => ({type: 'remembered', path}) as const;

describe('preferredPortPath', () => {
  test('keeps the port chosen by hand while it is still there', () => {
    expect(preferredPortPath([COM1, COM2, COM3], 'COM1', remembered('COM2'))).toBe('COM1');
  });

  test('the remembered port plugged in later wins over a port only preselected before', () => {
    // at start only COM1 is there and preselected, nothing chosen by hand
    expect(preferredPortPath([COM1], undefined, remembered('COM3'))).toBe('COM1');
    expect(preferredPortPath([COM1, COM3], undefined, remembered('COM3'))).toBe('COM3');
  });

  test('otherwise the port connected to last time', () => {
    expect(preferredPortPath([COM1, COM2, COM3], undefined, remembered('COM2'))).toBe('COM2');
    expect(preferredPortPath([COM1, COM2, COM3], 'COM7', remembered('COM2'))).toBe('COM2');
  });

  test('otherwise prefers a likely Enttec Pro', () => {
    expect(preferredPortPath([COM1, COM3], undefined, NONE)).toBe('COM3');
    expect(preferredPortPath([COM1, COM3], 'COM7', remembered('COM8'))).toBe('COM3');
  });

  test('otherwise the first port, or none', () => {
    expect(preferredPortPath([COM1], undefined, NONE)).toBe('COM1');
    expect(preferredPortPath([], 'COM1', remembered('COM1'))).toBeUndefined();
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
