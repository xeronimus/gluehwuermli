import {useEffect} from 'react';

import {Trans} from '@lingui/react/macro';

import {useActionLoadBlackoutOnQuit, useActionSetBlackoutOnQuit} from '@/state/actionHooks/blackoutOnQuit';
import {useAppStore} from '@/state/store';

import {checkboxLabel, message} from './SettingsView.css';

/**
 * whether quitting blacks out the rig; no password needed, like the port: it only decides how the rig is left
 */
const BlackoutOnQuitToggle = () => {
  const blackoutOnQuit = useAppStore((state) => state.blackoutOnQuit);
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
          disabled={blackoutOnQuit === undefined}
          onChange={(event) => void setBlackoutOnQuit(event.target.checked)}
        />
        <Trans>Black out on quit</Trans>
      </label>
      <p className={message}>
        <Trans>
          Sets all channels to 0 before the app closes the port. Otherwise the widget keeps sending the last look after
          the app is gone.
        </Trans>
      </p>
    </>
  );
};

export default BlackoutOnQuitToggle;
