import type {MessageDescriptor} from '@lingui/core';

import type {Fixture} from '@shared/ipc';

import {activateLocale, i18n} from '../i18n';
import {allStepsLineMessage, chaseErrorMessage} from './chaseMessages';
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
      'Scene values must be whole numbers from 0 to 255 that their channels can have'
    );
  });
});

describe('chase errors in English', () => {
  beforeAll(() => activateLocale('en'));

  test('state the limits, the hold in seconds', () => {
    expect(translate(chaseErrorMessage({type: 'chase-step-hold-invalid'}))).toBe(
      'A step holds from 0.05 seconds to 60 minutes'
    );
    expect(translate(chaseErrorMessage({type: 'chase-repeat-invalid'}))).toBe(
      'A chase can be played from 2 to 99 times'
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
    expect(translate(chaseErrorMessage({type: 'chase-steps-too-many'}))).toBe('Ein Chase hat höchstens 100 Schritte');
    expect(translate(chaseErrorMessage({type: 'chase-step-hold-invalid'}))).toBe(
      'Ein Schritt hält 0,05 Sekunden bis 60 Minuten'
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

describe('the All steps panel', () => {
  beforeEach(() => activateLocale('en'));

  const remove = (emptiedStepIndexes: number[], done: boolean) =>
    translate(
      allStepsLineMessage({
        action: 'remove',
        done,
        channel: 12,
        effect: {removedCount: 3, emptiedStepIndexes, shownChangedIds: []}
      })
    );

  test('says what an action would do, and what it did', () => {
    expect(translate(allStepsLineMessage({action: 'hold', done: false, effect: {changedCount: 1}}))).toBe(
      'Sets the hold of 1 step'
    );
    expect(translate(allStepsLineMessage({action: 'hold', done: true, effect: {changedCount: 0}}))).toBe(
      'Changes nothing'
    );
    expect(
      translate(allStepsLineMessage({action: 'add', done: false, channel: 12, effect: {addedCount: 3, stepCount: 5}}))
    ).toBe('Adds channel 12 to 3 of 5 steps');
    expect(
      translate(allStepsLineMessage({action: 'add', done: true, channel: 12, effect: {addedCount: 0, stepCount: 5}}))
    ).toBe('Every step already sets channel 12');
    expect(remove([], true)).toBe('Removed channel 12 from 3 steps');
    expect(remove([3], false)).toBe('Removes channel 12 from 3 steps; step 4 would be left without channels');
    expect(remove([1, 3], true)).toBe('Removed channel 12 from 3 steps; steps 2, 4 are left without channels');
  });

  test('in German', () => {
    activateLocale('de');
    expect(translate(allStepsLineMessage({action: 'hold', done: false, effect: {changedCount: 2}}))).toBe(
      'Setzt die Haltezeit von 2 Schritten'
    );
    expect(remove([3], false)).toBe('Entfernt Kanal 12 aus 3 Schritten; Schritt 4 wäre danach ohne Kanäle');
  });
});
