import {fixtureSetupOf} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import {withFixture, withoutFixture} from '@/data/fixtureList';
import logger from '@/data/service/Logger';
import {fixtureService} from '@/data/service/services';

import {selectFixtures} from '../fixtures/fixturesSelectors';
import {useAppStore} from '../store';

/**
 * Stores the changed list first and only then shows it: unlike a fader move, a lost change to the setup would go
 * unnoticed. Resolves to whether it was stored.
 */
function useStoreFixtures() {
  const setFixtureSetup = useAppStore((state) => state.setFixtureSetup);
  const setFixturesError = useAppStore((state) => state.setFixturesError);

  return async (change: (fixtures: readonly Fixture[]) => Fixture[], failure: string): Promise<boolean> => {
    const fixtures = change(selectFixtures(useAppStore.getState()));
    try {
      await fixtureService.save(fixtureSetupOf(fixtures));
      setFixtureSetup({type: 'loaded', fixtures});
      setFixturesError(undefined);
      return true;
    } catch (error) {
      logger.error(failure, error);
      setFixturesError(failure);
      return false;
    }
  };
}

/** adds the fixture, or replaces the one with its id */
export function useActionSaveFixture() {
  const storeFixtures = useStoreFixtures();

  return (fixture: Fixture) =>
    storeFixtures((fixtures) => withFixture(fixtures, fixture), `Could not save the fixture ${fixture.name}`);
}

export function useActionDeleteFixture() {
  const storeFixtures = useStoreFixtures();

  return (fixture: Fixture) =>
    storeFixtures((fixtures) => withoutFixture(fixtures, fixture.id), `Could not delete the fixture ${fixture.name}`);
}
