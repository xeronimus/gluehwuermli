import {emptyFixtureSetup} from './fixtures';
import {isProjectFilePath, parseProjectFile, projectNameOf, withProjectFileExtension} from './projects';

describe('parseProjectFile', () => {
  test('a valid setup', () => {
    expect(parseProjectFile(emptyFixtureSetup())).toEqual({type: 'valid', setup: emptyFixtureSetup()});
  });

  test.each([
    ['no JSON', undefined],
    ['another shape', {fixtures: 'none'}],
    ['a fixture outside the universe', {version: 1, fixtures: [{id: 'a', name: 'A', startAddress: 600, channels: []}]}],
    ['an older version than any known', {version: 0, fixtures: []}]
  ])('%s is invalid', (_description, content) => {
    expect(parseProjectFile(content)).toEqual({type: 'invalid', error: {reason: 'invalid'}});
  });

  test('a file without chases loads unchanged, one with chases keeps them', () => {
    const withoutChases = {version: 1, fixtures: [], scenes: []};
    const withChases = {
      version: 1,
      fixtures: [],
      chases: [
        {
          id: 'chorus',
          name: 'Chorus flash',
          repeat: {type: 'forever'},
          steps: [{id: 'one', holdMs: 500, values: [{channel: 12, value: 255}]}]
        }
      ]
    };

    expect(parseProjectFile(withoutChases)).toEqual({type: 'valid', setup: withoutChases});
    expect(parseProjectFile(withChases)).toEqual({type: 'valid', setup: withChases});
  });

  test.each([
    ['a chase without steps', {id: 'chorus', name: 'Chorus', repeat: {type: 'once'}, steps: []}],
    [
      'a chase step holding too short',
      {id: 'chorus', name: 'Chorus', repeat: {type: 'once'}, steps: [{id: 'one', holdMs: 10, values: []}]}
    ],
    [
      'a chase setting a channel twice in one step',
      {
        id: 'chorus',
        name: 'Chorus',
        repeat: {type: 'once'},
        steps: [
          {
            id: 'one',
            holdMs: 500,
            values: [
              {channel: 1, value: 0},
              {channel: 1, value: 255}
            ]
          }
        ]
      }
    ]
  ])('%s is invalid', (_description, chase) => {
    expect(parseProjectFile({version: 1, fixtures: [], chases: [chase]})).toEqual({
      type: 'invalid',
      error: {reason: 'invalid'}
    });
  });

  test('a newer version is too new, whatever its shape', () => {
    expect(parseProjectFile({version: 2, rigs: []})).toEqual({type: 'invalid', error: {reason: 'too-new', version: 2}});
  });
});

test('the project name is the file name without folder and extension', () => {
  expect(projectNameOf('D:\\Shows\\Waldfest.glp')).toBe('Waldfest');
  expect(projectNameOf('/home/me/Fasnacht 2027.GLP')).toBe('Fasnacht 2027');
  expect(projectNameOf('C:\\notes.txt')).toBe('notes.txt');
});

test('.glp is added to a chosen path unless it has it, in any case', () => {
  expect(withProjectFileExtension('D:\\Waldfest')).toBe('D:\\Waldfest.glp');
  expect(withProjectFileExtension('D:\\Waldfest.GLP')).toBe('D:\\Waldfest.GLP');
  expect(isProjectFilePath('D:\\Waldfest.glp.json')).toBe(false);
});
