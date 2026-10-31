import {hashPassword, verifyPassword} from './passwordHash';

test('the hash verifies the password it was made of, and no other', async () => {
  const stored = await hashPassword('laser-off');

  expect(await verifyPassword('laser-off', stored)).toBe(true);
  expect(await verifyPassword('laser-on', stored)).toBe(false);
});

test('a new salt each time: the same password gives another hash', async () => {
  const first = await hashPassword('laser-off');
  const second = await hashPassword('laser-off');

  expect(first.salt).not.toBe(second.salt);
  expect(first.hash).not.toBe(second.hash);
});

test('a stored hash of another length never verifies', async () => {
  const stored = await hashPassword('laser-off');

  expect(await verifyPassword('laser-off', {...stored, hash: 'abcd'})).toBe(false);
});
