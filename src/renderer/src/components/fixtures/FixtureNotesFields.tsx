import {FIXTURE_HINT_MAX_LENGTH} from '@shared/ipc';

import {FixtureDraft} from '@/data/fixtureDraft';

import DescriptionField from './DescriptionField';
import {field, hintInput} from './FixtureEditor.css';

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

    <DescriptionField description={draft.description} onChange={(description) => onChange({...draft, description})} />
  </>
);

export default FixtureNotesFields;
