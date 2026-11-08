import {setupChases} from '@shared/chases';
import type {Chase, FixtureSetup} from '@shared/ipc';

import {type MoveDirection, movedWithId} from './listOrder';

/** the setup with `chase` replacing the one with its id, in place, or appended if it is new */
export const withChase = (setup: FixtureSetup, chase: Chase): FixtureSetup => {
  const chases = setupChases(setup);
  return {
    ...setup,
    chases: chases.some(({id}) => id === chase.id)
      ? chases.map((current) => (current.id === chase.id ? chase : current))
      : [...chases, chase]
  };
};

export const withoutChase = (setup: FixtureSetup, chaseId: string): FixtureSetup => ({
  ...setup,
  chases: setupChases(setup).filter(({id}) => id !== chaseId)
});

/** the setup with the chase one row up or down in the chase list */
export const withChaseMoved = (setup: FixtureSetup, chaseId: string, direction: MoveDirection): FixtureSetup => ({
  ...setup,
  chases: movedWithId(setupChases(setup), chaseId, direction)
});
