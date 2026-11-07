import {useLingui} from '@lingui/react/macro';

import type {FixtureError, FixtureOverlap} from '@shared/fixtures';

import {fixtureErrorMessage, overlapMessage} from '@/i18n/messages/fixtureMessages';

import {WarningIcon} from '../commons/icons';
import {errorList, warningList} from './FixtureEditor.css';

interface FixtureEditorProblemsProps {
  errors: readonly FixtureError[];
  /** the fixture's shared addresses with other fixtures: a warning, saving is still allowed */
  overlaps: readonly FixtureOverlap[];
}

/** what keeps the fixture from being saved, and what is worth a warning; outside the tabs, so every tab shows it */
const FixtureEditorProblems = ({errors, overlaps}: FixtureEditorProblemsProps) => {
  const {i18n} = useLingui();
  return (
    <>
      {errors.length > 0 && (
        <ul className={errorList}>
          {errors.map((error) => {
            const text = i18n._(fixtureErrorMessage(error, (message) => i18n._(message)));
            return <li key={text}>{text}</li>;
          })}
        </ul>
      )}
      {overlaps.length > 0 && (
        <ul className={warningList}>
          {overlaps.map((overlap) => (
            <li key={overlap.second.id}>
              <WarningIcon /> {i18n._(overlapMessage(overlap))}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default FixtureEditorProblems;
