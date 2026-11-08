import {useLingui} from '@lingui/react/macro';

import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';

import {FixtureDraft, draftChannelAddress, withChannelChange, withoutChannel} from '@/data/fixtureDraft';
import type {MoveDirection} from '@/data/listOrder';

import Button from '../commons/Button';
import MoveButtons from '../commons/MoveButtons';
import {RemoveIcon} from '../commons/icons';
import ChannelPositionsList from './ChannelPositionsList';
import ChannelValuesField from './ChannelValuesField';
import ColorField from './ColorField';
import {
  type ChannelRowGlow,
  channelAddress,
  channelNameInput,
  channelRow,
  lockMaxInput,
  offsetInput,
  rowActions
} from './FixtureChannelRows.css';

/** shown while the start address or the offset doesn't give a valid address */
const NO_ADDRESS = '–';

/** the placeholder of an empty lock field: the column's title says that empty means no lock */
const NO_LOCK = '–';

interface FixtureChannelRowProps {
  draft: FixtureDraft;
  index: number;
  onChange: (draft: FixtureDraft) => void;
  onMove: (direction: MoveDirection) => void;
  /** whether the row glows: it was just moved */
  glow: ChannelRowGlow;
}

/** one channel of the fixture being edited, a row of FixtureChannelRows' columns; its positions are listed below it */
const FixtureChannelRow = ({draft, index, onChange, onMove, glow}: FixtureChannelRowProps) => {
  const {t} = useLingui();
  const channel = draft.channels[index];
  const row = index + 1;
  return (
    <div className={channelRow[glow]}>
      <input
        className={channelNameInput}
        value={channel.name}
        placeholder={t`e.g. Dimmer`}
        aria-label={t`Name of channel ${row}`}
        onChange={(event) => onChange(withChannelChange(draft, index, {name: event.target.value}))}
      />
      <input
        className={offsetInput}
        type="number"
        min={0}
        value={channel.offset}
        aria-label={t`Offset of channel ${row}`}
        onChange={(event) => onChange(withChannelChange(draft, index, {offset: event.target.value}))}
      />
      <span className={channelAddress}>{draftChannelAddress(draft, channel) ?? NO_ADDRESS}</span>
      <ChannelValuesField
        values={channel.values}
        row={row}
        onChange={(values) => onChange(withChannelChange(draft, index, {values}))}
      />
      <input
        className={lockMaxInput}
        type="number"
        min={DMX_MIN_VALUE}
        max={DMX_MAX_VALUE}
        value={channel.lockMax}
        placeholder={NO_LOCK}
        aria-label={t`Maximum of channel ${row} while locked`}
        onChange={(event) => onChange(withChannelChange(draft, index, {lockMax: event.target.value}))}
      />
      <ColorField
        color={channel.color}
        label={t`Color of channel ${row}`}
        onChange={(color) => onChange(withChannelChange(draft, index, {color}))}
      />
      <span className={rowActions}>
        <MoveButtons
          orientation="vertical"
          index={index}
          count={draft.channels.length}
          onMove={onMove}
          titles={{earlier: t`Move channel ${row} up`, later: t`Move channel ${row} down`}}
        />
        <Button onClick={() => onChange(withoutChannel(draft, index))} title={t`Remove the channel`}>
          <RemoveIcon />
        </Button>
      </span>
      {channel.values.mode === 'positions' && (
        <ChannelPositionsList
          values={channel.values}
          row={row}
          onChange={(values) => onChange(withChannelChange(draft, index, {values}))}
        />
      )}
    </div>
  );
};

export default FixtureChannelRow;
