import {SyntheticEvent} from 'react';

import {assignInlineVars} from '@vanilla-extract/dynamic';

import {DMX_MAX_VALUE} from '@shared/dmx';
import type {ChannelPosition} from '@shared/ipc';

import {tickBottom, tickMark} from './FaderTicks.css';

const PERCENT = 100;

interface FaderTicksProps {
  positions: readonly ChannelPosition[];
  disabled: boolean;
  onSelect: (value: number) => void;
}

/** the slider must not start a drag where a tick is clicked: the click moves the fader to the tick's position */
const keepFromSlider = (event: SyntheticEvent) => event.stopPropagation();

/**
 * the positions of a positions fader, a tick each across its track at the position's value; its name (or its value
 * without one) shows on mouse over, a click moves the fader there
 */
const FaderTicks = ({positions, disabled, onSelect}: FaderTicksProps) =>
  positions.map(({value, name}) => {
    // what the user named it is shown as typed, so no translation; without a name, its value
    const title = name ?? String(value);
    return (
      <button
        key={value}
        className={tickMark}
        style={assignInlineVars({[tickBottom]: `${(value / DMX_MAX_VALUE) * PERCENT}%`})}
        disabled={disabled}
        // no tab stop of its own: the keys on the handle and the step buttons reach every position already
        tabIndex={-1}
        title={title}
        aria-label={title}
        onMouseDown={keepFromSlider}
        onTouchStart={keepFromSlider}
        onClick={() => onSelect(value)}
      />
    );
  });

export default FaderTicks;
