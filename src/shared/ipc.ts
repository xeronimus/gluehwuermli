import Type, {type Static} from 'typebox';
import Value from 'typebox/value';

import {DMX_MAX_VALUE, DMX_MIN_VALUE, DMX_UNIVERSE_SIZE, FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from './dmx';

/** the payloads crossing the IpcChannels (ipcChannels.ts): the main process checks what it receives against them */
export const SetChannelRequestSchema = Type.Object({
  channel: Type.Integer({minimum: FIRST_DMX_CHANNEL, maximum: LAST_DMX_CHANNEL}),
  value: Type.Integer({minimum: DMX_MIN_VALUE, maximum: DMX_MAX_VALUE})
});
export type SetChannelRequest = Static<typeof SetChannelRequestSchema>;

/** several channels at once, e.g. a preset: one message instead of one per channel */
export const SetChannelValuesRequestSchema = Type.Object({
  values: Type.Array(SetChannelRequestSchema, {minItems: 1, maxItems: DMX_UNIVERSE_SIZE})
});
export type SetChannelValuesRequest = Static<typeof SetChannelValuesRequestSchema>;

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

/** a line or two below the faders */
export const FIXTURE_HINT_MAX_LENGTH = 200;

/** short enough to fit on a button */
export const FIXTURE_PRESET_NAME_MAX_LENGTH = 40;

/** the value a preset sets on the fixture channel with this offset */
export const FixturePresetValueSchema = Type.Object({
  offset: Type.Integer({minimum: 0, maximum: LAST_DMX_CHANNEL - FIRST_DMX_CHANNEL}),
  value: Type.Integer({minimum: DMX_MIN_VALUE, maximum: DMX_MAX_VALUE})
});
export type FixturePresetValue = Static<typeof FixturePresetValueSchema>;

/**
 * a named button setting some or all of the fixture's channels at once; keyed by offset, so it still fits after the
 * start address changed
 */
export const FixturePresetSchema = Type.Object({
  id: Type.String({minLength: 1}),
  name: Type.String({minLength: 1, maxLength: FIXTURE_PRESET_NAME_MAX_LENGTH}),
  values: Type.Array(FixturePresetValueSchema, {minItems: 1})
});
export type FixturePreset = Static<typeof FixturePresetSchema>;

/** a device on the rig, e.g. a PAR or a smoke machine */
export const FixtureSchema = Type.Object({
  id: Type.String({minLength: 1}),
  name: Type.String({minLength: 1}),
  startAddress: Type.Integer({minimum: FIRST_DMX_CHANNEL, maximum: LAST_DMX_CHANNEL}),
  channels: Type.Array(FixtureChannelSchema, {minItems: 1}),
  /** free text: the DMX mode, DIP switch settings, where it hangs, who it belongs to; optional, so older files load */
  description: Type.Optional(Type.String({maxLength: FIXTURE_DESCRIPTION_MAX_LENGTH})),
  /** short free text shown below the faders, e.g. "warm up 2 min before smoke"; optional, so older files load */
  hint: Type.Optional(Type.String({maxLength: FIXTURE_HINT_MAX_LENGTH})),
  /** optional, so older files load */
  presets: Type.Optional(Type.Array(FixturePresetSchema))
});
export type Fixture = Static<typeof FixtureSchema>;

/** the version of the stored setup, so a later format change can migrate an older file instead of dropping it */
export const FIXTURE_SETUP_VERSION = 1;

/** every fixture, as stored in the fixtures file and sent over LOAD_FIXTURES / SAVE_FIXTURES */
export const FixtureSetupSchema = Type.Object({
  version: Type.Literal(FIXTURE_SETUP_VERSION),
  fixtures: Type.Array(FixtureSchema)
});
export type FixtureSetup = Static<typeof FixtureSetupSchema>;

/** the payload if it is a valid request, otherwise undefined */
export const parseSetChannelRequest = (payload: unknown): SetChannelRequest | undefined =>
  Value.Check(SetChannelRequestSchema, payload) ? payload : undefined;

export const parseSetChannelValuesRequest = (payload: unknown): SetChannelValuesRequest | undefined =>
  Value.Check(SetChannelValuesRequestSchema, payload) ? payload : undefined;

export const parseConnectRequest = (payload: unknown): ConnectRequest | undefined =>
  Value.Check(ConnectRequestSchema, payload) ? payload : undefined;
