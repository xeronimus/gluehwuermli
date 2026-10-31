import {useAppStore} from '@/state/store';

import {UnlockIcon} from '../commons/icons';
import {lockIndicatorVariants} from './OutputBar.css';

interface LockIndicatorProps {
  /** opens the Settings view, where the controls are */
  onClick: () => void;
}

/**
 * A reminder in the top bar, only while something is unlocked; Show mode with the channel lock on, the normal state
 * during a show, needs none. A click leads to the controls in the Settings view.
 */
const LockIndicator = ({onClick}: LockIndicatorProps) => {
  const lockStatus = useAppStore((state) => state.lockStatus);
  if (lockStatus.mode === 'loading') {
    return null;
  }

  return (
    <>
      {lockStatus.mode === 'setup' && (
        <button className={lockIndicatorVariants.setup} onClick={onClick} title="Open the Settings to lock it">
          <UnlockIcon /> Setup mode
        </button>
      )}
      {!lockStatus.channelLocked && (
        <button
          className={lockIndicatorVariants.channelLockLifted}
          onClick={onClick}
          title="Open the Settings to turn it on"
        >
          <UnlockIcon /> Channel lock lifted
        </button>
      )}
    </>
  );
};

export default LockIndicator;
