import {Trans, useLingui} from '@lingui/react/macro';

import {useActionEmergencyOff} from '@/state/actionHooks/emergencyOff';

import Button from '../commons/Button';
import {EmergencyOffIcon} from '../commons/icons';

/** always in the top bar, in Show and Setup mode, with or without a project: all 512 channels to 0 */
const EmergencyOffButton = () => {
  const {t} = useLingui();
  const emergencyOff = useActionEmergencyOff();

  return (
    <Button variant="danger" size="compact" onClick={emergencyOff} title={t`Set all 512 channels to 0 now`}>
      <EmergencyOffIcon />
      <Trans>Emergency off</Trans>
    </Button>
  );
};

export default EmergencyOffButton;
