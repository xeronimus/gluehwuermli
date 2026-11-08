import {leadsToShowView} from './showViewTriggers';

const locked = {setupMode: false, projectSwitches: 1};

test('unlocking Setup mode or opening a project leads to the Show view', () => {
  expect(leadsToShowView(locked, {...locked, setupMode: true})).toBe(true);
  expect(leadsToShowView(locked, {...locked, projectSwitches: 2})).toBe(true);
});

test('locking, or nothing changing, keeps the view', () => {
  expect(leadsToShowView({...locked, setupMode: true}, locked)).toBe(false);
  expect(leadsToShowView(locked, locked)).toBe(false);
});
