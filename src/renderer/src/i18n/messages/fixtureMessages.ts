import type {MessageDescriptor} from '@lingui/core';
import {msg, plural} from '@lingui/core/macro';

import {DMX_MAX_VALUE, DMX_MIN_VALUE, FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from '@shared/dmx';
import type {FixtureError, FixtureOverlap} from '@shared/fixtures';
import {
  CHANNEL_POSITION_NAME_MAX_LENGTH,
  FIXTURE_DESCRIPTION_MAX_LENGTH,
  FIXTURE_HINT_MAX_LENGTH,
  FIXTURE_PRESET_NAME_MAX_LENGTH
} from '@shared/ipc';

// the limits as named variables, so the catalog shows {maxLength} rather than {0}
const minValue = DMX_MIN_VALUE;
const maxValue = DMX_MAX_VALUE;
const firstAddress = FIRST_DMX_CHANNEL;
const lastUniverseAddress = LAST_DMX_CHANNEL;

type Translate = (message: MessageDescriptor) => string;

/** a preset still without a name is named as such */
const presetLabel = (presetName: string | undefined, translate: Translate): string =>
  presetName ?? translate(msg`without a name`);

/** what fixtureErrors found, in the UI language; `translate` says a preset without a name in it, too */
export function fixtureErrorMessage(error: FixtureError, translate: Translate): MessageDescriptor {
  switch (error.type) {
    case 'name-missing':
      return msg`The fixture needs a name`;
    case 'start-address-invalid':
      return msg`The start address must be a whole number from ${firstAddress} to ${lastUniverseAddress}`;
    case 'description-too-long': {
      const maxLength = FIXTURE_DESCRIPTION_MAX_LENGTH;
      return msg`The description can have at most ${maxLength} characters`;
    }
    case 'hint-too-long': {
      const maxLength = FIXTURE_HINT_MAX_LENGTH;
      return msg`The hint can have at most ${maxLength} characters`;
    }
    case 'channels-missing':
      return msg`The fixture needs at least one channel`;
    case 'channel-name-missing':
      return msg`Every channel needs a name`;
    case 'offset-invalid':
      return msg`Offsets must be whole numbers from 0`;
    case 'offset-used-twice': {
      const {offset} = error;
      return msg`Offset ${offset} is used by more than one channel`;
    }
    case 'lock-max-invalid':
      return msg`The maximum while locked must be a whole number from ${minValue} to ${maxValue}`;
    case 'color-invalid':
      return msg`A color must be a hex value like #ff00ff`;
    case 'values-invalid':
      return msg`The values of a channel must be whole numbers from ${minValue} to ${maxValue}`;
    case 'values-min-above-max':
      return msg`A channel's min can't be above its max`;
    case 'values-step-invalid':
      return msg`A channel's step size must be a whole number from 1`;
    case 'values-positions-too-few':
      return msg`A channel with positions needs at least two of them`;
    case 'values-position-twice':
      return msg`A channel has the same position twice`;
    case 'values-position-name-too-long': {
      const maxLength = CHANNEL_POSITION_NAME_MAX_LENGTH;
      return msg`A position name can have at most ${maxLength} characters`;
    }
    case 'past-universe-end': {
      const {lastAddress} = error;
      return msg`The fixture ends at address ${lastAddress}, after the last one (${lastUniverseAddress})`;
    }
    case 'preset-name-missing':
      return msg`Every preset needs a name`;
    case 'preset-name-too-long': {
      const maxLength = FIXTURE_PRESET_NAME_MAX_LENGTH;
      return msg`A preset name can have at most ${maxLength} characters`;
    }
    case 'preset-id-used-twice': {
      const {id} = error;
      return msg`Preset id ${id} is used twice`;
    }
    case 'preset-channels-missing': {
      const preset = presetLabel(error.presetName, translate);
      return msg`The preset ${preset} needs at least one channel`;
    }
    case 'preset-channel-unknown': {
      const preset = presetLabel(error.presetName, translate);
      return msg`The preset ${preset} sets a channel the fixture doesn't have`;
    }
    case 'preset-channel-twice': {
      const preset = presetLabel(error.presetName, translate);
      return msg`The preset ${preset} sets a channel more than once`;
    }
    case 'preset-value-invalid': {
      const preset = presetLabel(error.presetName, translate);
      return msg`The values of the preset ${preset} must be whole numbers from ${minValue} to ${maxValue} that their channels can have`;
    }
    case 'shared-address-rules-differ': {
      const {otherFixtureName} = error;
      const addressList = error.addresses.join(', ');
      const addressCount = error.addresses.length;
      return msg`${otherFixtureName} uses ${plural(addressCount, {one: 'address', other: 'addresses'})} ${addressList} too, with other values: shared channels need the same mode and values`;
    }
  }
}

/** a warning, not an error: two fixtures sharing addresses may be meant to move together */
export function overlapMessage({first, second, addresses}: FixtureOverlap): MessageDescriptor {
  const firstName = first.name;
  const secondName = second.name;
  const addressList = addresses.join(', ');
  const addressCount = addresses.length;
  return msg`${firstName} and ${secondName} share ${plural(addressCount, {one: 'address', other: 'addresses'})} ${addressList}`;
}
