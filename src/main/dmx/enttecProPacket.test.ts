import {DMX_UNIVERSE_SIZE} from '@shared/dmx';

import {enttecProDmxPacket} from './enttecProPacket';

test('frames a full universe as a label 6 packet with the start code before channel 1', () => {
  const universe = new Uint8Array(DMX_UNIVERSE_SIZE);
  universe[0] = 255;
  universe[511] = 42;

  const packet = enttecProDmxPacket(universe);

  // 513 data bytes (start code + 512 channels) = 0x0201
  expect(Array.from(packet.slice(0, 6))).toEqual([0x7e, 6, 0x01, 0x02, 0x00, 255]);
  expect(packet[packet.length - 2]).toBe(42);
  expect(packet[packet.length - 1]).toBe(0xe7);
  expect(packet.length).toBe(4 + 513 + 1);
});

test('a short universe gets a matching length', () => {
  const packet = enttecProDmxPacket(new Uint8Array([1, 2, 3]));

  expect(Array.from(packet)).toEqual([0x7e, 6, 4, 0, 0x00, 1, 2, 3, 0xe7]);
});

test('the packet is a copy, later changes to the universe do not leak into it', () => {
  const universe = new Uint8Array([10]);
  const packet = enttecProDmxPacket(universe);

  universe[0] = 99;

  expect(packet[5]).toBe(10);
});
