import Type, {type Static} from 'typebox';
import Value from 'typebox/value';

import {DMX_MAX_VALUE, DMX_MIN_VALUE, FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from './dmx';

/** the payloads crossing the IpcChannels (ipcChannels.ts): the main process checks what it receives against them */
export const SetChannelRequestSchema = Type.Object({
  channel: Type.Integer({minimum: FIRST_DMX_CHANNEL, maximum: LAST_DMX_CHANNEL}),
  value: Type.Integer({minimum: DMX_MIN_VALUE, maximum: DMX_MAX_VALUE})
});
export type SetChannelRequest = Static<typeof SetChannelRequestSchema>;

export const ConnectRequestSchema = Type.Object({
  path: Type.String({minLength: 1})
});
export type ConnectRequest = Static<typeof ConnectRequestSchema>;

/** a serial port the OS reports; `likelyEnttecPro` when its USB ids are those of the FTDI chip the Pro uses */
export const SerialPortDescriptionSchema = Type.Object({
  path: Type.String(),
  manufacturer: Type.Optional(Type.String()),
  likelyEnttecPro: Type.Boolean()
});
export type SerialPortDescription = Static<typeof SerialPortDescriptionSchema>;

export const DmxOutputStatusSchema = Type.Union([
  Type.Object({type: Type.Literal('disconnected')}),
  Type.Object({type: Type.Literal('connecting'), path: Type.String()}),
  Type.Object({type: Type.Literal('connected'), path: Type.String()}),
  Type.Object({type: Type.Literal('failed'), path: Type.String(), message: Type.String()})
]);
export type DmxOutputStatus = Static<typeof DmxOutputStatusSchema>;

/** one channel of a fixture: its address is the fixture's start address plus `offset` */
export const FixtureChannelSchema = Type.Object({
  name: Type.String({minLength: 1}),
  offset: Type.Integer({minimum: 0, maximum: LAST_DMX_CHANNEL - FIRST_DMX_CHANNEL})
});
export type FixtureChannel = Static<typeof FixtureChannelSchema>;

/** plenty for notes on a device, short enough that a pasted manual doesn't end up in the setup file */
export const FIXTURE_DESCRIPTION_MAX_LENGTH = 2000;

/** a device on the rig, e.g. a PAR or a smoke machine */
export const FixtureSchema = Type.Object({
  id: Type.String({minLength: 1}),
  name: Type.String({minLength: 1}),
  startAddress: Type.Integer({minimum: FIRST_DMX_CHANNEL, maximum: LAST_DMX_CHANNEL}),
  channels: Type.Array(FixtureChannelSchema, {minItems: 1}),
  /** free text: the DMX mode, DIP switch settings, where it hangs, who it belongs to; optional, so older files load */
  description: Type.Optional(Type.String({maxLength: FIXTURE_DESCRIPTION_MAX_LENGTH}))
});
export type Fixture = Static<typeof FixtureSchema>;

/** the version of the stored setup, so a later format change can migrate an older file instead of dropping it */
export const FIXTURE_SETUP_VERSION = 1;

/** every fixture, as stored in the fixtures file and sent over FIXTURES_LOAD / FIXTURES_SAVE */
export const FixtureSetupSchema = Type.Object({
  version: Type.Literal(FIXTURE_SETUP_VERSION),
  fixtures: Type.Array(FixtureSchema)
});
export type FixtureSetup = Static<typeof FixtureSetupSchema>;

/** the payload if it is a valid request, otherwise undefined */
export const parseSetChannelRequest = (payload: unknown): SetChannelRequest | undefined =>
  Value.Check(SetChannelRequestSchema, payload) ? payload : undefined;

export const parseConnectRequest = (payload: unknown): ConnectRequest | undefined =>
  Value.Check(ConnectRequestSchema, payload) ? payload : undefined;
