import {Trans, useLingui} from '@lingui/react/macro';

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
const FixturePresetColumns = ({draft, onChange}: FixturePresetColumnsProps) => {
  const {t} = useLingui();
  const presetCount = draft.presets.length;
  return (
    <div className={presetsSection}>
      <h3 className={sectionTitle}>
        <Trans>Presets ({presetCount})</Trans>
      </h3>
      <div className={presetColumns}>
        {draft.presets.map((preset, presetIndex) => {
          const presetNumber = presetIndex + 1;
          return (
            <div key={preset.id} className={presetColumn}>
              <div className={presetHeader}>
                <input
                  className={presetNameInput}
                  value={preset.name}
                  maxLength={FIXTURE_PRESET_NAME_MAX_LENGTH}
                  placeholder={t`e.g. Warm white`}
                  aria-label={t`Name of preset ${presetNumber}`}
                  onChange={(event) => onChange(withPresetName(draft, presetIndex, event.target.value))}
                />
                <Button onClick={() => onChange(withoutPreset(draft, presetIndex))} title={t`Remove the preset`}>
                  <RemoveIcon />
                </Button>
              </div>
              {draft.channels.map((channel, channelIndex) => {
                const value = preset.values[channelIndex];
                const channelNumber = channelIndex + 1;
                const label = channel.name || t`Channel ${channelNumber}`;
                return (
                  // the index is the identity of a channel row, as in FixtureChannelRows
                  <label key={channelIndex} className={presetValue}>
                    <input
                      type="checkbox"
                      checked={value?.included ?? false}
                      onChange={(event) =>
                        onChange(
                          withPresetValueChange(draft, presetIndex, channelIndex, {included: event.target.checked})
                        )
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
                      aria-label={t`Value of ${label} in preset ${presetNumber}`}
                      onChange={(event) =>
                        onChange(withPresetValueChange(draft, presetIndex, channelIndex, {value: event.target.value}))
                      }
                    />
                  </label>
                );
              })}
            </div>
          );
        })}
        <span className={addPreset}>
          <Button onClick={() => onChange(withNewPreset(draft, crypto.randomUUID()))}>
            <AddIcon /> <Trans>Add preset</Trans>
          </Button>
        </span>
      </div>
    </div>
  );
};

export default FixturePresetColumns;
