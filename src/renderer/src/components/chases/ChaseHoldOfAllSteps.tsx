import {Trans, useLingui} from '@lingui/react/macro';

import {holdOfAllStepsEffect} from '@/data/chaseAllSteps';
import {withHoldOfAllSteps} from '@/data/chaseDraft';
import {HOLD_MAX_SECONDS, HOLD_MIN_SECONDS, isValidHoldText} from '@/data/chaseHold';
import {chaseErrorMessage} from '@/i18n/messages/chaseMessages';

import ChaseTimeOfAllSteps from './ChaseTimeOfAllSteps';
import type {AllStepsActionProps} from './allStepsAction';

/** Hold [ X ] s [Set]: every step holds X seconds */
const ChaseHoldOfAllSteps = (props: AllStepsActionProps) => {
  const {t} = useLingui();

  return (
    <ChaseTimeOfAllSteps
      {...props}
      time={{
        label: <Trans>Hold</Trans>,
        title: t`Set the hold of all steps`,
        minSeconds: HOLD_MIN_SECONDS,
        maxSeconds: HOLD_MAX_SECONDS,
        isValidText: isValidHoldText,
        error: chaseErrorMessage({type: 'chase-step-hold-invalid'}),
        shownText: ({hold}) => hold,
        lineOf: (steps, holdMs) => ({action: 'hold', done: false, effect: holdOfAllStepsEffect(steps, holdMs)}),
        change: withHoldOfAllSteps
      }}
    />
  );
};

export default ChaseHoldOfAllSteps;
