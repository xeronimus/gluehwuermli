import {colorToStore, isValidColor, normalizedColor} from './colors';

describe('normalizedColor', () => {
  test('stores six hex digits as #rrggbb in lower case, with or without the #', () => {
    expect(normalizedColor('ff00ff')).toBe('#ff00ff');
    expect(normalizedColor('#FF00FF')).toBe('#ff00ff');
    expect(normalizedColor(' #Ff00fF ')).toBe('#ff00ff');
  });

  test('is undefined for anything else', () => {
    expect(normalizedColor('#ff00f')).toBeUndefined();
    expect(normalizedColor('red')).toBeUndefined();
    expect(normalizedColor('#gg0000')).toBeUndefined();
    expect(normalizedColor('##ff00ff')).toBeUndefined();
    expect(normalizedColor('')).toBeUndefined();
  });
});

describe('isValidColor', () => {
  test('accepts no color and a stored one, nothing else', () => {
    expect(isValidColor(undefined)).toBe(true);
    expect(isValidColor('#7f00ff')).toBe(true);
    expect(isValidColor('#7F00FF')).toBe(false);
    expect(isValidColor('7f00ff')).toBe(false);
    expect(isValidColor('')).toBe(false);
  });
});

describe('colorToStore', () => {
  test('leaves a blank field out, normalizes a color, keeps anything else as typed', () => {
    expect(colorToStore('  ')).toBeUndefined();
    expect(colorToStore('FF00FF')).toBe('#ff00ff');
    expect(colorToStore(' red ')).toBe('red');
  });
});
