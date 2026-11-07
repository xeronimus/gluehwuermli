import {Direction, Range} from 'react-range';

import {assignInlineVars} from '@vanilla-extract/dynamic';

import type {ValueRange} from '@shared/channelValueRules';
import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';

import {cappedValue, isAtCap, isFaderLocked} from '@/data/channelLocks';
import {glowLevel, toPercent} from '@/data/channelValues';
import {faderPositions, faderRange, loweredFaderValue, raisedFaderValue, snappedFaderValue} from '@/data/faderStops';
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
import FaderTicks from './FaderTicks';
import {LockIcon} from './icons';
import {useFaderTitles} from './useFaderTitles';

/** the slider moves by one; where it stops is up to the fader's rules (snappedFaderValue) */
const SLIDER_STEP = 1;

/** the track of a colored fader is filled and glows up to the value, relative to its range; an uncolored one is plain */
const trackLookOf = (color: string | undefined, value: number, range: ValueRange) =>
  color === undefined
    ? {className: faderTrack, colorVars: {}}
    : {
        className: faderTrackColored,
        colorVars: assignInlineVars({[faderColor]: color, [faderLevel]: String(glowLevel(value, range))})
      };

interface ChannelFaderProps {
  fader: Fader;
  onChange: (channel: number, value: number) => void;
}

/**
 * a vertical 0..255 fader; reads only its own channel from the store, so moving it re-renders only itself. A fixture
 * channel with value rules stops only at its values (the handle at the real DMX value), the others at every value.
 * A click on the value above it goes to the next stop, a click on the label below it to the previous one. A
 * positions fader shows a tick per position, named on mouse over. A channel capped by the channel lock stops at its cap (one
 * capped at 0 can't be moved at all) and shows the value the main process sends. A fader with a color fills its track
 * with it below the handle and glows the stronger the closer the value is to its max
 */
const ChannelFader = ({fader, onChange}: ChannelFaderProps) => {
  const limit = useAppStore((state) => selectChannelLimit(state, fader.channel));
  const liftedLimit = useAppStore((state) => selectLiftedChannelLimit(state, fader.channel));
  const value = cappedValue(
    useAppStore((state) => selectChannelValue(state, fader.channel)),
    limit
  );
  const titles = useFaderTitles(fader, {limit, liftedLimit});
  const locked = isFaderLocked(limit);
  const trackLook = trackLookOf(fader.color, value, faderRange(fader));
  const positions = faderPositions(fader);
  const raised = raisedFaderValue(fader, value);
  const lowered = loweredFaderValue(fader, value);
  const sendIfChanged = (next: number) => {
    if (next !== value) {
      onChange(fader.channel, next);
    }
  };

  return (
    <div
      className={liftedLimit === undefined ? channelFader : channelFaderCapLifted}
      title={liftedLimit === undefined ? undefined : titles.lifted}
    >
      <button
        className={faderStepButton}
        onClick={() => raised !== undefined && onChange(fader.channel, raised)}
        disabled={raised === undefined || isAtCap(value, limit)}
        title={locked ? titles.locked : titles.raise}
      >
        <span className={faderValue}>{value}</span>
        <span className={faderPercent}>{toPercent(value)}%</span>
      </button>
      <Range
        direction={Direction.Up}
        min={DMX_MIN_VALUE}
        max={DMX_MAX_VALUE}
        step={SLIDER_STEP}
        values={[value]}
        disabled={locked}
        onChange={([position]) => sendIfChanged(snappedFaderValue(fader, position ?? DMX_MIN_VALUE))}
        renderTrack={({props, children}) => (
          // react-range positions the thumb through the style it passes in; the color goes in as CSS variables
          <div {...props} style={{...props.style, ...trackLook.colorVars}} className={trackLook.className}>
            {positions.length > 0 && <FaderTicks positions={positions} disabled={locked} onSelect={sendIfChanged} />}
            {children}
          </div>
        )}
        renderThumb={({props: {key, ...thumbProps}}) => (
          <div key={key} {...thumbProps} className={locked ? faderThumbLocked : faderThumb} aria-label={titles.thumb}>
            {limit !== undefined && <LockIcon className={faderLock} />}
          </div>
        )}
      />
      <button
        className={faderLabelButton}
        onClick={() => lowered !== undefined && onChange(fader.channel, lowered)}
        disabled={lowered === undefined || locked}
        title={locked ? titles.locked : titles.lower}
      >
        <span className={faderLabel}>{fader.label}</span>
      </button>
    </div>
  );
};

export default ChannelFader;
