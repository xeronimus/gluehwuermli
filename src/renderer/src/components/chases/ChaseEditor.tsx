import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {CHASE_NAME_MAX_LENGTH, type Chase} from '@shared/ipc';

import {
  type ChaseDraft,
  canSaveChase,
  chaseDraftOf,
  chaseEditErrors,
  chaseOfDraft,
  newChaseDraft,
  shownStepId
} from '@/data/chaseDraft';
import {chaseErrorMessage} from '@/i18n/messages/chaseMessages';
import {useActionSaveChase} from '@/state/actionHooks/saveFixtures';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import ChaseAllSteps from './ChaseAllSteps';
import {
  actions,
  chaseEditor,
  editorFields,
  editorTitle,
  editorTop,
  errorList,
  field,
  nameInput,
  steps
} from './ChaseEditor.css';
import ChaseOnRigToggle from './ChaseOnRigToggle';
import ChaseRepeatField from './ChaseRepeatField';
import ChaseStepTabs from './ChaseStepTabs';
import {useStepRowMarks} from './useStepRowMarks';

interface ChaseEditorProps {
  /** undefined to add a new chase */
  chase: Chase | undefined;
  onClose: () => void;
}

const editTitle = ({name: chaseName}: Chase) => <Trans>Edit the chase {chaseName}</Trans>;

/**
 * Names a chase, sets its repeat and its steps, one tab each: its hold and the channels it sets. Saving
 * stores the project first and closes only then; a failed save keeps the editor open with the error.
 */
const ChaseEditor = ({chase, onClose}: ChaseEditorProps) => {
  const {t, i18n} = useLingui();
  const saveChase = useActionSaveChase();
  const saveError = useAppStore((state) => state.fixturesError);
  const [draft, setDraft] = useState<ChaseDraft>(() => (chase ? chaseDraftOf(chase) : newChaseDraft()));
  const [saving, setSaving] = useState(false);
  const [chosenStepId, setChosenStepId] = useState<string | undefined>(undefined);
  const rowMarks = useStepRowMarks();
  const shownId = shownStepId(draft.steps, chosenStepId);

  const errors = chaseEditErrors(draft);
  const canSave = canSaveChase(errors) && !saving;

  const onStepSelect = (stepId: string | undefined) => {
    setChosenStepId(stepId);
    rowMarks.stepShown();
  };

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
      <div className={editorTop}>
        <div className={editorFields}>
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
          <ChaseOnRigToggle />
        </div>
        <ChaseAllSteps
          steps={draft.steps}
          shownStep={draft.steps.find(({id}) => id === shownId)}
          rowMarks={rowMarks}
          onChange={setDraft}
        />
      </div>
      <div className={steps}>
        <ChaseStepTabs
          steps={draft.steps}
          stepErrors={errors.steps}
          shownId={shownId}
          onSelect={onStepSelect}
          rowMarks={rowMarks}
          onChange={setDraft}
        />
      </div>
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
