/**
 * Framing of the Enttec DMX USB Pro API: start delimiter, label, data length (LSB, MSB), data, end delimiter.
 * The widget keeps sending the last universe it received on its own DMX clock, so a packet is only needed on change.
 */
const START_OF_MESSAGE = 0x7e;
const END_OF_MESSAGE = 0xe7;
const HEADER_LENGTH = 4;
const FOOTER_LENGTH = 1;

/** "Output Only Send DMX Packet Request" */
const LABEL_SEND_DMX = 6;

/** the DMX start code of a dimmer/fixture universe, sent before channel 1 */
const DMX_NULL_START_CODE = 0x00;

const BYTE_MASK = 0xff;
const BITS_PER_BYTE = 8;

/** the label 6 packet sending `universe` (index 0 is channel 1) */
export function enttecProDmxPacket(universe: Uint8Array): Uint8Array {
  const dataLength = universe.length + 1;
  const packet = new Uint8Array(HEADER_LENGTH + dataLength + FOOTER_LENGTH);

  packet[0] = START_OF_MESSAGE;
  packet[1] = LABEL_SEND_DMX;
  packet[2] = dataLength & BYTE_MASK;
  packet[3] = (dataLength >> BITS_PER_BYTE) & BYTE_MASK;
  packet[HEADER_LENGTH] = DMX_NULL_START_CODE;
  packet.set(universe, HEADER_LENGTH + 1);
  packet[packet.length - 1] = END_OF_MESSAGE;

  return packet;
}
