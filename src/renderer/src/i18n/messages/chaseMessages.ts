import type {MessageDescriptor} from '@lingui/core';
import {msg} from '@lingui/core/macro';

import type {ChaseError} from '@shared/chases';
import {DMX_MAX_VALUE, DMX_MIN_VALUE, FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from '@shared/dmx';
import {
  CHASE_HOLD_MAX_MS,
  CHASE_HOLD_MIN_MS,
  CHASE_NAME_MAX_LENGTH,
  CHASE_REPEAT_MAX,
  CHASE_STEPS_MAX
} from '@shared/ipc';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;

/** what chaseErrors found, in the UI language; the shortest hold in seconds, as the editor shows it */
export function chaseErrorMessage(error: ChaseError): MessageDescriptor {
  switch (error.type) {
    case 'chase-name-missing':
      return msg`The chase needs a name`;
    case 'chase-name-too-long': {
      const maxLength = CHASE_NAME_MAX_LENGTH;
      return msg`A chase name can have at most ${maxLength} characters`;
    }
    case 'chase-repeat-invalid': {
      const maxRepeat = CHASE_REPEAT_MAX;
      return msg`A chase can be played from 2 to ${maxRepeat} times`;
    }
    case 'chase-steps-missing':
      return msg`The chase needs at least one step`;
    case 'chase-steps-too-many': {
      const maxSteps = CHASE_STEPS_MAX;
      return msg`A chase can have at most ${maxSteps} steps`;
    }
    case 'chase-step-id-twice':
      return msg`The chase has a step twice`;
    case 'chase-step-hold-invalid': {
      const minSeconds = CHASE_HOLD_MIN_MS / MS_PER_SECOND;
      const maxMinutes = CHASE_HOLD_MAX_MS / MS_PER_MINUTE;
      return msg`A step holds from ${minSeconds} seconds to ${maxMinutes} minutes`;
    }
    case 'chase-step-values-missing':
      return msg`Every step needs at least one channel`;
    case 'chase-step-channel-invalid': {
      const firstChannel = FIRST_DMX_CHANNEL;
      const lastChannel = LAST_DMX_CHANNEL;
      return msg`Step channels must be whole numbers from ${firstChannel} to ${lastChannel}`;
    }
    case 'chase-step-channel-twice':
      return msg`A step sets a channel twice`;
    case 'chase-step-value-invalid': {
      const minValue = DMX_MIN_VALUE;
      const maxValue = DMX_MAX_VALUE;
      return msg`Step values must be whole numbers from ${minValue} to ${maxValue}`;
    }
  }
}
