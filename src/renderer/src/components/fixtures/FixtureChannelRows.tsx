import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {FixtureDraft, withChannelMoved, withNewChannel} from '@/data/fixtureDraft';
import type {MoveDirection} from '@/data/listOrder';

import Button from '../commons/Button';
import {AddIcon} from '../commons/icons';
import {ChannelValuesHeader} from './ChannelValuesField';
import FixtureChannelRow from './FixtureChannelRow';
import {type ChannelRowGlow, addChannel, channelRows, channelsSection, columnHeader} from './FixtureChannelRows.css';

/** the channel moved last, and how many moves so far: each move starts its glow again, the same row's too */
interface LastMove {
  readonly channelId: string;
  readonly count: number;
}

/**
 * the glow of a row: none, or the one of the last move. Two alternating glows, because a class that stays on the row
 * doesn't start its animation again when the same row is moved once more
 */
const glowOf = (channelId: string, lastMove: LastMove | undefined): ChannelRowGlow =>
  lastMove?.channelId !== channelId ? 'none' : lastMove.count % 2 === 0 ? 'even' : 'odd';

interface FixtureChannelRowsProps {
  draft: FixtureDraft;
  onChange: (draft: FixtureDraft) => void;
}

/**
 * a row per channel of the fixture being edited: its name, its offset from the start address, where it lands, the
 * values its fader stops at, its cap while the channel lock is on and the color its fader glows in, in the order its
 * faders are shown; the arrows change that order, and the moved row glows for a moment to show where it went. The
 * positions of a positions channel are listed below its row
 */
const FixtureChannelRows = ({draft, onChange}: FixtureChannelRowsProps) => {
  const {t} = useLingui();
  const [lastMove, setLastMove] = useState<LastMove>();

  const moveChannel = (index: number, direction: MoveDirection) => {
    const channelId = draft.channels[index].id;
    setLastMove((previous) => ({channelId, count: (previous?.count ?? 0) + 1}));
    onChange(withChannelMoved(draft, index, direction));
  };
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
        <ChannelValuesHeader labelClassName={columnHeader} />
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
        {draft.channels.map((channel, index) => (
          <FixtureChannelRow
            key={channel.id}
            draft={draft}
            index={index}
            onChange={onChange}
            onMove={(direction) => moveChannel(index, direction)}
            glow={glowOf(channel.id, lastMove)}
          />
        ))}
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
