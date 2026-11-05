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
