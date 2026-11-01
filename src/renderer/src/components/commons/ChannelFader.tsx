import {Direction, Range} from 'react-range';

import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';

import {cappedValue, isAtCap, isFaderLocked} from '@/data/channelLocks';
import {toPercent} from '@/data/channelValues';
import Fader from '@/domain/Fader';
import {selectChannelValue} from '@/state/channels/channelsSelectors';
import {selectChannelLimit} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import {
  channelFader,
  faderLabel,
  faderLabelButton,
  faderLock,
  faderPercent,
  faderStepButton,
  faderThumb,
  faderThumbLocked,
  faderTrack,
  faderValue
} from './ChannelFader.css';
import {LockIcon} from './icons';

const DMX_STEP = 1;

const capNote = (limit: number | undefined) => (limit === undefined ? '' : `, capped at ${limit} by the channel lock`);

interface ChannelFaderProps {
  fader: Fader;
  onChange: (channel: number, value: number) => void;
}

/**
 * a vertical 0..255 fader; reads only its own channel from the store, so moving it re-renders only itself. A click on
 * the value above it steps up by one, a click on the label below it steps down by one. A channel capped by the channel
 * lock stops at its cap (one capped at 0 can't be moved at all) and shows the value the main process sends
 */
const ChannelFader = ({fader, onChange}: ChannelFaderProps) => {
  const limit = useAppStore((state) => selectChannelLimit(state, fader.channel));
  const value = cappedValue(
    useAppStore((state) => selectChannelValue(state, fader.channel)),
    limit
  );
  const locked = isFaderLocked(limit);
  const lockedTitle = `Channel ${fader.label} is capped at ${limit} by the channel lock`;

  return (
    <div className={channelFader}>
      <button
        className={faderStepButton}
        onClick={() => onChange(fader.channel, value + DMX_STEP)}
        disabled={isAtCap(value, limit)}
        title={locked ? lockedTitle : `Channel ${fader.label} +${DMX_STEP}${capNote(limit)}`}
      >
        <span className={faderValue}>{value}</span>
        <span className={faderPercent}>{toPercent(value)}%</span>
      </button>
      <Range
        direction={Direction.Up}
        min={DMX_MIN_VALUE}
        max={DMX_MAX_VALUE}
        step={DMX_STEP}
        values={[value]}
        disabled={locked}
        onChange={([position]) => onChange(fader.channel, position ?? DMX_MIN_VALUE)}
        renderTrack={({props, children}) => (
          // react-range positions the thumb through the style it passes in
          <div {...props} className={faderTrack}>
            {children}
          </div>
        )}
        renderThumb={({props: {key, ...thumbProps}}) => (
          <div
            key={key}
            {...thumbProps}
            className={locked ? faderThumbLocked : faderThumb}
            aria-label={`Channel ${fader.label}`}
          >
            {limit !== undefined && <LockIcon className={faderLock} />}
          </div>
        )}
      />
      <button
        className={faderLabelButton}
        onClick={() => onChange(fader.channel, value - DMX_STEP)}
        disabled={locked}
        title={locked ? lockedTitle : `Channel ${fader.label} -${DMX_STEP}`}
      >
        <span className={faderLabel}>{fader.label}</span>
      </button>
    </div>
  );
};

export default ChannelFader;
