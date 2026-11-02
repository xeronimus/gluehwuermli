import type {MessageDescriptor} from '@lingui/core';
import {msg} from '@lingui/core/macro';

import {PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH} from '@shared/ipc';

import type {PasswordFormError} from '@/data/passwordForm';

const minLength = PASSWORD_MIN_LENGTH;
const maxLength = PASSWORD_MAX_LENGTH;

export function passwordFormErrorMessage(error: PasswordFormError): MessageDescriptor {
  switch (error) {
    case 'too-short':
      return msg`The password needs at least ${minLength} characters`;
    case 'too-long':
      return msg`The password can have at most ${maxLength} characters`;
    case 'mismatch':
      return msg`The passwords don't match`;
    case 'current-missing':
      return msg`Type the current password`;
    case 'same-as-current':
      return msg`The new password is the current one`;
  }
}
