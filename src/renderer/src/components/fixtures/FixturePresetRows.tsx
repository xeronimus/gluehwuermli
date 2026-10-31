import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';
import {FIXTURE_PRESET_NAME_MAX_LENGTH} from '@shared/ipc';

import {FixtureDraft, withNewPreset, withPresetName, withPresetValueChange, withoutPreset} from '@/data/fixtureDraft';

import Button from '../commons/Button';
import {AddIcon, RemoveIcon} from '../commons/icons';
import {
  presetHeader,
  presetNameInput,
  presetRow,
  presetRows,
  presetValue,
  presetValues,
  sectionTitle,
  valueInput
} from './FixturePresetRows.css';

interface FixturePresetRowsProps {
  draft: FixtureDraft;
  onChange: (draft: FixtureDraft) => void;
}

/** the presets of the fixture being edited: a name, and for each channel whether the preset sets it and to what */
const FixturePresetRows = ({draft, onChange}: FixturePresetRowsProps) => (
  <div className={presetRows}>
    <span className={sectionTitle}>Presets</span>
    {draft.presets.map((preset, presetIndex) => (
      <div key={preset.id} className={presetRow}>
        <div className={presetHeader}>
          <input
            className={presetNameInput}
            value={preset.name}
            maxLength={FIXTURE_PRESET_NAME_MAX_LENGTH}
            placeholder="e.g. Warm white"
            aria-label={`Name of preset ${presetIndex + 1}`}
            onChange={(event) => onChange(withPresetName(draft, presetIndex, event.target.value))}
          />
          <Button onClick={() => onChange(withoutPreset(draft, presetIndex))} title="Remove the preset">
            <RemoveIcon />
          </Button>
        </div>
        <div className={presetValues}>
          {draft.channels.map((channel, channelIndex) => {
            const value = preset.values[channelIndex];
            const label = channel.name || `Channel ${channelIndex + 1}`;
            return (
              // the index is the identity of a channel row, as in FixtureChannelRows
              <label key={channelIndex} className={presetValue}>
                <input
                  type="checkbox"
                  checked={value?.included ?? false}
                  onChange={(event) =>
                    onChange(withPresetValueChange(draft, presetIndex, channelIndex, {included: event.target.checked}))
                  }
                />
                {label}
                <input
                  className={valueInput}
                  type="number"
                  min={DMX_MIN_VALUE}
                  max={DMX_MAX_VALUE}
                  value={value?.value ?? ''}
                  disabled={!value?.included}
                  aria-label={`Value of ${label} in preset ${presetIndex + 1}`}
                  onChange={(event) =>
                    onChange(withPresetValueChange(draft, presetIndex, channelIndex, {value: event.target.value}))
                  }
                />
              </label>
            );
          })}
        </div>
      </div>
    ))}
    <Button onClick={() => onChange(withNewPreset(draft, crypto.randomUUID()))}>
      <AddIcon /> Add preset
    </Button>
  </div>
);

export default FixturePresetRows;
