import {Fragment} from 'react';

import {FixtureDraft, withChannelChange, withNewChannel, withoutChannel} from '@/data/fixtureDraft';

import Button from '../commons/Button';
import {AddIcon, RemoveIcon} from '../commons/icons';
import {addChannel, channelNameInput, channelRows, columnHeader, offsetInput} from './FixtureChannelRows.css';

interface FixtureChannelRowsProps {
  draft: FixtureDraft;
  onChange: (draft: FixtureDraft) => void;
}

/** a row per channel of the fixture being edited: its name and its offset from the start address */
const FixtureChannelRows = ({draft, onChange}: FixtureChannelRowsProps) => (
  <div className={channelRows}>
    <span className={columnHeader}>Channel</span>
    <span className={columnHeader}>Offset</span>
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
        <Button onClick={() => onChange(withoutChannel(draft, index))} title="Remove the channel">
          <RemoveIcon />
        </Button>
      </Fragment>
    ))}
    <span className={addChannel}>
      <Button onClick={() => onChange(withNewChannel(draft))}>
        <AddIcon /> Add channel
      </Button>
    </span>
  </div>
);

export default FixtureChannelRows;
