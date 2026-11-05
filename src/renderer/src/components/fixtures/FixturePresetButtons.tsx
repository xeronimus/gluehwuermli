import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {fixturePresets} from '@shared/fixtures';
import {FIXTURE_PRESET_NAME_MAX_LENGTH, type Fixture} from '@shared/ipc';

import {isPresetLocked} from '@/data/channelLocks';
import {useActionApplyPreset} from '@/state/actionHooks/applyPreset';
import {useActionSavePreset} from '@/state/actionHooks/saveFixtures';
import {selectChannelLimits, selectLiftedChannelLimits} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {LockIcon, SavePresetIcon} from '../commons/icons';
import {presetButtons, presetNameInput} from './FixturePresetButtons.css';

interface FixturePresetButtonsProps {
  fixture: Fixture;
  /** only in Setup mode */
  canSavePreset: boolean;
}

/**
 * A button per preset of the fixture, setting its channels at once, and saving the current fader values as a new
 * preset. Electron has no window.prompt: the new preset is named in a field shown in place of the save button.
 * A preset that would set a channel above its cap is disabled while the channel lock is on.
 */
const FixturePresetButtons = ({fixture, canSavePreset}: FixturePresetButtonsProps) => {
  const {t} = useLingui();
  const fixtureName = fixture.name;
  const limits = useAppStore(selectChannelLimits);
  const lifted = useAppStore(selectLiftedChannelLimits);
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
      {fixturePresets(fixture).map((preset) => {
        const locked = isPresetLocked(fixture, preset, limits);
        const capLifted = isPresetLocked(fixture, preset, lifted);
        const presetName = preset.name;
        return (
          <Button
            key={preset.id}
            onClick={() => applyPreset(fixture, preset)}
            disabled={locked}
            variant={capLifted ? 'capLifted' : 'default'}
            title={
              locked
                ? t`${presetName} sets a locked channel`
                : capLifted
                  ? t`Apply the preset ${presetName}; it sets a channel above its cap, the channel lock is lifted`
                  : t`Apply the preset ${presetName}`
            }
          >
            {locked && <LockIcon />}
            {preset.name}
          </Button>
        );
      })}
      {canSavePreset &&
        (newPresetName === undefined ? (
          <Button
            variant="icon"
            onClick={() => setNewPresetName('')}
            title={t`Save the current values of ${fixtureName} as a preset`}
          >
            <SavePresetIcon />
          </Button>
        ) : (
          <>
            <input
              className={presetNameInput}
              value={newPresetName}
              maxLength={FIXTURE_PRESET_NAME_MAX_LENGTH}
              placeholder={t`Preset name`}
              aria-label={t`Name of the new preset`}
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
              <Trans>Save</Trans>
            </Button>
            <Button onClick={() => setNewPresetName(undefined)} disabled={saving}>
              <Trans>Cancel</Trans>
            </Button>
          </>
        ))}
    </div>
  );
};

export default FixturePresetButtons;
