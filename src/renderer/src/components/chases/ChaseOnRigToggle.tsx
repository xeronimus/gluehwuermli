import {useEffect} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {useActionToggleStepOnRig} from '@/state/actionHooks/stepOnRig';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {StepOnRigIcon} from '../commons/icons';

/**
 * the chase editor's "Preview on rig": sends the shown step to the output while it is edited (ChaseStepEditor). Mounts
 * and unmounts with the editor, so every way of closing it (Save, Cancel, Escape, Show mode, another project) turns the
 * preview off here; the output keeps the last values
 */
const ChaseOnRigToggle = () => {
  const {t} = useLingui();
  const stepOnRig = useAppStore((state) => state.stepOnRig);
  const setStepOnRig = useAppStore((state) => state.setStepOnRig);
  const toggleStepOnRig = useActionToggleStepOnRig();

  useEffect(() => () => setStepOnRig(false), [setStepOnRig]);

  return (
    <Button
      size="compact"
      variant={stepOnRig ? 'primary' : 'default'}
      pressed={stepOnRig}
      title={t`Send the shown step to the output while you edit it`}
      onClick={() => void toggleStepOnRig(!stepOnRig)}
    >
      <StepOnRigIcon />
      <Trans>Preview on rig</Trans>
    </Button>
  );
};

export default ChaseOnRigToggle;
