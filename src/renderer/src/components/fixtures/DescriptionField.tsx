import {useState} from 'react';

import {FIXTURE_DESCRIPTION_MAX_LENGTH} from '@shared/ipc';

import MarkdownText from '../commons/MarkdownText';
import ModeToggle, {Mode} from '../commons/ModeToggle';
import {EditIcon, PreviewIcon} from '../commons/icons';
import {descriptionHeader, descriptionInput, descriptionPreview, field, previewPlaceholder} from './FixtureEditor.css';

const DESCRIPTION_ROWS = 6;
const TEXTAREA_ID = 'fixture-description';

type DescriptionMode = 'edit' | 'preview';

const DESCRIPTION_MODES: readonly Mode<DescriptionMode>[] = [
  {id: 'edit', label: 'Edit', Icon: EditIcon},
  {id: 'preview', label: 'Preview', Icon: PreviewIcon}
];

interface DescriptionFieldProps {
  description: string;
  onChange: (description: string) => void;
}

/**
 * The fixture's description, Markdown, with a preview of the unsaved text. The textarea stays mounted while the
 * preview is shown, so the cursor and the scroll position survive the toggle.
 */
const DescriptionField = ({description, onChange}: DescriptionFieldProps) => {
  const [mode, setMode] = useState<DescriptionMode>('edit');

  return (
    <div className={field}>
      {/* the toggle is outside the label, so a click on it doesn't focus the hidden textarea */}
      <div className={descriptionHeader}>
        <label htmlFor={TEXTAREA_ID}>Description</label>
        <ModeToggle modes={DESCRIPTION_MODES} activeId={mode} onSelect={setMode} />
      </div>
      <textarea
        id={TEXTAREA_ID}
        className={descriptionInput}
        hidden={mode === 'preview'}
        value={description}
        rows={DESCRIPTION_ROWS}
        maxLength={FIXTURE_DESCRIPTION_MAX_LENGTH}
        placeholder="Anything worth knowing, in Markdown: the DMX mode, DIP switch settings, where it hangs, a link to the manual…"
        onChange={(event) => onChange(event.target.value)}
      />
      {mode === 'preview' && (
        <div className={descriptionPreview}>
          {description.trim() === '' ? (
            <span className={previewPlaceholder}>Nothing to preview</span>
          ) : (
            <MarkdownText text={description} />
          )}
        </div>
      )}
    </div>
  );
};

export default DescriptionField;
