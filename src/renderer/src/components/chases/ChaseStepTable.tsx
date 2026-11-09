import {Trans, useLingui} from '@lingui/react/macro';

import type {ChaseError} from '@shared/chases';

import {type ChaseDraft, type ChaseStepValueDraft, withoutStepValues} from '@/data/chaseDraft';
import type {StepRowMark} from '@/data/chaseStepMarks';
import {type ChaseStepGroup, groupValueIndexes, rowErrors} from '@/data/chaseStepTable';

import Button from '../commons/Button';
import {RemoveIcon} from '../commons/icons';
import {cell, groupHeading, groupRemove, headerCell, stepTable} from './ChaseStepTable.css';
import ChaseStepValueRow from './ChaseStepValueRow';

interface ChaseStepTableProps {
  groups: readonly ChaseStepGroup[];
  stepIndex: number;
  /** what is wrong with the step: the problems of a row are shown on it */
  errors: readonly ChaseError[];
  /** how the row with this value id is marked: by a hovered button of a panel, or after its click */
  markOf: (valueId: string) => StepRowMark;
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
  onChannelFocus: (value: ChaseStepValueDraft) => void;
  onChannelLeft: (nextFocus: EventTarget | null) => void;
}

const groupKeyOf = (group: ChaseStepGroup) => (group.kind === 'fixture' ? group.fixture.id : 'unassigned');

/** the channels a step sets, in a table with a heading per fixture (its name once) and one for Unassigned */
const ChaseStepTable = ({
  groups,
  stepIndex,
  errors,
  markOf,
  onChange,
  onChannelFocus,
  onChannelLeft
}: ChaseStepTableProps) => {
  const {t} = useLingui();

  const removeTitleOf = (group: ChaseStepGroup) => {
    if (group.kind === 'unassigned') {
      return t`Remove all unassigned channels`;
    }
    const fixtureName = group.fixture.name;
    return t`Remove all channels of ${fixtureName}`;
  };

  return (
    <table className={stepTable}>
      <thead>
        <tr>
          <th className={headerCell} scope="col">
            <Trans>Ch</Trans>
          </th>
          <th className={headerCell} scope="col">
            <Trans>Channel</Trans>
          </th>
          <th className={headerCell} scope="col">
            <Trans>Value</Trans>
          </th>
          <th className={headerCell} aria-label={t`Remove`} />
        </tr>
      </thead>
      {groups.map((group) => (
        <tbody key={groupKeyOf(group)}>
          <tr>
            <th className={groupHeading} scope="rowgroup" colSpan={3}>
              {group.kind === 'fixture' ? group.fixture.name : <Trans>Unassigned</Trans>}
            </th>
            <td className={cell}>
              <span className={groupRemove}>
                <Button
                  variant="icon"
                  onClick={() => onChange((draft) => withoutStepValues(draft, stepIndex, groupValueIndexes(group)))}
                  title={removeTitleOf(group)}
                >
                  <RemoveIcon />
                </Button>
              </span>
            </td>
          </tr>
          {group.rows.map((row) => (
            // by id: the rows are sorted by channel when one is left, and each row moves with its fields
            <ChaseStepValueRow
              key={row.value.id}
              row={row}
              stepIndex={stepIndex}
              errors={rowErrors(errors, row.valueIndex)}
              mark={markOf(row.value.id)}
              onChange={onChange}
              onChannelFocus={onChannelFocus}
              onChannelLeft={onChannelLeft}
            />
          ))}
        </tbody>
      ))}
    </table>
  );
};

export default ChaseStepTable;
