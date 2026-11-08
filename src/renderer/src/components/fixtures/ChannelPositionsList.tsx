import {Fragment} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';
import {CHANNEL_POSITION_NAME_MAX_LENGTH} from '@shared/ipc';

import {
  type ChannelValuesDraft,
  type PositionsDisplay,
  withNewPosition,
  withPositionChange,
  withoutPosition
} from '@/data/channelValuesDraft';

import Button from '../commons/Button';
import ModeToggle, {type Mode} from '../commons/ModeToggle';
import {AddIcon, RemoveIcon} from '../commons/icons';
import {
  positionActions,
  positionNameInput,
  positionRows,
  positionValueInput,
  positionsList
} from './ChannelPositionsList.css';

interface ChannelPositionsListProps {
  values: ChannelValuesDraft;
  row: number;
  onChange: (values: ChannelValuesDraft) => void;
}

/**
 * the positions of a positions channel, below its row in the channels: a value and an optional name each; and whether
 * the Show view has a fader for them or a button per position
 */
const ChannelPositionsList = ({values, row, onChange}: ChannelPositionsListProps) => {
  const {t} = useLingui();
  const displays: readonly Mode<PositionsDisplay>[] = [
    {id: 'fader', label: t`Fader`},
    {id: 'buttons', label: t`Buttons`}
  ];
  return (
    <div className={positionsList}>
      <div className={positionRows}>
        {values.positions.map((position, index) => {
          const positionNumber = index + 1;
          return (
            // the index is the identity of a position: they are only appended or removed, never reordered
            <Fragment key={index}>
              <input
                className={positionValueInput}
                type="number"
                min={DMX_MIN_VALUE}
                max={DMX_MAX_VALUE}
                value={position.value}
                aria-label={t`Value of position ${positionNumber} of channel ${row}`}
                onChange={(event) => onChange(withPositionChange(values, index, {value: event.target.value}))}
              />
              <input
                className={positionNameInput}
                value={position.name}
                maxLength={CHANNEL_POSITION_NAME_MAX_LENGTH}
                placeholder={t`Name, e.g. Star (optional)`}
                aria-label={t`Name of position ${positionNumber} of channel ${row}`}
                onChange={(event) => onChange(withPositionChange(values, index, {name: event.target.value}))}
              />
              <Button onClick={() => onChange(withoutPosition(values, index))} title={t`Remove the position`}>
                <RemoveIcon />
              </Button>
            </Fragment>
          );
        })}
      </div>
      <span className={positionActions}>
        <Button onClick={() => onChange(withNewPosition(values))}>
          <AddIcon /> <Trans>Add position</Trans>
        </Button>
        <span title={t`In the Show view: a fader, or a button per position`}>
          <ModeToggle
            modes={displays}
            activeId={values.display}
            onSelect={(display) => onChange({...values, display})}
          />
        </span>
      </span>
    </div>
  );
};

export default ChannelPositionsList;
