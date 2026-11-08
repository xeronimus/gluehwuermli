import {useLingui} from '@lingui/react/macro';
import {assignInlineVars} from '@vanilla-extract/dynamic';

import {normalizedColor} from '@shared/colors';

import {colorField, colorInput, colorPicker, colorPickerInput, colorSwatchColor} from './ColorField.css';

/** `#` and six hex digits */
const COLOR_MAX_LENGTH = 7;

/** where the picker starts when the field has no color yet: the picker needs one */
const PICKER_START_COLOR = '#ffffff';

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

/**
 * the color of a channel, preset or scene as typed, with a swatch beside it that opens the system color picker; the
 * swatch shows the color once it is a valid one and is empty otherwise
 */
const ColorField = ({color, label, title, onChange}: ColorFieldProps) => {
  const {t} = useLingui();
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
      <span
        className={colorPicker[swatchColor === undefined ? 'empty' : 'filled']}
        style={swatchColor === undefined ? undefined : assignInlineVars({[colorSwatchColor]: swatchColor})}
      >
        <input
          className={colorPickerInput}
          type="color"
          value={swatchColor ?? PICKER_START_COLOR}
          aria-label={t`Pick a color`}
          title={t`Pick a color`}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </span>
  );
};

export default ColorField;
