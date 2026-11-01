import {Fragment} from 'react';

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
const FixtureChannelRows = ({draft, onChange}: FixtureChannelRowsProps) => (
  <div className={channelsSection}>
    <h3 className={sectionTitle}>Channels ({draft.channels.length})</h3>
    <div className={channelRows}>
      <span className={columnHeader}>Channel</span>
      <span className={columnHeader}>Offset</span>
      <span className={columnHeader}>Address</span>
      <span className={columnHeader} title="The highest value while the channel lock is on; empty for no lock">
        Max while locked
      </span>
      <span />
      {draft.channels.map((channel, index) => (
        // the index is the identity of a row: rows are only appended or removed, never reordered
        <Fragment key={index}>
          <input
            className={channelNameInput}
            value={channel.name}
            placeholder="e.g. Dimmer"
            aria-label={`Name of channel ${index + 1}`}
            onChange={(event) => onChange(withChannelChange(draft, index, {name: event.target.value}))}
          />
          <input
            className={offsetInput}
            type="number"
            min={0}
            value={channel.offset}
            aria-label={`Offset of channel ${index + 1}`}
            onChange={(event) => onChange(withChannelChange(draft, index, {offset: event.target.value}))}
          />
          <span className={channelAddress}>{draftChannelAddress(draft, channel) ?? NO_ADDRESS}</span>
          <input
            className={lockMaxInput}
            type="number"
            min={DMX_MIN_VALUE}
            max={DMX_MAX_VALUE}
            value={channel.lockMax}
            placeholder="no lock"
            aria-label={`Maximum of channel ${index + 1} while locked`}
            onChange={(event) => onChange(withChannelChange(draft, index, {lockMax: event.target.value}))}
          />
          <Button onClick={() => onChange(withoutChannel(draft, index))} title="Remove the channel">
            <RemoveIcon />
          </Button>
        </Fragment>
      ))}
    </div>
    <span className={addChannel}>
      <Button onClick={() => onChange(withNewChannel(draft))}>
        <AddIcon /> Add channel
      </Button>
    </span>
  </div>
);

export default FixtureChannelRows;
