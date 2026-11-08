import {useLingui} from '@lingui/react/macro';

import {chaseRowState} from '@/data/chaseRows';
import {useActionPlayChase} from '@/state/actionHooks/playChase';
import {selectChases} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import {chaseList, chaseRows, errorMessage} from './ChaseList.css';
import ChaseRow from './ChaseRow';

/**
 * The open project's chases, one row each in their saved order, played with the mouse in Show and Setup mode. Only
 * these rows show that a chase plays: nothing in the top bar or the window title.
 */
const ChaseList = () => {
  const {t, i18n} = useLingui();
  const chases = useAppStore(selectChases);
  const status = useAppStore((state) => state.chaseStatus);
  const error = useAppStore((state) => state.chaseError);
  const playChase = useActionPlayChase();

  if (chases.length === 0) {
    return null;
  }

  return (
    <section className={chaseList} aria-label={t`Chases`}>
      {error && <span className={errorMessage}>{i18n._(error)}</span>}
      <ul className={chaseRows}>
        {chases.map((chase) => (
          <ChaseRow
            key={chase.id}
            chase={chase}
            rowState={chaseRowState(chase, status, chases)}
            onControl={(control) => void playChase(control, chase.id)}
          />
        ))}
      </ul>
    </section>
  );
};

export default ChaseList;
