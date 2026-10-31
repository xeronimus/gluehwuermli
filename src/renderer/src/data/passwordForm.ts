import {PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH} from '@shared/ipc';

const lengthError = (password: string): string | undefined => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `The password needs at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `The password can have at most ${PASSWORD_MAX_LENGTH} characters`;
  }
  return undefined;
};

/** what keeps the password from being sent; undefined when it can be. A new one is typed twice, to catch a typo */
export function passwordFormError(
  form: {password: string; confirmation: string},
  isNewPassword: boolean
): string | undefined {
  const error = lengthError(form.password);
  if (error || !isNewPassword) {
    return error;
  }
  return form.password === form.confirmation ? undefined : "The passwords don't match";
}
