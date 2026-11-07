import {Plural, Trans, useLingui} from '@lingui/react/macro';

import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';
import type {ChannelValueMode} from '@shared/ipc';

import {CHANNEL_VALUE_MODES, type ChannelValuesDraft, withValueMode} from '@/data/channelValuesDraft';

import {modeSelect, rangeSeparator, valueInput, valuesField} from './ChannelValuesField.css';

interface ChannelValuesFieldProps {
  values: ChannelValuesDraft;
  row: number;
  onChange: (values: ChannelValuesDraft) => void;
}

const isValueMode = (mode: string): mode is ChannelValueMode => CHANNEL_VALUE_MODES.some((known) => known === mode);

/**
 * where the channel's fader stops, in one row: the mode, then min and max (continuous), with the step size (steps);
 * the positions of a positions channel are listed below the row (ChannelPositionsList)
 */
const ChannelValuesField = ({values, row, onChange}: ChannelValuesFieldProps) => {
  const {t} = useLingui();
  const modeLabels: Record<ChannelValueMode, string> = {
    continuous: t`Continuous`,
    steps: t`Steps`,
    positions: t`Positions`
  };
  const positionCount = values.positions.length;
  return (
    <span className={valuesField}>
      <select
        className={modeSelect}
        value={values.mode}
        aria-label={t`Values of channel ${row}`}
        onChange={(event) => isValueMode(event.target.value) && onChange(withValueMode(values, event.target.value))}
      >
        {CHANNEL_VALUE_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {modeLabels[mode]}
          </option>
        ))}
      </select>
      {values.mode === 'positions' ? (
        <span className={rangeSeparator}>
          <Plural value={positionCount} one="# position, listed below" other="# positions, listed below" />
        </span>
      ) : (
        <>
          <input
            className={valueInput}
            type="number"
            min={DMX_MIN_VALUE}
            max={DMX_MAX_VALUE}
            value={values.min}
            placeholder={String(DMX_MIN_VALUE)}
            aria-label={t`Lowest value of channel ${row}`}
            onChange={(event) => onChange({...values, min: event.target.value})}
          />
          <span className={rangeSeparator}>–</span>
          <input
            className={valueInput}
            type="number"
            min={DMX_MIN_VALUE}
            max={DMX_MAX_VALUE}
            value={values.max}
            placeholder={String(DMX_MAX_VALUE)}
            aria-label={t`Highest value of channel ${row}`}
            onChange={(event) => onChange({...values, max: event.target.value})}
          />
        </>
      )}
      {values.mode === 'steps' && (
        <>
          <span className={rangeSeparator}>
            <Trans>by</Trans>
          </span>
          <input
            className={valueInput}
            type="number"
            min={1}
            max={DMX_MAX_VALUE}
            value={values.step}
            aria-label={t`Step size of channel ${row}`}
            onChange={(event) => onChange({...values, step: event.target.value})}
          />
        </>
      )}
    </span>
  );
};

export default ChannelValuesField;
