import {useId, useRef, useState} from 'react';
import {flushSync} from 'react-dom';

import type {I18n} from '@lingui/core';
import {msg} from '@lingui/core/macro';
import {Trans, useLingui} from '@lingui/react/macro';

import {FIXTURE_DESCRIPTION_MAX_LENGTH} from '@shared/ipc';

import MarkdownText from '../commons/MarkdownText';
import ModeToggle, {Mode} from '../commons/ModeToggle';
import {EditIcon, PreviewIcon} from '../commons/icons';
import {descriptionHeader, descriptionInput, descriptionPreview, field, previewPlaceholder} from './FixtureEditor.css';

const DESCRIPTION_ROWS = 6;

type DescriptionMode = 'edit' | 'preview';

const descriptionModes = (i18n: I18n): readonly Mode<DescriptionMode>[] => [
  {id: 'edit', label: i18n._(msg`Edit`), Icon: EditIcon},
  {id: 'preview', label: i18n._(msg`Preview`), Icon: PreviewIcon}
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
  const {t, i18n} = useLingui();
  const [mode, setMode] = useState<DescriptionMode>('edit');
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // back in Edit, the textarea gets the focus again, so typing goes on where the cursor was; it has to be shown first
  const selectMode = (nextMode: DescriptionMode) => {
    flushSync(() => setMode(nextMode));
    if (nextMode === 'edit') {
      textareaRef.current?.focus();
    }
  };

  return (
    <div className={field}>
      {/* the toggle is outside the label, so a click on it doesn't focus the hidden textarea */}
      <div className={descriptionHeader}>
        <label htmlFor={textareaId}>
          <Trans>Description</Trans>
        </label>
        <ModeToggle modes={descriptionModes(i18n)} activeId={mode} onSelect={selectMode} />
      </div>
      <textarea
        ref={textareaRef}
        id={textareaId}
        className={descriptionInput}
        hidden={mode === 'preview'}
        value={description}
        rows={DESCRIPTION_ROWS}
        maxLength={FIXTURE_DESCRIPTION_MAX_LENGTH}
        placeholder={t`Anything worth knowing, in Markdown: the DMX mode, DIP switch settings, where it hangs, a link to the manual…`}
        onChange={(event) => onChange(event.target.value)}
      />
      {mode === 'preview' && (
        <div className={descriptionPreview}>
          {description.trim() === '' ? (
            <span className={previewPlaceholder}>
              <Trans>Nothing to preview</Trans>
            </span>
          ) : (
            <MarkdownText text={description} />
          )}
        </div>
      )}
    </div>
  );
};

export default DescriptionField;
