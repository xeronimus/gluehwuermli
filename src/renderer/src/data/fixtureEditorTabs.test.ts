import {tabOfFixtureError, tabsWithErrors} from './fixtureEditorTabs';

test('an error belongs to the tab with its field', () => {
  expect(tabOfFixtureError({type: 'name-missing'})).toBe('general');
  expect(tabOfFixtureError({type: 'hint-too-long'})).toBe('general');
  expect(tabOfFixtureError({type: 'offset-used-twice', offset: 2})).toBe('channels');
  expect(tabOfFixtureError({type: 'past-universe-end', lastAddress: 513})).toBe('channels');
  expect(tabOfFixtureError({type: 'preset-value-invalid', presetName: 'Warm'})).toBe('presets');
});

test('the tabs with errors are each named once, none without errors', () => {
  const tabs = tabsWithErrors([{type: 'channel-name-missing'}, {type: 'color-invalid'}, {type: 'name-missing'}]);

  expect([...tabs].sort()).toEqual(['channels', 'general']);
  expect(tabsWithErrors([]).size).toBe(0);
});
