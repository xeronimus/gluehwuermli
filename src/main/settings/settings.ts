import Type, {type Static} from 'typebox';
import Value from 'typebox/value';

const HEX_PATTERN = '^[0-9a-f]+$';

/** a salted scrypt hash of the password, never the password itself (lock/passwordHash.ts) */
export const PasswordHashSchema = Type.Object({
  salt: Type.String({pattern: HEX_PATTERN}),
  hash: Type.String({pattern: HEX_PATTERN})
});
export type PasswordHash = Static<typeof PasswordHashSchema>;

/**
 * the version of the stored settings, so a later format change can migrate an older file. New optional fields keep
 * it: a file without them is still valid, and an older app version ignores them
 */
export const SETTINGS_VERSION = 1;

/** the app's settings in settings.json; they stay in main, only the remembered port is shown to the renderer */
export const SettingsSchema = Type.Object({
  version: Type.Literal(SETTINGS_VERSION),
  /** none yet: the next unlock sets one */
  password: Type.Optional(PasswordHashSchema),
  /** the port the output was last connected to, connected again on start (dmx/portMemory.ts) */
  outputPortPath: Type.Optional(Type.String({minLength: 1}))
});
export type Settings = Static<typeof SettingsSchema>;

/** the settings without their version: what a change can set */
export type SettingsChange = Partial<Omit<Settings, 'version'>>;

export const EMPTY_SETTINGS: Settings = {version: SETTINGS_VERSION};

export const parseSettings = (payload: unknown): Settings | undefined =>
  Value.Check(SettingsSchema, payload) ? payload : undefined;
