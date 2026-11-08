import {useLingui} from '@lingui/react/macro';

import type {Chase} from '@shared/ipc';

import {chaseRowState} from '@/data/chaseRows';
import {useActionPlayChase} from '@/state/actionHooks/playChase';
import {useActionDeleteChase, useActionMoveChase} from '@/state/actionHooks/saveFixtures';
import {selectChases} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {AddChaseIcon} from '../commons/icons';
import {addChase, chaseList, chaseRows, errorMessage} from './ChaseList.css';
import ChaseRow from './ChaseRow';

/** changing the chases, only in Setup mode */
export interface ChaseListEditing {
  onEdit: (chase: Chase) => void;
  onAdd: () => void;
  /** while an editor is open: no other edit, and the chase being edited can't be deleted under the editor */
  disabled: boolean;
}

interface ChaseListProps {
  /** undefined in Show mode: chases can be played, not changed */
  editing: ChaseListEditing | undefined;
}

/**
 * The open project's chases, one row each in their saved order, played with the mouse in Show and Setup mode. Only
 * these rows show that a chase plays: nothing in the top bar or the window title. In Setup mode each row can be moved,
 * edited and deleted, and Add chase follows the last row.
 */
const ChaseList = ({editing}: ChaseListProps) => {
  const {t, i18n} = useLingui();
  const chases = useAppStore(selectChases);
  const status = useAppStore((state) => state.chaseStatus);
  const error = useAppStore((state) => state.chaseError);
  const playChase = useActionPlayChase();
  const deleteChase = useActionDeleteChase();
  const moveChase = useActionMoveChase();

  if (chases.length === 0 && !editing) {
    return null;
  }

  const onDelete = (chase: Chase) => {
    const chaseName = chase.name;
    if (window.confirm(t`Delete the chase ${chaseName}?`)) {
      void deleteChase(chase);
    }
  };

  return (
    <section className={chaseList} aria-label={t`Chases`}>
      {error && <span className={errorMessage}>{i18n._(error)}</span>}
      <ul className={chaseRows}>
        {chases.map((chase, index) => (
          <ChaseRow
            key={chase.id}
            chase={chase}
            rowState={chaseRowState(chase, status, chases)}
            onControl={(control) => void playChase(control, chase.id)}
            actions={
              editing && {
                onEdit: () => editing.onEdit(chase),
                onDelete: () => onDelete(chase),
                onMove: (direction) => void moveChase(chase, direction),
                index,
                count: chases.length,
                disabled: editing.disabled
              }
            }
          />
        ))}
      </ul>
      {editing && (
        <span className={addChase}>
          <Button onClick={editing.onAdd} disabled={editing.disabled} title={t`Add chase`}>
            <AddChaseIcon />
          </Button>
        </span>
      )}
    </section>
  );
};

export default ChaseList;
