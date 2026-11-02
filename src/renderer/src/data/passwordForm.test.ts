import {changePasswordFormError, passwordFormError} from './passwordForm';

test('a password needs at least 4 characters', () => {
  expect(passwordFormError({password: 'abc', confirmation: ''}, false)).toBe('too-short');
  expect(passwordFormError({password: 'abcd', confirmation: ''}, false)).toBeUndefined();
});

test('a new password must be typed the same twice', () => {
  expect(passwordFormError({password: 'abcd', confirmation: 'abce'}, true)).toBe('mismatch');
  expect(passwordFormError({password: 'abcd', confirmation: 'abcd'}, true)).toBeUndefined();
});

test('a password longer than the main process accepts is reported', () => {
  expect(passwordFormError({password: 'x'.repeat(201), confirmation: ''}, false)).toBe('too-long');
});

describe('changing the password', () => {
  const VALID_CHANGE = {currentPassword: 'abcd', newPassword: 'efgh', confirmation: 'efgh'};

  test('needs the current password and the new one typed the same twice', () => {
    expect(changePasswordFormError(VALID_CHANGE)).toBeUndefined();
    expect(changePasswordFormError({...VALID_CHANGE, currentPassword: ''})).toBe('current-missing');
    expect(changePasswordFormError({...VALID_CHANGE, newPassword: 'ef', confirmation: 'ef'})).toBe('too-short');
    expect(changePasswordFormError({...VALID_CHANGE, confirmation: 'efgi'})).toBe('mismatch');
  });

  test('a new password the same as the current one is reported', () => {
    expect(changePasswordFormError({currentPassword: 'abcd', newPassword: 'abcd', confirmation: 'abcd'})).toBe(
      'same-as-current'
    );
  });
});
