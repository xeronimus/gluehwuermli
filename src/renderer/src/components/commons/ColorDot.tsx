import {assignInlineVars} from '@vanilla-extract/dynamic';

import {colorDot, colorDotColor} from './ColorDot.css';

interface ColorDotProps {
  /** as stored, `#rrggbb` */
  color: string;
}

/** the color of a channel, preset or scene beside its name; decoration only, the name says what it is */
const ColorDot = ({color}: ColorDotProps) => (
  <span className={colorDot} style={assignInlineVars({[colorDotColor]: color})} aria-hidden />
);

export default ColorDot;
