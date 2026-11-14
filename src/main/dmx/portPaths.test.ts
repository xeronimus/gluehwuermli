import type {SerialPortDescription} from '@shared/ipc';

import {calloutPortsOf} from './portPaths';

const portAt = (path: string): SerialPortDescription => ({path, manufacturer: 'FTDI', likelyEnttecPro: true});

test('a device listed as tty and cu is listed once, by its cu path', () => {
  expect(calloutPortsOf([portAt('/dev/tty.usbserial-A1'), portAt('/dev/cu.usbserial-A1')])).toEqual([
    portAt('/dev/cu.usbserial-A1')
  ]);
  expect(calloutPortsOf([portAt('/dev/cu.usbserial-A1'), portAt('/dev/tty.usbserial-A1')])).toEqual([
    portAt('/dev/cu.usbserial-A1')
  ]);
});

test('a device listed only as tty is listed by its cu path, with its manufacturer and hint', () => {
  expect(calloutPortsOf([portAt('/dev/tty.usbserial-A1')])).toEqual([portAt('/dev/cu.usbserial-A1')]);
});

test('different devices are all listed, in their order', () => {
  const bluetooth = {path: '/dev/cu.Bluetooth-Incoming-Port', likelyEnttecPro: false};
  expect(calloutPortsOf([bluetooth, portAt('/dev/cu.usbserial-A1')])).toEqual([
    bluetooth,
    portAt('/dev/cu.usbserial-A1')
  ]);
});

test('a path without the tty. prefix is left as it is', () => {
  expect(calloutPortsOf([portAt('/dev/ttys000'), portAt('COM3')])).toEqual([portAt('/dev/ttys000'), portAt('COM3')]);
});

test('no ports, none listed', () => {
  expect(calloutPortsOf([])).toEqual([]);
});
