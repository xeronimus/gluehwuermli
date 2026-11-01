import {changePasswordFormError, passwordFormError} from './passwordForm';

test('a password needs at least 4 characters', () => {
  expect(passwordFormError({password: 'abc', confirmation: ''}, false)).toBe(
    'The password needs at least 4 characters'
  );
  expect(passwordFormError({password: 'abcd', confirmation: ''}, false)).toBeUndefined();
});

test('a new password must be typed the same twice', () => {
  expect(passwordFormError({password: 'abcd', confirmation: 'abce'}, true)).toBe("The passwords don't match");
  expect(passwordFormError({password: 'abcd', confirmation: 'abcd'}, true)).toBeUndefined();
});

test('a password longer than the main process accepts is reported', () => {
  expect(passwordFormError({password: 'x'.repeat(201), confirmation: ''}, false)).toBe(
    'The password can have at most 200 characters'
  );
});

describe('changing the password', () => {
  const VALID_CHANGE = {currentPassword: 'abcd', newPassword: 'efgh', confirmation: 'efgh'};

  test('needs the current password and the new one typed the same twice', () => {
    expect(changePasswordFormError(VALID_CHANGE)).toBeUndefined();
    expect(changePasswordFormError({...VALID_CHANGE, currentPassword: ''})).toBe('Type the current password');
    expect(changePasswordFormError({...VALID_CHANGE, newPassword: 'ef', confirmation: 'ef'})).toBe(
      'The password needs at least 4 characters'
    );
    expect(changePasswordFormError({...VALID_CHANGE, confirmation: 'efgi'})).toBe("The passwords don't match");
  });

  test('a new password the same as the current one is reported', () => {
    expect(changePasswordFormError({currentPassword: 'abcd', newPassword: 'abcd', confirmation: 'abcd'})).toBe(
      'The new password is the current one'
    );
  });
});
