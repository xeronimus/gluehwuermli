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
  /** the port closed by itself (unplugged); a code, the renderer says it in the UI language */
  Type.Object({type: Type.Literal('failed'), path: Type.String(), reason: Type.Literal('port-closed')}),
  /** opening or writing failed; `message` is the raw text of serialport or the OS, shown as it is */
  Type.Object({
    type: Type.Literal('failed'),
    path: Type.String(),
    reason: Type.Literal('port-error'),
    message: Type.String()
  })
]);
export type DmxOutputStatus = Static<typeof DmxOutputStatusSchema>;

/** the port the output was last connected to, preselected on start (never connected on its own); `none` before the first one */
export const RememberedPortSchema = Type.Union([
  Type.Object({type: Type.Literal('none')}),
  Type.Object({type: Type.Literal('remembered'), path: Type.String({minLength: 1})})
]);
export type RememberedPort = Static<typeof RememberedPortSchema>;

/** the highest value the channel may have while the channel lock is on, e.g. 0 for a laser */
export const ChannelLockSchema = Type.Object({
  max: Type.Integer({minimum: DMX_MIN_VALUE, maximum: DMX_MAX_VALUE})
});
export type ChannelLock = Static<typeof ChannelLockSchema>;

/** one channel of a fixture: its address is the fixture's start address plus `offset` */
export const FixtureChannelSchema = Type.Object({
  name: Type.String({minLength: 1}),
  offset: Type.Integer({minimum: 0, maximum: LAST_DMX_CHANNEL - FIRST_DMX_CHANNEL}),
  /** optional, so older files load; a channel without one is never capped */
  lock: Type.Optional(ChannelLockSchema)
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

/** short enough to fit on a button */
export const SCENE_NAME_MAX_LENGTH = 40;

/** the values a scene sets on one fixture's channels, keyed by offset like a preset's */
export const SceneFixtureSchema = Type.Object({
  fixtureId: Type.String({minLength: 1}),
  values: Type.Array(FixturePresetValueSchema, {minItems: 1})
});
export type SceneFixture = Static<typeof SceneFixtureSchema>;

/**
 * a named button setting the channels of several fixtures at once; the channels of the fixtures it doesn't name stay
 * as they are, so scenes can be layered
 */
export const SceneSchema = Type.Object({
  id: Type.String({minLength: 1}),
  name: Type.String({minLength: 1, maxLength: SCENE_NAME_MAX_LENGTH}),
  fixtures: Type.Array(SceneFixtureSchema, {minItems: 1})
});
export type Scene = Static<typeof SceneSchema>;

/**
 * the version of a project file, so a later format change can migrate an older file instead of dropping it; a file
 * with a higher one is refused, never overwritten
 */
export const PROJECT_VERSION = 1;

/** every fixture and scene of a project, as stored in its .glp file; the file name is the project's name */
export const FixtureSetupSchema = Type.Object({
  version: Type.Literal(PROJECT_VERSION),
  fixtures: Type.Array(FixtureSchema),
  /** optional, so older files load */
  scenes: Type.Optional(Type.Array(SceneSchema))
});
export type FixtureSetup = Static<typeof FixtureSetupSchema>;

/**
 * why a project file couldn't be opened or created, as a code: the renderer says it in the UI language. `unreadable`
 * and `not-writable` carry the raw text of the OS, shown as it is
 */
export const ProjectErrorSchema = Type.Union([
  Type.Object({reason: Type.Literal('missing')}),
  Type.Object({reason: Type.Literal('unreadable'), message: Type.String()}),
  /** no JSON, another shape, or a setup that fails its validation */
  Type.Object({reason: Type.Literal('invalid')}),
  /** written by a newer version of the app */
  Type.Object({reason: Type.Literal('too-new'), version: Type.Number()}),
  /** a new project's file couldn't be created, e.g. a read-only folder */
  Type.Object({reason: Type.Literal('not-writable'), message: Type.String()})
]);
export type ProjectError = Static<typeof ProjectErrorSchema>;

/** a project open in the app: its .glp file and what it holds */
export const OpenProjectSchema = Type.Object({
  path: Type.String({minLength: 1}),
  setup: FixtureSetupSchema
});
export type OpenProject = Static<typeof OpenProjectSchema>;

/**
 * the project the app works on: `none` before the first one, `failed` when the last one couldn't be opened on start.
 * Pushed over PROJECT_CHANGED whenever another project is opened
 */
export const ProjectStatusSchema = Type.Union([
  Type.Object({type: Type.Literal('none')}),
  Type.Object({type: Type.Literal('open'), project: OpenProjectSchema}),
  Type.Object({type: Type.Literal('failed'), path: Type.String({minLength: 1}), error: ProjectErrorSchema})
]);
export type ProjectStatus = Static<typeof ProjectStatusSchema>;

/**
 * what creating or opening a project answers: `cancelled` when the file dialog was closed, `failed` when the file
 * couldn't be opened (the project open before stays open)
 */
export const ProjectOpenResultSchema = Type.Union([
  Type.Object({type: Type.Literal('opened'), project: OpenProjectSchema}),
  Type.Object({type: Type.Literal('cancelled')}),
  Type.Object({type: Type.Literal('failed'), path: Type.String({minLength: 1}), error: ProjectErrorSchema})
]);
export type ProjectOpenResult = Static<typeof ProjectOpenResultSchema>;

/** a project opened before; `exists` false when its file is gone (deleted, moved, on a stick not plugged in) */
export const RecentProjectSchema = Type.Object({
  path: Type.String({minLength: 1}),
  exists: Type.Boolean()
});
export type RecentProject = Static<typeof RecentProjectSchema>;

/** a project file named by its path: opening a recent one, removing it from the list, a .glp double-clicked */
export const ProjectPathRequestSchema = Type.Object({
  path: Type.String({minLength: 1})
});
export type ProjectPathRequest = Static<typeof ProjectPathRequestSchema>;

/** the changed setup, with the project it belongs to: a save meant for another project is refused */
export const SaveFixturesRequestSchema = Type.Object({
  projectPath: Type.String({minLength: 1}),
  setup: Type.Unknown()
});
export type SaveFixturesRequest = Static<typeof SaveFixturesRequestSchema>;

/** Electron's userData folder, where the app keeps its own files (the settings, the window state) */
export const DataFolderSchema = Type.Object({
  path: Type.String({minLength: 1})
});
export type DataFolder = Static<typeof DataFolderSchema>;

/**
 * opening the data folder in the file explorer; `refused` in Show mode, `failed` e.g. when the folder was deleted, with
 * the raw text of the shell
 */
export const OpenDataFolderResultSchema = Type.Union([
  Type.Object({type: Type.Literal('opened')}),
  Type.Object({type: Type.Literal('refused')}),
  Type.Object({type: Type.Literal('failed'), message: Type.String()})
]);
export type OpenDataFolderResult = Static<typeof OpenDataFolderResultSchema>;

/** the languages of the UI; English is the source language, the texts in the code */
export const LocaleSchema = Type.Union([Type.Literal('en'), Type.Literal('de')]);
export type Locale = Static<typeof LocaleSchema>;

/** the language chosen in the app, kept in the settings; `none` until one is chosen, then the OS language decides */
export const ChosenLocaleSchema = Type.Union([
  Type.Object({type: Type.Literal('none')}),
  Type.Object({type: Type.Literal('chosen'), locale: LocaleSchema})
]);
export type ChosenLocale = Static<typeof ChosenLocaleSchema>;

export const SetLocaleRequestSchema = Type.Object({
  locale: LocaleSchema
});
export type SetLocaleRequest = Static<typeof SetLocaleRequestSchema>;

/** whether an all-zero universe is sent before the port is closed on quit; also changed in Show mode */
export const BlackoutOnQuitSchema = Type.Object({
  enabled: Type.Boolean()
});
export type BlackoutOnQuit = Static<typeof BlackoutOnQuitSchema>;

/**
 * Two independent locks, both on after every start. The mode: in Show mode fixtures can be played, not changed; Setup
 * mode (unlocked with the password) allows changing them. The channel lock caps the locked channels; lifting it needs
 * the password too, and it stays lifted in Show mode, e.g. for a show where the laser hangs high enough.
 * `passwordSet` false means the next password typed becomes the password.
 */
export const LockStatusSchema = Type.Object({
  mode: Type.Union([Type.Literal('show'), Type.Literal('setup')]),
  passwordSet: Type.Boolean(),
  channelLocked: Type.Boolean()
});
export type LockStatus = Static<typeof LockStatusSchema>;

/** long enough not to be guessed by a guest at the laptop, short enough to type at an event */
export const PASSWORD_MIN_LENGTH = 4;
export const PASSWORD_MAX_LENGTH = 200;

const PasswordSchema = Type.String({minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH});

export const UnlockRequestSchema = Type.Object({
  password: PasswordSchema
});
export type UnlockRequest = Static<typeof UnlockRequestSchema>;

/** no password in Setup mode, where it was typed to get there; Show mode needs it */
export const LiftChannelLockRequestSchema = Type.Object({
  password: Type.Optional(PasswordSchema)
});
export type LiftChannelLockRequest = Static<typeof LiftChannelLockRequestSchema>;

/** Setup mode only; the current password too, so nobody passing a Setup mode left open can take the password over */
export const ChangePasswordRequestSchema = Type.Object({
  currentPassword: PasswordSchema,
  newPassword: PasswordSchema
});
export type ChangePasswordRequest = Static<typeof ChangePasswordRequestSchema>;

/** what unlocking Setup mode, lifting the channel lock or changing the password answers */
export const PasswordResultSchema = Type.Union([
  Type.Object({type: Type.Literal('accepted')}),
  Type.Object({type: Type.Literal('wrong-password')})
]);
export type PasswordResult = Static<typeof PasswordResultSchema>;

/** the payload if it is a valid request, otherwise undefined */
export const parseSetChannelRequest = (payload: unknown): SetChannelRequest | undefined =>
  Value.Check(SetChannelRequestSchema, payload) ? payload : undefined;

export const parseSetChannelValuesRequest = (payload: unknown): SetChannelValuesRequest | undefined =>
  Value.Check(SetChannelValuesRequestSchema, payload) ? payload : undefined;

export const parseConnectRequest = (payload: unknown): ConnectRequest | undefined =>
  Value.Check(ConnectRequestSchema, payload) ? payload : undefined;

export const parseSetLocaleRequest = (payload: unknown): SetLocaleRequest | undefined =>
  Value.Check(SetLocaleRequestSchema, payload) ? payload : undefined;

export const parseBlackoutOnQuit = (payload: unknown): BlackoutOnQuit | undefined =>
  Value.Check(BlackoutOnQuitSchema, payload) ? payload : undefined;

export const parseUnlockRequest = (payload: unknown): UnlockRequest | undefined =>
  Value.Check(UnlockRequestSchema, payload) ? payload : undefined;

export const parseLiftChannelLockRequest = (payload: unknown): LiftChannelLockRequest | undefined =>
  Value.Check(LiftChannelLockRequestSchema, payload) ? payload : undefined;

export const parseChangePasswordRequest = (payload: unknown): ChangePasswordRequest | undefined =>
  Value.Check(ChangePasswordRequestSchema, payload) ? payload : undefined;

export const parseProjectPathRequest = (payload: unknown): ProjectPathRequest | undefined =>
  Value.Check(ProjectPathRequestSchema, payload) ? payload : undefined;

export const parseSaveFixturesRequest = (payload: unknown): SaveFixturesRequest | undefined =>
  Value.Check(SaveFixturesRequestSchema, payload) ? payload : undefined;
