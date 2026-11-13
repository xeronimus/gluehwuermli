import {useRef} from 'react';

import {useLingui} from '@lingui/react/macro';

import {stepFadeMs} from '@shared/chases';
import type {ChaseStep} from '@shared/ipc';

import {holdSeconds, secondsText} from '@/data/chaseHold';
import {stepBoxesFit} from '@/data/chaseRows';

import {useElementWidth} from '../commons/useElementWidth';
import {chaseSteps, stepBox, stepCountText} from './ChaseSteps.css';

interface ChaseStepsProps {
  steps: readonly ChaseStep[];
  /** the step playing, counted from 0; undefined when the chase doesn't play */
  currentIndex: number | undefined;
}

/**
 * A small box per step, the current one filled, each with its fade in and hold on hover. The boxes get narrower to fit; when they
 * would get too narrow, the step number instead.
 */
const ChaseSteps = ({steps, currentIndex}: ChaseStepsProps) => {
  const {t} = useLingui();
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const stepCount = steps.length;

  const content = () => {
    if (stepBoxesFit(stepCount, width)) {
      return steps.map((step, index) => {
        const stepNumber = index + 1;
        const seconds = holdSeconds(step.holdMs);
        const fadeMs = stepFadeMs(step);
        const fadeSeconds = secondsText(fadeMs);
        return (
          <span
            key={step.id}
            className={stepBox[index === currentIndex ? 'current' : 'other']}
            title={
              fadeMs > 0
                ? t`Step ${stepNumber}: fades in ${fadeSeconds} s, holds ${seconds} s`
                : t`Step ${stepNumber}: holds ${seconds} s`
            }
          />
        );
      });
    }
    if (currentIndex === undefined) {
      return <span className={stepCountText}>{t`${stepCount} steps`}</span>;
    }
    const stepNumber = currentIndex + 1;
    return <span className={stepCountText}>{t`step ${stepNumber} / ${stepCount}`}</span>;
  };

  // measured while empty too, so the first width decides between the boxes and the text
  return (
    <div ref={ref} className={chaseSteps}>
      {width > 0 && content()}
    </div>
  );
};

export default ChaseSteps;
