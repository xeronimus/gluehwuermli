import {useLingui} from '@lingui/react/macro';

import type {FixtureError, FixtureOverlap} from '@shared/fixtures';

import {fixtureErrorMessage, overlapMessage, rulesSharedMessage} from '@/i18n/messages/fixtureMessages';

import {WarningIcon} from '../commons/icons';
import {errorList, warningList} from './FixtureEditor.css';

interface FixtureEditorProblemsProps {
  errors: readonly FixtureError[];
  /** the fixture's shared addresses with other fixtures: a warning, saving is still allowed */
  overlaps: readonly FixtureOverlap[];
  /** the other fixtures whose value rules saving replaces on shared addresses: a warning, too */
  rulesShared: readonly FixtureOverlap[];
}

/** what keeps the fixture from being saved, and what is worth a warning; outside the tabs, so every tab shows it */
const FixtureEditorProblems = ({errors, overlaps, rulesShared}: FixtureEditorProblemsProps) => {
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
      {overlaps.length + rulesShared.length > 0 && (
        <ul className={warningList}>
          {overlaps.map((overlap) => (
            <li key={`overlap-${overlap.second.id}`}>
              <WarningIcon /> {i18n._(overlapMessage(overlap))}
            </li>
          ))}
          {rulesShared.map((overlap) => (
            <li key={`rules-${overlap.second.id}`}>
              <WarningIcon /> {i18n._(rulesSharedMessage(overlap))}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default FixtureEditorProblems;
