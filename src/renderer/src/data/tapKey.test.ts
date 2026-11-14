import {type TapKeyEvent, isTapKey} from './tapKey';

const keyOf = (overrides: Partial<TapKeyEvent> = {}): TapKeyEvent => ({
  key: 't',
  repeat: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  target: {tagName: 'BODY'},
  ...overrides
});

test('t and T tap', () => {
  expect(isTapKey(keyOf())).toBe(true);
  expect(isTapKey(keyOf({key: 'T'}))).toBe(true);
  expect(isTapKey(keyOf({target: null}))).toBe(true);
  expect(isTapKey(keyOf({target: {tagName: 'BUTTON'}}))).toBe(true);
});

test.each([
  ['another key', keyOf({key: 'r'})],
  ['a held key', keyOf({repeat: true})],
  ['Ctrl+T', keyOf({ctrlKey: true})],
  ['Alt+T', keyOf({altKey: true})],
  ['Meta+T', keyOf({metaKey: true})],
  ['T in an input', keyOf({target: {tagName: 'INPUT'}})],
  ['T in a textarea', keyOf({target: {tagName: 'TEXTAREA'}})],
  ['T in a select', keyOf({target: {tagName: 'SELECT'}})],
  ['T in a contenteditable', keyOf({target: {tagName: 'DIV', isContentEditable: true}})]
])('%s does not tap', (_description, event) => {
  expect(isTapKey(event)).toBe(false);
});
