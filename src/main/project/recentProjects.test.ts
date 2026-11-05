import {RECENT_PROJECTS_MAX} from '@/settings/settings';

import {withRecentProject, withoutRecentProject} from './recentProjects';

test('a project opened again moves to the top, once, whatever the case of its path', () => {
  expect(withRecentProject(['D:\\A.glp', 'D:\\B.glp'], 'd:\\b.GLP')).toEqual(['d:\\b.GLP', 'D:\\A.glp']);
});

test('the oldest drops out beyond the maximum', () => {
  const paths = Array.from({length: RECENT_PROJECTS_MAX}, (_unused, index) => `D:\\${index}.glp`);

  const recent = withRecentProject(paths, 'D:\\new.glp');

  expect(recent).toHaveLength(RECENT_PROJECTS_MAX);
  expect(recent[0]).toBe('D:\\new.glp');
  expect(recent).not.toContain(`D:\\${RECENT_PROJECTS_MAX - 1}.glp`);
});

test('removing ignores the case', () => {
  expect(withoutRecentProject(['D:\\A.glp', 'D:\\B.glp'], 'd:\\a.glp')).toEqual(['D:\\B.glp']);
});
