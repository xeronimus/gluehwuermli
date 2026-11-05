import {emptyFixtureSetup} from '@shared/fixtures';

import {windowTitleOf} from './windowTitle';

test('the open project names the window', () => {
  expect(windowTitleOf({type: 'open', project: {path: 'D:\\Shows\\Waldfest.glp', setup: emptyFixtureSetup()}})).toBe(
    'Waldfest — Glühwürmli'
  );
  expect(windowTitleOf({type: 'failed', path: 'D:\\Gone.glp', error: {reason: 'missing'}})).toBe('Glühwürmli');
  expect(windowTitleOf({type: 'none'})).toBe('Glühwürmli');
});
