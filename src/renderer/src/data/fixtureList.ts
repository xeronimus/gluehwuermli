import type {Fixture, FixtureSetup} from '@shared/ipc';

/** the list with `fixture` replacing the one with its id, or appended if it is new */
export const withFixture = (fixtures: readonly Fixture[], fixture: Fixture): Fixture[] =>
  fixtures.some(({id}) => id === fixture.id)
    ? fixtures.map((current) => (current.id === fixture.id ? fixture : current))
    : [...fixtures, fixture];

export const withoutFixture = (fixtures: readonly Fixture[], fixtureId: string): Fixture[] =>
  fixtures.filter(({id}) => id !== fixtureId);

/** a change of the fixture list as a change of the setup: the rest of the setup stays as it is */
export const changingFixtures =
  (change: (fixtures: readonly Fixture[]) => Fixture[]) =>
  (setup: FixtureSetup): FixtureSetup => ({...setup, fixtures: change(setup.fixtures)});
