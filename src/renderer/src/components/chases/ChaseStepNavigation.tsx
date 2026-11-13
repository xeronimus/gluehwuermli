import type {ReactNode} from 'react';

import {useLingui} from '@lingui/react/macro';

import {type ChaseStepDraft, stepIdBeside} from '@/data/chaseDraft';
import type {MoveDirection} from '@/data/listOrder';

import Button from '../commons/Button';
import {NextIcon, PreviousIcon} from '../commons/icons';

interface ChaseStepNavigationProps {
  steps: readonly ChaseStepDraft[];
  shownId: string | undefined;
  onSelect: (stepId: string) => void;
}

/**
 * the previous and the next step's tab, to step through the chase; with Preview on rig on, each step chosen is sent to
 * the output like a tab chosen, the buttons themselves don't depend on it
 */
const ChaseStepNavigation = ({steps, shownId, onSelect}: ChaseStepNavigationProps) => {
  const {t} = useLingui();

  const buttonOf = (direction: MoveDirection, title: string, icon: ReactNode) => {
    const stepId = stepIdBeside(steps, shownId, direction);
    return (
      <Button
        variant="icon"
        title={title}
        disabled={stepId === undefined}
        onClick={() => stepId !== undefined && onSelect(stepId)}
      >
        {icon}
      </Button>
    );
  };

  return (
    <>
      {buttonOf('earlier', t`Previous step`, <PreviousIcon />)}
      {buttonOf('later', t`Next step`, <NextIcon />)}
    </>
  );
};

export default ChaseStepNavigation;
