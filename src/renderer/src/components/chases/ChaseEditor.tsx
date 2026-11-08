import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {CHASE_NAME_MAX_LENGTH, CHASE_STEPS_MAX, type Chase} from '@shared/ipc';

import {
  type ChaseDraft,
  canSaveChase,
  chaseDraftOf,
  chaseEditErrors,
  chaseOfDraft,
  newChaseDraft,
  withNewStep
} from '@/data/chaseDraft';
import {chaseErrorMessage} from '@/i18n/messages/chaseMessages';
import {useActionSaveChase} from '@/state/actionHooks/saveFixtures';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {AddIcon} from '../commons/icons';
import {actions, chaseEditor, editorTitle, errorList, field, nameInput, steps} from './ChaseEditor.css';
import ChaseRepeatField from './ChaseRepeatField';
import ChaseStepEditor from './ChaseStepEditor';

interface ChaseEditorProps {
  /** undefined to add a new chase */
  chase: Chase | undefined;
  onClose: () => void;
}

const editTitle = ({name: chaseName}: Chase) => <Trans>Edit the chase {chaseName}</Trans>;

/**
 * Names a chase, sets its repeat and its steps: each with its hold and the channels it sets, typed by hand. Saving
 * stores the project first and closes only then; a failed save keeps the editor open with the error.
 */
const ChaseEditor = ({chase, onClose}: ChaseEditorProps) => {
  const {t, i18n} = useLingui();
  const saveChase = useActionSaveChase();
  const saveError = useAppStore((state) => state.fixturesError);
  const [draft, setDraft] = useState<ChaseDraft>(() => (chase ? chaseDraftOf(chase) : newChaseDraft()));
  const [saving, setSaving] = useState(false);

  const errors = chaseEditErrors(draft);
  const canSave = canSaveChase(errors) && !saving;

  const onSave = async () => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    const saved = await saveChase(chaseOfDraft(chase?.id ?? crypto.randomUUID(), draft));
    setSaving(false);
    if (saved) {
      onClose();
    }
  };

  return (
    <section className={chaseEditor} aria-label={t`Chase editor`}>
      <h2 className={editorTitle}>{chase ? editTitle(chase) : <Trans>New chase</Trans>}</h2>
      <label className={field}>
        <Trans>Name</Trans>
        <input
          className={nameInput}
          value={draft.name}
          maxLength={CHASE_NAME_MAX_LENGTH}
          autoFocus
          onChange={(event) => setDraft({...draft, name: event.target.value})}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void onSave();
            } else if (event.key === 'Escape' && !saving) {
              onClose();
            }
          }}
        />
      </label>
      <ChaseRepeatField draft={draft} onChange={setDraft} />
      <ol className={steps} aria-label={t`Steps`}>
        {draft.steps.map((step, index) => (
          <ChaseStepEditor
            key={step.id}
            step={step}
            index={index}
            count={draft.steps.length}
            errors={errors.steps[index] ?? []}
            onChange={setDraft}
          />
        ))}
      </ol>
      <span>
        <Button
          onClick={() => setDraft((current) => withNewStep(current, crypto.randomUUID()))}
          disabled={draft.steps.length >= CHASE_STEPS_MAX}
        >
          <AddIcon />
          <Trans>Add step</Trans>
        </Button>
      </span>
      {errors.chase.length > 0 && (
        <ul className={errorList}>
          {errors.chase.map((error) => (
            <li key={error.type}>{i18n._(chaseErrorMessage(error))}</li>
          ))}
        </ul>
      )}
      {saveError && <span className={errorList}>{i18n._(saveError)}</span>}
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

export default ChaseEditor;
