import {assignInlineVars} from '@vanilla-extract/dynamic';

import {normalizedColor} from '@shared/colors';

import {colorField, colorInput, colorSwatch, colorSwatchColor} from './ColorField.css';

/** `#` and six hex digits */
const COLOR_MAX_LENGTH = 7;

interface ColorFieldProps {
  color: string;
  /** what the color is of, e.g. "Color of channel 2" */
  label: string;
  /** says that empty means none, where no column title does */
  title?: string;
  onChange: (color: string) => void;
}

/** the placeholder of an empty color field, as in the lock field: a title says that empty means none */
const NO_COLOR = '–';

/** the color of a channel, preset or scene as typed, with a swatch once it is a valid one */
const ColorField = ({color, label, title, onChange}: ColorFieldProps) => {
  const swatchColor = normalizedColor(color);
  return (
    <span className={colorField}>
      <input
        className={colorInput}
        value={color}
        maxLength={COLOR_MAX_LENGTH}
        placeholder={NO_COLOR}
        aria-label={label}
        title={title}
        onChange={(event) => onChange(event.target.value)}
      />
      {swatchColor !== undefined && (
        <span className={colorSwatch} style={assignInlineVars({[colorSwatchColor]: swatchColor})} />
      )}
    </span>
  );
};

export default ColorField;
