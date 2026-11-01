import {DMX_MAX_VALUE, DMX_MIN_VALUE} from '@shared/dmx';
import {FIXTURE_PRESET_NAME_MAX_LENGTH} from '@shared/ipc';

import {FixtureDraft, withNewPreset, withPresetName, withPresetValueChange, withoutPreset} from '@/data/fixtureDraft';

import Button from '../commons/Button';
import {AddIcon, RemoveIcon} from '../commons/icons';
import {sectionTitle} from './FixtureEditor.css';
import {
  addPreset,
  presetChannelName,
  presetColumn,
  presetColumns,
  presetHeader,
  presetNameInput,
  presetValue,
  presetsSection,
  valueInput
} from './FixturePresetColumns.css';

interface FixturePresetColumnsProps {
  draft: FixtureDraft;
  onChange: (draft: FixtureDraft) => void;
}

/**
 * the presets of the fixture being edited, a column each: a name, and for each channel (in line with its row in
 * FixtureChannelRows) whether the preset sets it and to what
 */
const FixturePresetColumns = ({draft, onChange}: FixturePresetColumnsProps) => (
  <div className={presetsSection}>
    <h3 className={sectionTitle}>Presets ({draft.presets.length})</h3>
    <div className={presetColumns}>
      {draft.presets.map((preset, presetIndex) => (
        <div key={preset.id} className={presetColumn}>
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
                <span className={presetChannelName} title={label}>
                  {label}
                </span>
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
      ))}
      <span className={addPreset}>
        <Button onClick={() => onChange(withNewPreset(draft, crypto.randomUUID()))}>
          <AddIcon /> Add preset
        </Button>
      </span>
    </div>
  </div>
);

export default FixturePresetColumns;
