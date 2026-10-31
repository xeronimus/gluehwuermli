import {randomBytes, scrypt, timingSafeEqual} from 'node:crypto';

import type {PasswordHash} from './settings';

const SALT_BYTES = 16;
const KEY_BYTES = 64;
const HEX = 'hex';

const derivedKey = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) =>
    scrypt(password, salt, KEY_BYTES, (error, key) => (error ? reject(error) : resolve(key)))
  );

/** a new random salt and the scrypt key of the password with it, both hex */
export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derivedKey(password, salt);
  return {salt: salt.toString(HEX), hash: key.toString(HEX)};
}

/** whether the password gives the stored hash; compared in constant time */
export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  const expected = Buffer.from(stored.hash, HEX);
  const key = await derivedKey(password, Buffer.from(stored.salt, HEX));
  return key.length === expected.length && timingSafeEqual(key, expected);
}
