import {useState} from 'react';

import {fixturePresets} from '@shared/fixtures';
import {FIXTURE_PRESET_NAME_MAX_LENGTH, type Fixture} from '@shared/ipc';

import {useActionApplyPreset} from '@/state/actionHooks/applyPreset';
import {useActionSavePreset} from '@/state/actionHooks/saveFixtures';

import Button from '../commons/Button';
import {SavePresetIcon} from '../commons/icons';
import {presetButtons, presetNameInput} from './FixturePresetButtons.css';

interface FixturePresetButtonsProps {
  fixture: Fixture;
}

/**
 * A button per preset of the fixture, setting its channels at once, and saving the current fader values as a new
 * preset. Electron has no window.prompt: the new preset is named in a field shown in place of the save button.
 */
const FixturePresetButtons = ({fixture}: FixturePresetButtonsProps) => {
  const applyPreset = useActionApplyPreset();
  const savePreset = useActionSavePreset();
  // undefined while not saving a preset
  const [newPresetName, setNewPresetName] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const canSave = newPresetName !== undefined && newPresetName.trim().length > 0 && !saving;

  const onSave = async () => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    const saved = await savePreset(fixture, newPresetName);
    setSaving(false);
    if (saved) {
      setNewPresetName(undefined);
    }
  };

  return (
    <div className={presetButtons}>
      {fixturePresets(fixture).map((preset) => (
        <Button key={preset.id} onClick={() => applyPreset(fixture, preset)} title={`Apply the preset ${preset.name}`}>
          {preset.name}
        </Button>
      ))}
      {newPresetName === undefined ? (
        <Button
          variant="icon"
          onClick={() => setNewPresetName('')}
          title={`Save the current values of ${fixture.name} as a preset`}
        >
          <SavePresetIcon />
        </Button>
      ) : (
        <>
          <input
            className={presetNameInput}
            value={newPresetName}
            maxLength={FIXTURE_PRESET_NAME_MAX_LENGTH}
            placeholder="Preset name"
            aria-label="Name of the new preset"
            autoFocus
            onChange={(event) => setNewPresetName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void onSave();
              } else if (event.key === 'Escape' && !saving) {
                setNewPresetName(undefined);
              }
            }}
          />
          <Button variant="primary" onClick={() => void onSave()} disabled={!canSave}>
            Save
          </Button>
          <Button onClick={() => setNewPresetName(undefined)} disabled={saving}>
            Cancel
          </Button>
        </>
      )}
    </div>
  );
};

export default FixturePresetButtons;
