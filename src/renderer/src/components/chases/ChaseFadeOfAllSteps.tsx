import {Trans, useLingui} from '@lingui/react/macro';

import {fadeOfAllStepsEffect} from '@/data/chaseAllSteps';
import {withFadeOfAllSteps} from '@/data/chaseDraft';
import {FADE_MAX_SECONDS, FADE_MIN_SECONDS, isValidFadeText} from '@/data/chaseHold';
import {chaseErrorMessage} from '@/i18n/messages/chaseMessages';

import ChaseTimeOfAllSteps from './ChaseTimeOfAllSteps';
import type {AllStepsActionProps} from './allStepsAction';

/** Fade in [ X ] s [Set]: every step fades in for X seconds, 0 for none */
const ChaseFadeOfAllSteps = (props: AllStepsActionProps) => {
  const {t} = useLingui();

  return (
    <ChaseTimeOfAllSteps
      {...props}
      time={{
        label: <Trans>Fade in</Trans>,
        title: t`Set the fade in of all steps`,
        minSeconds: FADE_MIN_SECONDS,
        maxSeconds: FADE_MAX_SECONDS,
        isValidText: isValidFadeText,
        error: chaseErrorMessage({type: 'chase-step-fade-invalid'}),
        shownText: ({fade}) => fade,
        lineOf: (steps, fadeMs) => ({action: 'fade', done: false, effect: fadeOfAllStepsEffect(steps, fadeMs)}),
        change: withFadeOfAllSteps
      }}
    />
  );
};

export default ChaseFadeOfAllSteps;
