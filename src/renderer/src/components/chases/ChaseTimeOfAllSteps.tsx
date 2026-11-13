import {type ReactNode, useId, useState} from 'react';

import type {MessageDescriptor} from '@lingui/core';
import {Trans, useLingui} from '@lingui/react/macro';

import type {AllStepsLine} from '@/data/chaseAllSteps';
import type {ChaseDraft, ChaseStepDraft} from '@/data/chaseDraft';
import {HOLD_INPUT_STEP_SECONDS, msOfSecondsText} from '@/data/chaseHold';

import {actionField, actionLabel, allStepsAction, fieldErrors, timeOfAllInput} from './ChaseAllSteps.css';
import ChaseAllStepsButton from './ChaseAllStepsButton';
import {type AllStepsActionProps, applyOnEnter} from './allStepsAction';

/** what tells the fade in and the hold of all steps apart */
export interface StepTime {
  label: ReactNode;
  /** the Set button's title */
  title: string;
  minSeconds: number;
  maxSeconds: number;
  isValidText: (text: string) => boolean;
  /** said below the field while what is typed isn't valid */
  error: MessageDescriptor;
  /** the shown step's time, as the field's placeholder */
  shownText: (step: ChaseStepDraft) => string;
  lineOf: (steps: readonly ChaseStepDraft[], ms: number) => AllStepsLine;
  change: (draft: ChaseDraft, ms: number) => ChaseDraft;
}

/** Label [ X ] s [Set]: every step gets X seconds; empty at first, the shown step's time as its placeholder */
const ChaseTimeOfAllSteps = ({steps, shownStep, onPreview, onApply, time}: AllStepsActionProps & {time: StepTime}) => {
  const {i18n} = useLingui();
  const fieldId = useId();
  const [text, setText] = useState('');
  const canApply = time.isValidText(text);
  const inError = text.trim() !== '' && !canApply;
  const effect = () => ({line: time.lineOf(steps, msOfSecondsText(text)), valueIds: []});
  const apply = () => {
    if (canApply) {
      const ms = msOfSecondsText(text);
      onApply((draft) => time.change(draft, ms), effect());
    }
  };

  return (
    <div className={allStepsAction}>
      <label className={actionLabel} htmlFor={fieldId}>
        {time.label}
      </label>
      <span className={actionField}>
        <input
          id={fieldId}
          className={timeOfAllInput[inError ? 'invalid' : 'valid']}
          type="number"
          min={time.minSeconds}
          max={time.maxSeconds}
          step={HOLD_INPUT_STEP_SECONDS}
          value={text}
          placeholder={shownStep && time.shownText(shownStep)}
          aria-invalid={inError}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={applyOnEnter(apply)}
        />
        <Trans>s</Trans>
      </span>
      <ChaseAllStepsButton
        title={time.title}
        disabled={!canApply}
        onApply={apply}
        onPreview={(active) => onPreview(active ? effect() : undefined)}
      >
        <Trans>Set</Trans>
      </ChaseAllStepsButton>
      {inError && (
        <ul className={fieldErrors}>
          <li>{i18n._(time.error)}</li>
        </ul>
      )}
    </div>
  );
};

export default ChaseTimeOfAllSteps;
