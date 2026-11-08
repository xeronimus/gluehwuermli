import {Fragment} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';

import {
  FixtureDraft,
  draftChannelAddress,
  withChannelChange,
  withChannelMoved,
  withNewChannel,
  withoutChannel
} from '@/data/fixtureDraft';

import Button from '../commons/Button';
import MoveButtons from '../commons/MoveButtons';
import {AddIcon, RemoveIcon} from '../commons/icons';
import ChannelPositionsList from './ChannelPositionsList';
import ChannelValuesField from './ChannelValuesField';
import ColorField from './ColorField';
import {
  addChannel,
  channelAddress,
  channelNameInput,
  channelRows,
  channelsSection,
  columnHeader,
  lockMaxInput,
  moveButtons,
  offsetInput
} from './FixtureChannelRows.css';

/** shown while the start address or the offset doesn't give a valid address */
const NO_ADDRESS = '–';

/** the placeholder of an empty lock field: the column's title says that empty means no lock */
const NO_LOCK = '–';

interface FixtureChannelRowsProps {
  draft: FixtureDraft;
  onChange: (draft: FixtureDraft) => void;
}

/**
 * a row per channel of the fixture being edited: its name, its offset from the start address, where it lands, the
 * values its fader stops at, its cap while the channel lock is on and the color its fader glows in, in the order its
 * faders are shown; the arrows change that order. The positions of a positions channel are listed below its row
 */
const FixtureChannelRows = ({draft, onChange}: FixtureChannelRowsProps) => {
  const {t} = useLingui();
  const channelCount = draft.channels.length;
  return (
    <div className={channelsSection}>
      <div className={channelRows}>
        <span className={columnHeader}>
          <Trans>Channel</Trans>
        </span>
        <span className={columnHeader}>
          <Trans>Offset</Trans>
        </span>
        <span className={columnHeader}>
          <Trans>Address</Trans>
        </span>
        <span
          className={columnHeader}
          title={t`Where the fader stops: every value from min to max, in steps, or only at some positions`}
        >
          <Trans>Values</Trans>
        </span>
        <span className={columnHeader} title={t`The highest value while the channel lock is on; empty for no lock`}>
          <Trans>Max while locked</Trans>
        </span>
        <span
          className={columnHeader}
          title={t`The color its fader glows in, a hex value like #ff00ff; empty for none`}
        >
          <Trans>Color</Trans>
        </span>
        <span />
        <span />
        {draft.channels.map((channel, index) => {
          const row = index + 1;
          return (
            <Fragment key={channel.id}>
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
              <span className={moveButtons}>
                <MoveButtons
                  orientation="vertical"
                  index={index}
                  count={channelCount}
                  onMove={(direction) => onChange(withChannelMoved(draft, index, direction))}
                  titles={{earlier: t`Move channel ${row} up`, later: t`Move channel ${row} down`}}
                />
              </span>
              <Button onClick={() => onChange(withoutChannel(draft, index))} title={t`Remove the channel`}>
                <RemoveIcon />
              </Button>
              {channel.values.mode === 'positions' && (
                <ChannelPositionsList
                  values={channel.values}
                  row={row}
                  onChange={(values) => onChange(withChannelChange(draft, index, {values}))}
                />
              )}
            </Fragment>
          );
        })}
      </div>
      <span className={addChannel}>
        <Button onClick={() => onChange(withNewChannel(draft, crypto.randomUUID()))}>
          <AddIcon /> <Trans>Add channel</Trans>
        </Button>
      </span>
    </div>
  );
};

export default FixtureChannelRows;
