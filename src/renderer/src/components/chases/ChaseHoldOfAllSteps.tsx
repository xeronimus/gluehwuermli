import {useId, useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {type AllStepsLine, holdOfAllStepsEffect} from '@/data/chaseAllSteps';
import {withHoldOfAllSteps} from '@/data/chaseDraft';
import {HOLD_INPUT_STEP_SECONDS, HOLD_MAX_SECONDS, HOLD_MIN_SECONDS, holdMsOf, isValidHoldText} from '@/data/chaseHold';
import {chaseErrorMessage} from '@/i18n/messages/chaseMessages';

import {actionField, actionLabel, allStepsAction, fieldErrors, holdOfAllInput} from './ChaseAllSteps.css';
import ChaseAllStepsButton from './ChaseAllStepsButton';
import {type AllStepsActionProps, applyOnEnter} from './allStepsAction';

/** Hold [ X ] s [Set]: every step holds X seconds; empty at first, the shown step's hold as its placeholder */
const ChaseHoldOfAllSteps = ({steps, shownStep, onPreview, onApply}: AllStepsActionProps) => {
  const {t, i18n} = useLingui();
  const fieldId = useId();
  const [holdText, setHoldText] = useState('');
  const canApply = isValidHoldText(holdText);
  const inError = holdText.trim() !== '' && !canApply;
  const effect = () => {
    const line: AllStepsLine = {action: 'hold', done: false, effect: holdOfAllStepsEffect(steps, holdMsOf(holdText))};
    return {line, valueIds: []};
  };
  const apply = () => {
    if (canApply) {
      const holdMs = holdMsOf(holdText);
      onApply((draft) => withHoldOfAllSteps(draft, holdMs), effect());
    }
  };

  return (
    <div className={allStepsAction}>
      <label className={actionLabel} htmlFor={fieldId}>
        <Trans>Hold</Trans>
      </label>
      <span className={actionField}>
        <input
          id={fieldId}
          className={holdOfAllInput[inError ? 'invalid' : 'valid']}
          type="number"
          min={HOLD_MIN_SECONDS}
          max={HOLD_MAX_SECONDS}
          step={HOLD_INPUT_STEP_SECONDS}
          value={holdText}
          placeholder={shownStep?.hold}
          aria-invalid={inError}
          onChange={(event) => setHoldText(event.target.value)}
          onKeyDown={applyOnEnter(apply)}
        />
        <Trans>s</Trans>
      </span>
      <ChaseAllStepsButton
        title={t`Set the hold of all steps`}
        disabled={!canApply}
        onApply={apply}
        onPreview={(active) => onPreview(active ? effect() : undefined)}
      >
        <Trans>Set</Trans>
      </ChaseAllStepsButton>
      {inError && (
        <ul className={fieldErrors}>
          <li>{i18n._(chaseErrorMessage({type: 'chase-step-hold-invalid'}))}</li>
        </ul>
      )}
    </div>
  );
};

export default ChaseHoldOfAllSteps;
