import type {MessageDescriptor} from '@lingui/core';

import type {Fixture} from '@shared/ipc';

import {activateLocale, i18n} from '../i18n';
import {fixtureErrorMessage, overlapMessage} from './fixtureMessages';
import {outputStatusMessage} from './outputMessages';
import {passwordFormErrorMessage} from './passwordMessages';
import {projectErrorMessage} from './projectMessages';
import {sceneErrorMessage} from './sceneMessages';

const translate = (message: MessageDescriptor) => i18n._(message);

const fixtureOf = (name: string): Fixture => ({
  id: name,
  name,
  startAddress: 1,
  channels: [{name: 'Dimmer', offset: 0}]
});

describe('in English', () => {
  beforeAll(() => activateLocale('en'));

  test('a fixture error names the preset, or says it has none yet', () => {
    expect(translate(fixtureErrorMessage({type: 'preset-channels-missing', presetName: 'Warm'}, translate))).toBe(
      'The preset Warm needs at least one channel'
    );
    expect(translate(fixtureErrorMessage({type: 'preset-channels-missing', presetName: undefined}, translate))).toBe(
      'The preset without a name needs at least one channel'
    );
  });

  test('a fixture error states the limits', () => {
    expect(translate(fixtureErrorMessage({type: 'start-address-invalid'}, translate))).toBe(
      'The start address must be a whole number from 1 to 512'
    );
    expect(translate(fixtureErrorMessage({type: 'past-universe-end', lastAddress: 513}, translate))).toBe(
      'The fixture ends at address 513, after the last one (512)'
    );
  });

  test('an overlap names both fixtures and the shared addresses, singular or plural', () => {
    const first = fixtureOf('PAR');
    const second = fixtureOf('Smoke');

    expect(translate(overlapMessage({first, second, addresses: [12]}))).toBe('PAR and Smoke share address 12');
    expect(translate(overlapMessage({first, second, addresses: [12, 13]}))).toBe(
      'PAR and Smoke share addresses 12, 13'
    );
  });

  test('the output status: an engine code is said, a serialport error shown as it is', () => {
    expect(translate(outputStatusMessage({type: 'connected', path: 'COM3'}))).toBe('Sending on COM3');
    expect(
      translate(outputStatusMessage({type: 'failed', path: 'COM3', reason: 'port-error', message: 'Access denied'}))
    ).toBe('COM3: Access denied');
    expect(translate(outputStatusMessage({type: 'failed', path: 'COM3', reason: 'port-closed'}))).toBe(
      'COM3: the port was closed, is the widget still plugged in?'
    );
  });

  test('a password form error states the limit', () => {
    expect(translate(passwordFormErrorMessage('too-short'))).toBe('The password needs at least 4 characters');
  });
});

describe('project errors in English', () => {
  beforeAll(() => activateLocale('en'));

  test('a reason of the OS is shown as it is, a newer version is named', () => {
    expect(translate(projectErrorMessage({reason: 'unreadable', message: 'EBUSY: resource busy'}))).toBe(
      "The file can't be read: EBUSY: resource busy"
    );
    expect(translate(projectErrorMessage({reason: 'too-new', version: 2}))).toBe(
      'The file was saved by a newer version of Glühwürmli (project version 2). Update the app to open it.'
    );
  });
});

describe('scene errors in English', () => {
  beforeAll(() => activateLocale('en'));

  test('state the limits', () => {
    expect(translate(sceneErrorMessage({type: 'scene-name-too-long'}))).toBe(
      'A scene name can have at most 40 characters'
    );
    expect(translate(sceneErrorMessage({type: 'scene-value-invalid'}))).toBe(
      'Scene values must be whole numbers from 0 to 255'
    );
  });
});

describe('in German', () => {
  beforeAll(() => activateLocale('de'));

  test('the texts are translated, the values kept', () => {
    expect(translate(outputStatusMessage({type: 'connected', path: 'COM3'}))).toBe('Sendet auf COM3');
    expect(translate(fixtureErrorMessage({type: 'preset-channels-missing', presetName: undefined}, translate))).toBe(
      'Das Preset ohne Namen braucht mindestens einen Kanal'
    );
    expect(translate(sceneErrorMessage({type: 'scene-name-too-long'}))).toBe(
      'Ein Szenen-Name darf höchstens 40 Zeichen haben'
    );
  });

  test('the plural follows the number of shared addresses', () => {
    const first = fixtureOf('PAR');
    const second = fixtureOf('Nebel');

    expect(translate(overlapMessage({first, second, addresses: [12]}))).toBe('PAR und Nebel teilen sich Adresse 12');
    expect(translate(overlapMessage({first, second, addresses: [12, 13]}))).toBe(
      'PAR und Nebel teilen sich die Adressen 12, 13'
    );
  });
});
