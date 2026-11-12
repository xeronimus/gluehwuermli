import {MouseEvent} from 'react';

import {useLingui} from '@lingui/react/macro';
import {assignInlineVars} from '@vanilla-extract/dynamic';

import {cappedValue, isWithinCap} from '@/data/channelLocks';
import {toPercent} from '@/data/channelValues';
import {faderRange, positionButtons} from '@/data/faderStops';
import Fader from '@/domain/Fader';
import {selectChannelValue} from '@/state/channels/channelsSelectors';
import {selectChannelLimit, selectLiftedChannelLimit} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import {MomentaryIcon} from '../commons/icons';
import {useFaderTitles} from '../commons/useFaderTitles';
import {
  buttonColor,
  channelButtons,
  channelButtonsCapLifted,
  channelLabel,
  channelPercent,
  channelValue,
  momentaryMarker,
  positionButton,
  positionStack
} from './ChannelPositionButtons.css';
import {useMomentaryPress} from './useMomentaryPress';

interface ChannelPositionButtonsProps {
  fader: Fader;
  onChange: (channel: number, value: number) => void;
}

/**
 * a positions channel set to buttons, in place of its fader: a button per position, the highest value on top like
 * on the fader, the one of the channel's value on (in the channel's color), none for a value off the positions.
 * Positions above the channel lock's cap are disabled. Reads only its own channel from the store, like the fader; a
 * right click sets the lowest position, like a fader's sets its min. A momentary position's button (with a marker)
 * sets its value only while held and then puts back the one from before (useMomentaryPress)
 */
const ChannelPositionButtons = ({fader, onChange}: ChannelPositionButtonsProps) => {
  const {t} = useLingui();
  const limit = useAppStore((state) => selectChannelLimit(state, fader.channel));
  const liftedLimit = useAppStore((state) => selectLiftedChannelLimit(state, fader.channel));
  const value = cappedValue(
    useAppStore((state) => selectChannelValue(state, fader.channel)),
    limit
  );
  const titles = useFaderTitles(fader, {limit, liftedLimit});
  const colorVars = fader.color === undefined ? {} : assignInlineVars({[buttonColor]: fader.color});
  const sendIfChanged = (next: number) => {
    if (next !== value && isWithinCap(next, limit)) {
      onChange(fader.channel, next);
    }
  };
  const momentaryHandlers = useMomentaryPress(fader.channel, value, limit, onChange);
  const setToLowest = (event: MouseEvent) => {
    event.preventDefault();
    sendIfChanged(faderRange(fader).min);
  };

  return (
    <div
      className={liftedLimit === undefined ? channelButtons : channelButtonsCapLifted}
      title={liftedLimit === undefined ? undefined : titles.lifted}
      style={colorVars}
      onContextMenu={setToLowest}
    >
      <span className={channelValue}>{value}</span>
      <span className={channelPercent}>{toPercent(value)}%</span>
      <div className={positionStack} role="group" aria-label={titles.thumb}>
        {positionButtons(fader).map((position) => {
          const allowed = isWithinCap(position.value, limit);
          return (
            <button
              key={position.value}
              type="button"
              className={positionButton[position.value === value ? 'active' : 'inactive']}
              aria-pressed={position.value === value}
              disabled={!allowed}
              title={allowed ? (position.momentary ? t`Only while held` : undefined) : titles.locked}
              {...(position.momentary
                ? momentaryHandlers(position.value)
                : {onClick: () => sendIfChanged(position.value)})}
            >
              {position.label}
              {position.momentary && <MomentaryIcon className={momentaryMarker} aria-hidden />}
            </button>
          );
        })}
      </div>
      <span className={channelLabel}>{fader.label}</span>
    </div>
  );
};

export default ChannelPositionButtons;
