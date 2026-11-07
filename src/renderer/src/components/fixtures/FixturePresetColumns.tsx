import {Trans, useLingui} from '@lingui/react/macro';
import {assignInlineVars} from '@vanilla-extract/dynamic';

import {normalizedChannelColor} from '@shared/fixtures';
import {FIXTURE_PRESET_NAME_MAX_LENGTH} from '@shared/ipc';

import {
  FixtureDraft,
  withNewPreset,
  withPresetMoved,
  withPresetName,
  withPresetValueChange,
  withPresetValueEntered,
  withoutPreset
} from '@/data/fixtureDraft';

import Button from '../commons/Button';
import MoveButtons from '../commons/MoveButtons';
import {AddIcon, RemoveIcon} from '../commons/icons';
import {
  addPreset,
  channelColorBubble,
  channelColorBubbleColor,
  presetChannelLabel,
  presetChannelName,
  presetColumn,
  presetColumns,
  presetHeader,
  presetNameInput,
  presetValue,
  presetsSection
} from './FixturePresetColumns.css';
import PresetValueField from './PresetValueField';

interface FixturePresetColumnsProps {
  draft: FixtureDraft;
  onChange: (draft: FixtureDraft) => void;
}

/**
 * the presets of the fixture being edited, a column each: a name, and for each channel whether the preset sets it and
 * to what; entering a value ticks the channel. The channels are named, with a bubble in their color if they have one: the rows no longer stand beside the
 * channel rows of FixtureChannelRows
 */
const FixturePresetColumns = ({draft, onChange}: FixturePresetColumnsProps) => {
  const {t} = useLingui();
  const presetCount = draft.presets.length;
  return (
    <div className={presetsSection}>
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
                <MoveButtons
                  index={presetIndex}
                  count={presetCount}
                  onMove={(direction) => onChange(withPresetMoved(draft, presetIndex, direction))}
                  titles={{
                    earlier: t`Move preset ${presetNumber} to the left`,
                    later: t`Move preset ${presetNumber} to the right`
                  }}
                />
                <Button onClick={() => onChange(withoutPreset(draft, presetIndex))} title={t`Remove the preset`}>
                  <RemoveIcon />
                </Button>
              </div>
              {draft.channels.map((channel, channelIndex) => {
                const value = preset.values[channelIndex];
                const channelNumber = channelIndex + 1;
                const label = channel.name || t`Channel ${channelNumber}`;
                const color = normalizedChannelColor(channel.color);
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
                    <span className={presetChannelLabel}>
                      {color !== undefined && (
                        <span
                          className={channelColorBubble}
                          style={assignInlineVars({[channelColorBubbleColor]: color})}
                        />
                      )}
                      <span className={presetChannelName} title={label}>
                        {label}
                      </span>
                    </span>
                    {value && (
                      <PresetValueField
                        channel={channel}
                        presetValue={value}
                        label={t`Value of ${label} in preset ${presetNumber}`}
                        onEnter={(entered) =>
                          onChange(withPresetValueEntered(draft, presetIndex, channelIndex, entered))
                        }
                      />
                    )}
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
