import {FIXTURE_DESCRIPTION_MAX_LENGTH, FIXTURE_HINT_MAX_LENGTH} from '@shared/ipc';

import {FixtureDraft} from '@/data/fixtureDraft';

import {descriptionInput, field, hintInput} from './FixtureEditor.css';

const DESCRIPTION_ROWS = 3;

interface FixtureNotesFieldsProps {
  draft: FixtureDraft;
  onChange: (draft: FixtureDraft) => void;
}

/** the free texts of the fixture being edited: the hint below its faders and its description */
const FixtureNotesFields = ({draft, onChange}: FixtureNotesFieldsProps) => (
  <>
    <label className={field}>
      Hint
      <input
        className={hintInput}
        value={draft.hint}
        maxLength={FIXTURE_HINT_MAX_LENGTH}
        placeholder="Shown below the faders, e.g. warm up 2 min before smoke"
        onChange={(event) => onChange({...draft, hint: event.target.value})}
      />
    </label>

    <label className={field}>
      Description
      <textarea
        className={descriptionInput}
        value={draft.description}
        rows={DESCRIPTION_ROWS}
        maxLength={FIXTURE_DESCRIPTION_MAX_LENGTH}
        placeholder="Anything worth knowing: the DMX mode, DIP switch settings, where it hangs, who it belongs to…"
        onChange={(event) => onChange({...draft, description: event.target.value})}
      />
    </label>
  </>
);

export default FixtureNotesFields;
