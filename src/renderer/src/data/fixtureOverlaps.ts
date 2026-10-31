import type {FixtureOverlap} from '@shared/fixtures';

const listOf = (addresses: readonly number[]) => addresses.join(', ');

export const describeOverlap = ({first, second, addresses}: FixtureOverlap): string =>
  `${first.name} and ${second.name} share ${addresses.length === 1 ? 'address' : 'addresses'} ${listOf(addresses)}`;
