import {Trans, useLingui} from '@lingui/react/macro';

import {CHASE_REPEAT_MAX, CHASE_REPEAT_MIN} from '@shared/ipc';

import type {ChaseDraft} from '@/data/chaseDraft';

import {countInput, repeatChoice, repeatChoices, repeatTitle} from './ChaseEditor.css';

/** one editor is open at a time, so one name groups its radios for the arrow keys */
const REPEAT_GROUP = 'chase-repeat';

interface ChaseRepeatFieldProps {
  draft: ChaseDraft;
  onChange: (draft: ChaseDraft) => void;
}

/** what happens after the last step: Once · N times (N passes in total) · Until stopped */
const ChaseRepeatField = ({draft, onChange}: ChaseRepeatFieldProps) => {
  const {t} = useLingui();
  const choose = (repeatType: ChaseDraft['repeatType']) => onChange({...draft, repeatType});
  return (
    <fieldset className={repeatChoices}>
      <legend className={repeatTitle}>
        <Trans>Repeat</Trans>
      </legend>
      <label className={repeatChoice}>
        <input type="radio" name={REPEAT_GROUP} checked={draft.repeatType === 'once'} onChange={() => choose('once')} />
        <Trans>Once</Trans>
      </label>
      <label className={repeatChoice}>
        <input
          type="radio"
          name={REPEAT_GROUP}
          checked={draft.repeatType === 'times'}
          onChange={() => choose('times')}
        />
        <input
          className={countInput}
          type="number"
          min={CHASE_REPEAT_MIN}
          max={CHASE_REPEAT_MAX}
          value={draft.repeatCount}
          aria-label={t`Number of passes`}
          onChange={(event) => onChange({...draft, repeatType: 'times', repeatCount: event.target.value})}
        />
        <Trans>times</Trans>
      </label>
      <label className={repeatChoice}>
        <input
          type="radio"
          name={REPEAT_GROUP}
          checked={draft.repeatType === 'forever'}
          onChange={() => choose('forever')}
        />
        <Trans>Until stopped</Trans>
      </label>
    </fieldset>
  );
};

export default ChaseRepeatField;
