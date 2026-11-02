import {Fragment} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';

import {
  FixtureDraft,
  draftChannelAddress,
  withChannelChange,
  withNewChannel,
  withoutChannel
} from '@/data/fixtureDraft';

import Button from '../commons/Button';
import {AddIcon, RemoveIcon} from '../commons/icons';
import {
  addChannel,
  channelAddress,
  channelNameInput,
  channelRows,
  channelsSection,
  columnHeader,
  lockMaxInput,
  offsetInput
} from './FixtureChannelRows.css';
import {sectionTitle} from './FixtureEditor.css';

/** shown while the start address or the offset doesn't give a valid address */
const NO_ADDRESS = '–';

interface FixtureChannelRowsProps {
  draft: FixtureDraft;
  onChange: (draft: FixtureDraft) => void;
}

/**
 * a row per channel of the fixture being edited: its name, its offset from the start address, where it lands and its
 * cap while the channel lock is on
 */
const FixtureChannelRows = ({draft, onChange}: FixtureChannelRowsProps) => {
  const {t} = useLingui();
  const channelCount = draft.channels.length;
  return (
    <div className={channelsSection}>
      <h3 className={sectionTitle}>
        <Trans>Channels ({channelCount})</Trans>
      </h3>
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
        <span className={columnHeader} title={t`The highest value while the channel lock is on; empty for no lock`}>
          <Trans>Max while locked</Trans>
        </span>
        <span />
        {draft.channels.map((channel, index) => {
          const row = index + 1;
          return (
            // the index is the identity of a row: rows are only appended or removed, never reordered
            <Fragment key={index}>
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
              <input
                className={lockMaxInput}
                type="number"
                min={DMX_MIN_VALUE}
                max={DMX_MAX_VALUE}
                value={channel.lockMax}
                placeholder={t`no lock`}
                aria-label={t`Maximum of channel ${row} while locked`}
                onChange={(event) => onChange(withChannelChange(draft, index, {lockMax: event.target.value}))}
              />
              <Button onClick={() => onChange(withoutChannel(draft, index))} title={t`Remove the channel`}>
                <RemoveIcon />
              </Button>
            </Fragment>
          );
        })}
      </div>
      <span className={addChannel}>
        <Button onClick={() => onChange(withNewChannel(draft))}>
          <AddIcon /> <Trans>Add channel</Trans>
        </Button>
      </span>
    </div>
  );
};

export default FixtureChannelRows;
