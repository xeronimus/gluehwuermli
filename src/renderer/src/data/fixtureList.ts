import type {Fixture} from '@shared/ipc';

/** the list with `fixture` replacing the one with its id, or appended if it is new */
export const withFixture = (fixtures: readonly Fixture[], fixture: Fixture): Fixture[] =>
  fixtures.some(({id}) => id === fixture.id)
    ? fixtures.map((current) => (current.id === fixture.id ? fixture : current))
    : [...fixtures, fixture];

export const withoutFixture = (fixtures: readonly Fixture[], fixtureId: string): Fixture[] =>
  fixtures.filter(({id}) => id !== fixtureId);
