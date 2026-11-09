import type {MessageDescriptor} from '@lingui/core';
import {msg, plural} from '@lingui/core/macro';

import type {ChaseError, ChaseValueError} from '@shared/chases';
import {DMX_MAX_VALUE, DMX_MIN_VALUE, FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from '@shared/dmx';
import {
  CHASE_HOLD_MAX_MS,
  CHASE_HOLD_MIN_MS,
  CHASE_NAME_MAX_LENGTH,
  CHASE_REPEAT_MAX,
  CHASE_REPEAT_MIN,
  CHASE_STEPS_MAX
} from '@shared/ipc';
import {MS_PER_MINUTE, MS_PER_SECOND} from '@shared/time';

import type {AllStepsLine, ChannelInAllStepsEffect, WithoutChannelInAllStepsEffect} from '@/data/chaseAllSteps';

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
      const minRepeat = CHASE_REPEAT_MIN;
      const maxRepeat = CHASE_REPEAT_MAX;
      return msg`A chase can be played from ${minRepeat} to ${maxRepeat} times`;
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

/** a problem of a step's value, said on its row: the row shows which channel or value it is about */
export function chaseRowErrorMessage(error: ChaseValueError): MessageDescriptor {
  switch (error.type) {
    case 'chase-step-channel-invalid': {
      const firstChannel = FIRST_DMX_CHANNEL;
      const lastChannel = LAST_DMX_CHANNEL;
      return msg`Channel: a whole number from ${firstChannel} to ${lastChannel}`;
    }
    case 'chase-step-channel-twice':
      return msg`The step sets this channel twice`;
    case 'chase-step-value-invalid': {
      const minValue = DMX_MIN_VALUE;
      const maxValue = DMX_MAX_VALUE;
      return msg`Value: a whole number from ${minValue} to ${maxValue}`;
    }
  }
}

function addLineMessage(channel: number, done: boolean, {addedCount, stepCount}: ChannelInAllStepsEffect) {
  if (addedCount === 0) {
    return msg`Every step already sets channel ${channel}`;
  }
  return done
    ? msg`Added channel ${channel} to ${addedCount} of ${plural(stepCount, {one: '# step', other: '# steps'})}`
    : msg`Adds channel ${channel} to ${addedCount} of ${plural(stepCount, {one: '# step', other: '# steps'})}`;
}

function removeLineMessage(channel: number, done: boolean, effect: WithoutChannelInAllStepsEffect) {
  const {removedCount, emptiedStepIndexes} = effect;
  const emptiedCount = emptiedStepIndexes.length;
  const emptiedSteps = emptiedStepIndexes.map((index) => index + 1).join(', ');
  if (emptiedCount === 0) {
    return done
      ? msg`Removed channel ${channel} from ${plural(removedCount, {one: '# step', other: '# steps'})}`
      : msg`Removes channel ${channel} from ${plural(removedCount, {one: '# step', other: '# steps'})}`;
  }
  return done
    ? msg`Removed channel ${channel} from ${plural(removedCount, {one: '# step', other: '# steps'})}; ${plural(emptiedCount, {one: `step ${emptiedSteps} is`, other: `steps ${emptiedSteps} are`})} left without channels`
    : msg`Removes channel ${channel} from ${plural(removedCount, {one: '# step', other: '# steps'})}; ${plural(emptiedCount, {one: `step ${emptiedSteps} would be`, other: `steps ${emptiedSteps} would be`})} left without channels`;
}

/** what the All steps panel says: what the hovered action would do, or what the clicked one did */
export function allStepsLineMessage(line: AllStepsLine): MessageDescriptor {
  switch (line.action) {
    case 'hold': {
      const changedCount = line.effect.changedCount;
      if (changedCount === 0) {
        return msg`Changes nothing`;
      }
      return line.done
        ? msg`Set the hold of ${plural(changedCount, {one: '# step', other: '# steps'})}`
        : msg`Sets the hold of ${plural(changedCount, {one: '# step', other: '# steps'})}`;
    }
    case 'add':
      return addLineMessage(line.channel, line.done, line.effect);
    case 'remove':
      return removeLineMessage(line.channel, line.done, line.effect);
  }
}
