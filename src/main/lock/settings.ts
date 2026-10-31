import Type, {type Static} from 'typebox';
import Value from 'typebox/value';

const HEX_PATTERN = '^[0-9a-f]+$';

/** a salted scrypt hash of the password, never the password itself (passwordHash.ts) */
export const PasswordHashSchema = Type.Object({
  salt: Type.String({pattern: HEX_PATTERN}),
  hash: Type.String({pattern: HEX_PATTERN})
});
export type PasswordHash = Static<typeof PasswordHashSchema>;

/** the version of the stored settings, so a later format change can migrate an older file */
export const SETTINGS_VERSION = 1;

/** the app's settings in settings.json; stays in main, nothing of it crosses IPC. No password yet: the next unlock sets one */
export const SettingsSchema = Type.Object({
  version: Type.Literal(SETTINGS_VERSION),
  password: Type.Optional(PasswordHashSchema)
});
export type Settings = Static<typeof SettingsSchema>;

export const parseSettings = (payload: unknown): Settings | undefined =>
  Value.Check(SettingsSchema, payload) ? payload : undefined;
