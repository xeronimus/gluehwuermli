import {Direction, Range} from 'react-range';

import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';

import {toPercent} from '@/data/channelValues';
import Fader from '@/domain/Fader';
import {selectChannelValue} from '@/state/channels/channelsSelectors';
import {useAppStore} from '@/state/store';

import {
  channelFader,
  faderLabel,
  faderLabelButton,
  faderPercent,
  faderStepButton,
  faderThumb,
  faderTrack,
  faderValue
} from './ChannelFader.css';

const DMX_STEP = 1;

interface ChannelFaderProps {
  fader: Fader;
  onChange: (channel: number, value: number) => void;
}

/**
 * a vertical 0..255 fader; reads only its own channel from the store, so moving it re-renders only itself. A click on
 * the value above it steps up by one, a click on the label below it steps down by one
 */
const ChannelFader = ({fader, onChange}: ChannelFaderProps) => {
  const value = useAppStore((state) => selectChannelValue(state, fader.channel));

  return (
    <div className={channelFader}>
      <button
        className={faderStepButton}
        onClick={() => onChange(fader.channel, value + DMX_STEP)}
        title={`Channel ${fader.label} +${DMX_STEP}`}
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
        onChange={([position]) => onChange(fader.channel, position ?? DMX_MIN_VALUE)}
        renderTrack={({props, children}) => (
          // react-range positions the thumb through the style it passes in
          <div {...props} className={faderTrack}>
            {children}
          </div>
        )}
        renderThumb={({props: {key, ...thumbProps}}) => (
          <div key={key} {...thumbProps} className={faderThumb} aria-label={`Channel ${fader.label}`} />
        )}
      />
      <button
        className={faderLabelButton}
        onClick={() => onChange(fader.channel, value - DMX_STEP)}
        title={`Channel ${fader.label} -${DMX_STEP}`}
      >
        <span className={faderLabel}>{fader.label}</span>
      </button>
    </div>
  );
};

export default ChannelFader;
