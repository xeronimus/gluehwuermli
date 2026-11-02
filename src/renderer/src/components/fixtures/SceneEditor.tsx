import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {SCENE_NAME_MAX_LENGTH, type Scene} from '@shared/ipc';

import {sceneEditErrors} from '@/data/scenes';
import {sceneErrorMessage} from '@/i18n/messages/sceneMessages';
import {useActionAddScene, useActionEditScene} from '@/state/actionHooks/saveFixtures';
import {selectFixtures} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {
  actions,
  checkboxLabel,
  editorTitle,
  errorList,
  field,
  fixtureChoices,
  fixtureChoicesTitle,
  nameInput,
  sceneEditor
} from './SceneEditor.css';

interface SceneEditorProps {
  /** undefined to add a new scene */
  scene: Scene | undefined;
  onClose: () => void;
}

const editTitle = ({name: sceneName}: Scene) => <Trans>Edit the scene {sceneName}</Trans>;

/**
 * Names a scene and chooses its fixtures; their values are taken from the faders when it is saved, so the look is set
 * with the faders below first. Editing keeps the stored values unless "Save current values" is checked; a newly
 * chosen fixture is always taken from its faders.
 */
const SceneEditor = ({scene, onClose}: SceneEditorProps) => {
  const {t, i18n} = useLingui();
  const fixtures = useAppStore(selectFixtures);
  const addScene = useActionAddScene();
  const editScene = useActionEditScene();
  const [name, setName] = useState(scene?.name ?? '');
  const [fixtureIds, setFixtureIds] = useState<readonly string[]>(
    () => scene?.fixtures.map(({fixtureId}) => fixtureId) ?? fixtures.map(({id}) => id)
  );
  const [recapture, setRecapture] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = sceneEditErrors(fixtures, {name, fixtureIds});
  const canSave = errors.length === 0 && !saving;

  const onToggleFixture = (fixtureId: string, chosen: boolean) =>
    setFixtureIds(chosen ? [...fixtureIds, fixtureId] : fixtureIds.filter((id) => id !== fixtureId));

  const onSave = async () => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    const saved = scene ? await editScene(scene, {name, fixtureIds, recapture}) : await addScene({name, fixtureIds});
    setSaving(false);
    if (saved) {
      onClose();
    }
  };

  return (
    <section className={sceneEditor} aria-label={t`Scene editor`}>
      <h2 className={editorTitle}>{scene ? editTitle(scene) : <Trans>New scene</Trans>}</h2>
      <label className={field}>
        <Trans>Name</Trans>
        <input
          className={nameInput}
          value={name}
          maxLength={SCENE_NAME_MAX_LENGTH}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void onSave();
            } else if (event.key === 'Escape' && !saving) {
              onClose();
            }
          }}
        />
      </label>
      <fieldset className={fixtureChoices}>
        <legend className={fixtureChoicesTitle}>
          <Trans>Fixtures in the scene</Trans>
        </legend>
        {fixtures.map((fixture) => (
          <label key={fixture.id} className={checkboxLabel}>
            <input
              type="checkbox"
              checked={fixtureIds.includes(fixture.id)}
              onChange={(event) => onToggleFixture(fixture.id, event.target.checked)}
            />
            {fixture.name}
          </label>
        ))}
      </fieldset>
      {scene && (
        <label className={checkboxLabel}>
          <input type="checkbox" checked={recapture} onChange={(event) => setRecapture(event.target.checked)} />
          <Trans>Save current values</Trans>
        </label>
      )}
      {errors.length > 0 && (
        <ul className={errorList}>
          {errors.map((error) => (
            <li key={error.type}>{i18n._(sceneErrorMessage(error))}</li>
          ))}
        </ul>
      )}
      <div className={actions}>
        <Button variant="primary" onClick={() => void onSave()} disabled={!canSave}>
          <Trans>Save</Trans>
        </Button>
        <Button onClick={onClose} disabled={saving}>
          <Trans>Cancel</Trans>
        </Button>
      </div>
    </section>
  );
};

export default SceneEditor;
