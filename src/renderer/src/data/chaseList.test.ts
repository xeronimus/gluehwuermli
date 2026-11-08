import {fixtureSetupOf} from '@shared/fixtures';
import type {Chase} from '@shared/ipc';

import {withChase, withChaseMoved, withoutChase} from './chaseList';

const chaseNamed = (id: string, name: string): Chase => ({
  id,
  name,
  repeat: {type: 'once'},
  steps: [{id: `${id}-1`, holdMs: 500, values: [{channel: 1, value: 255}]}]
});

const chorus = chaseNamed('chorus', 'Chorus');
const intro = chaseNamed('intro', 'Intro');
const setup = {...fixtureSetupOf([]), chases: [chorus, intro]};

test('a new chase is appended, one with a known id replaced in place', () => {
  const outro = chaseNamed('outro', 'Outro');
  const renamed = {...chorus, name: 'Chorus flash'};

  expect(withChase(setup, outro).chases).toEqual([chorus, intro, outro]);
  expect(withChase(setup, renamed).chases).toEqual([renamed, intro]);
  expect(withChase(fixtureSetupOf([]), outro).chases).toEqual([outro]);
});

test('deletes a chase by its id', () => {
  expect(withoutChase(setup, 'chorus').chases).toEqual([intro]);
  expect(withoutChase(setup, 'unknown').chases).toEqual([chorus, intro]);
});

test('moves a chase one row, not past either end', () => {
  expect(withChaseMoved(setup, 'intro', 'earlier').chases).toEqual([intro, chorus]);
  expect(withChaseMoved(setup, 'intro', 'later').chases).toEqual([chorus, intro]);
});

test('keeps the fixtures and scenes', () => {
  const withScenes = {...setup, scenes: []};

  expect(withoutChase(withScenes, 'chorus')).toEqual({...withScenes, chases: [intro]});
});
