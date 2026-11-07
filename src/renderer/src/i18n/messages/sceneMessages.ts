import type {MessageDescriptor} from '@lingui/core';
import {msg} from '@lingui/core/macro';

import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';
import {SCENE_NAME_MAX_LENGTH} from '@shared/ipc';
import type {SceneError} from '@shared/scenes';

/**
 * what sceneErrors found, in the UI language. The editor can only cause the first three; the others come from a
 * changed file or a bug, and are said in case they ever show
 */
export function sceneErrorMessage(error: SceneError): MessageDescriptor {
  switch (error.type) {
    case 'scene-name-missing':
      return msg`The scene needs a name`;
    case 'scene-name-too-long': {
      const maxLength = SCENE_NAME_MAX_LENGTH;
      return msg`A scene name can have at most ${maxLength} characters`;
    }
    case 'scene-fixtures-missing':
      return msg`Choose at least one fixture`;
    case 'scene-fixture-unknown':
      return msg`The scene names a fixture that doesn't exist`;
    case 'scene-fixture-twice':
      return msg`The scene names a fixture twice`;
    case 'scene-channels-missing':
      return msg`Every fixture of the scene needs at least one channel`;
    case 'scene-channel-unknown':
      return msg`The scene sets a channel its fixture doesn't have`;
    case 'scene-channel-twice':
      return msg`The scene sets a channel twice`;
    case 'scene-value-invalid': {
      const minValue = DMX_MIN_VALUE;
      const maxValue = DMX_MAX_VALUE;
      return msg`Scene values must be whole numbers from ${minValue} to ${maxValue} that their channels can have`;
    }
  }
}
