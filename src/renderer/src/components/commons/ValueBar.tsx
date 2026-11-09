import {assignInlineVars} from '@vanilla-extract/dynamic';

import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';

import {valueBar, valueBarColor, valueBarFill} from './ValueBar.css';

interface ValueBarProps {
  /** a DMX value; one out of range is held to the bar's ends, one that isn't a number leaves it empty */
  value: number;
  /** as stored, `#rrggbb`; a neutral bar without one */
  color?: string;
}

const fillOf = (value: number): number =>
  Number.isFinite(value) ? Math.min(Math.max((value - DMX_MIN_VALUE) / (DMX_MAX_VALUE - DMX_MIN_VALUE), 0), 1) : 0;

/** a value shown as a thin bar, display only: the field beside it says the number */
const ValueBar = ({value, color}: ValueBarProps) => (
  <span
    className={valueBar}
    style={assignInlineVars({
      [valueBarFill]: String(fillOf(value)),
      ...(color !== undefined && {[valueBarColor]: color})
    })}
    aria-hidden
  />
);

export default ValueBar;
