import {useLingui} from '@lingui/react/macro';
import {assignInlineVars} from '@vanilla-extract/dynamic';

import {normalizedChannelColor} from '@shared/fixtures';

import {colorField, colorInput, colorSwatch, colorSwatchColor} from './ChannelColorField.css';

/** `#` and six hex digits */
const COLOR_MAX_LENGTH = 7;

interface ChannelColorFieldProps {
  color: string;
  row: number;
  onChange: (color: string) => void;
}

/** the placeholder of an empty color field, as in the lock field: the column's title says that empty means none */
const NO_COLOR = '–';

/** the color as typed, with a swatch once it is a valid one */
const ChannelColorField = ({color, row, onChange}: ChannelColorFieldProps) => {
  const {t} = useLingui();
  const swatchColor = normalizedChannelColor(color);
  return (
    <span className={colorField}>
      <input
        className={colorInput}
        value={color}
        maxLength={COLOR_MAX_LENGTH}
        placeholder={NO_COLOR}
        aria-label={t`Color of channel ${row}`}
        onChange={(event) => onChange(event.target.value)}
      />
      {swatchColor !== undefined && (
        <span className={colorSwatch} style={assignInlineVars({[colorSwatchColor]: swatchColor})} />
      )}
    </span>
  );
};

export default ChannelColorField;
