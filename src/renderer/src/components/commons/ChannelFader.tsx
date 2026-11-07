import {Direction, Range} from 'react-range';

import {useLingui} from '@lingui/react/macro';
import {assignInlineVars} from '@vanilla-extract/dynamic';

import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';

import {cappedValue, isAtCap, isFaderLocked} from '@/data/channelLocks';
import {glowLevel, toPercent} from '@/data/channelValues';
import Fader from '@/domain/Fader';
import {selectChannelValue} from '@/state/channels/channelsSelectors';
import {selectChannelLimit, selectLiftedChannelLimit} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import {
  channelFader,
  channelFaderCapLifted,
  faderColor,
  faderLabel,
  faderLabelButton,
  faderLevel,
  faderLock,
  faderPercent,
  faderStepButton,
  faderThumb,
  faderThumbLocked,
  faderTrack,
  faderTrackColored,
  faderValue
} from './ChannelFader.css';
import {LockIcon} from './icons';

const DMX_STEP = 1;

/** the track of a colored fader is filled and glows up to the value; an uncolored one is plain */
const trackLookOf = (color: string | undefined, value: number) =>
  color === undefined
    ? {className: faderTrack, colorVars: {}}
    : {
        className: faderTrackColored,
        colorVars: assignInlineVars({[faderColor]: color, [faderLevel]: String(glowLevel(value))})
      };

interface ChannelFaderProps {
  fader: Fader;
  onChange: (channel: number, value: number) => void;
}

/**
 * a vertical 0..255 fader; reads only its own channel from the store, so moving it re-renders only itself. A click on
 * the value above it steps up by one, a click on the label below it steps down by one. A channel capped by the channel
 * lock stops at its cap (one capped at 0 can't be moved at all) and shows the value the main process sends. A fader
 * with a color fills its track with it below the handle and glows the stronger the higher the value
 */
const ChannelFader = ({fader, onChange}: ChannelFaderProps) => {
  const limit = useAppStore((state) => selectChannelLimit(state, fader.channel));
  const liftedLimit = useAppStore((state) => selectLiftedChannelLimit(state, fader.channel));
  const value = cappedValue(
    useAppStore((state) => selectChannelValue(state, fader.channel)),
    limit
  );
  const {t} = useLingui();
  const locked = isFaderLocked(limit);
  const label = fader.label;
  const trackLook = trackLookOf(fader.color, value);
  const lockedTitle = t`Channel ${label} is capped at ${limit} by the channel lock`;
  const liftedTitle = t`Channel ${label} is not capped at ${liftedLimit}: the channel lock is lifted`;
  const raiseTitle =
    limit !== undefined
      ? t`Channel ${label} +${DMX_STEP}, capped at ${limit} by the channel lock`
      : liftedLimit !== undefined
        ? t`Channel ${label} +${DMX_STEP}, not capped at ${liftedLimit}: the channel lock is lifted`
        : t`Channel ${label} +${DMX_STEP}`;

  return (
    <div
      className={liftedLimit === undefined ? channelFader : channelFaderCapLifted}
      title={liftedLimit === undefined ? undefined : liftedTitle}
    >
      <button
        className={faderStepButton}
        onClick={() => onChange(fader.channel, value + DMX_STEP)}
        disabled={isAtCap(value, limit)}
        title={locked ? lockedTitle : raiseTitle}
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
          // react-range positions the thumb through the style it passes in; the color goes in as CSS variables
          <div {...props} style={{...props.style, ...trackLook.colorVars}} className={trackLook.className}>
            {children}
          </div>
        )}
        renderThumb={({props: {key, ...thumbProps}}) => (
          <div
            key={key}
            {...thumbProps}
            className={locked ? faderThumbLocked : faderThumb}
            aria-label={t`Channel ${label}`}
          >
            {limit !== undefined && <LockIcon className={faderLock} />}
          </div>
        )}
      />
      <button
        className={faderLabelButton}
        onClick={() => onChange(fader.channel, value - DMX_STEP)}
        disabled={locked}
        title={locked ? lockedTitle : t`Channel ${label} -${DMX_STEP}`}
      >
        <span className={faderLabel}>{fader.label}</span>
      </button>
    </div>
  );
};

export default ChannelFader;
