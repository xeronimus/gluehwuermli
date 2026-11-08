import {useLingui} from '@lingui/react/macro';

import {overlapMessage} from '@/i18n/messages/fixtureMessages';
import {selectFixtureOverlaps} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import {WarningIcon} from '../commons/icons';
import {warnings} from './FixtureView.css';

/** fixtures sharing an address: allowed, but said above the fixtures in case it wasn't meant */
const FixtureOverlapWarnings = () => {
  const {i18n} = useLingui();
  const overlaps = useAppStore(selectFixtureOverlaps);
  if (overlaps.length === 0) {
    return null;
  }
  return (
    <ul className={warnings}>
      {overlaps.map((overlap) => (
        <li key={`${overlap.first.id}-${overlap.second.id}`}>
          <WarningIcon /> {i18n._(overlapMessage(overlap))}
        </li>
      ))}
    </ul>
  );
};

export default FixtureOverlapWarnings;
