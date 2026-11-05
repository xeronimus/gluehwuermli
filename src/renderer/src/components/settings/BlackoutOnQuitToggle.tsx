import {useEffect} from 'react';

import {Trans} from '@lingui/react/macro';

import {useActionLoadBlackoutOnQuit, useActionSetBlackoutOnQuit} from '@/state/actionHooks/blackoutOnQuit';
import {selectIsSetupMode} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import {checkboxLabel, message} from './SettingsView.css';

/**
 * whether quitting blacks out the rig; shown in Show mode too, so the operator knows what quitting does, but only
 * changed in Setup mode
 */
const BlackoutOnQuitToggle = () => {
  const blackoutOnQuit = useAppStore((state) => state.blackoutOnQuit);
  const setupMode = useAppStore(selectIsSetupMode);
  const loadBlackoutOnQuit = useActionLoadBlackoutOnQuit();
  const setBlackoutOnQuit = useActionSetBlackoutOnQuit();

  // it only changes through this toggle: ask main once
  useEffect(() => {
    if (useAppStore.getState().blackoutOnQuit === undefined) {
      void loadBlackoutOnQuit();
    }
  }, []);

  return (
    <>
      <label className={checkboxLabel}>
        <input
          type="checkbox"
          checked={blackoutOnQuit === true}
          disabled={!setupMode || blackoutOnQuit === undefined}
          onChange={(event) => void setBlackoutOnQuit(event.target.checked)}
        />
        <Trans>Black out on quit</Trans>
      </label>
      <p className={message}>
        <Trans>
          Sets all channels to 0 before the app closes the port. Otherwise the widget keeps sending the last look after
          the app is gone. Can be changed in Setup mode.
        </Trans>
      </p>
    </>
  );
};

export default BlackoutOnQuitToggle;
