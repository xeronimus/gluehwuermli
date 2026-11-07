import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';

import {positionChoices} from '@/data/channelValuesDraft';
import {type FixtureChannelDraft, type PresetValueDraft, shownPresetValue} from '@/data/fixtureDraft';

import {valueInputVariants, valueSelectVariants} from './FixturePresetColumns.css';

/** shown in the picker while the preset's value is none of the channel's positions */
const NO_POSITION = '–';

interface PresetValueFieldProps {
  channel: FixtureChannelDraft;
  presetValue: PresetValueDraft;
  /** the field's accessible name */
  label: string;
  onEnter: (value: string) => void;
}

/**
 * a preset's value for one channel: picked from the positions of a positions channel, typed for the others; dimmed
 * while the preset leaves the channel out. Shows the value as it will be saved (fitted to the channel's rules)
 */
const PresetValueField = ({channel, presetValue, label, onEnter}: PresetValueFieldProps) => {
  const look = presetValue.included ? 'included' : 'leftOut';
  const value = shownPresetValue(channel, presetValue);
  if (channel.values.mode !== 'positions') {
    return (
      <input
        className={valueInputVariants[look]}
        type="number"
        min={DMX_MIN_VALUE}
        max={DMX_MAX_VALUE}
        value={value}
        aria-label={label}
        onChange={(event) => onEnter(event.target.value)}
      />
    );
  }
  const choices = positionChoices(channel.values);
  const isChoice = choices.some((choice) => choice.value === value);
  return (
    <select
      className={valueSelectVariants[look]}
      value={isChoice ? value : NO_POSITION}
      aria-label={label}
      onChange={(event) => onEnter(event.target.value)}
    >
      {!isChoice && (
        <option value={NO_POSITION} disabled>
          {NO_POSITION}
        </option>
      )}
      {choices.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label}
        </option>
      ))}
    </select>
  );
};

export default PresetValueField;
