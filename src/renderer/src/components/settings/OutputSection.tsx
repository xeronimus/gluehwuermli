import {Trans, useLingui} from '@lingui/react/macro';

import {useActionLoadPorts} from '@/state/actionHooks/loadPorts';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import ConnectButton from '../commons/ConnectButton';
import {RefreshPortsIcon} from '../commons/icons';
import BlackoutOnQuitToggle from './BlackoutOnQuitToggle';
import PortSelect from './PortSelect';
import {message, portControls, settingsSection} from './SettingsView.css';

/**
 * the serial port of the DMX USB Pro: choosing it, connecting and disconnecting (also in the top bar, but the port
 * select is locked while connected, so changing the port works without leaving the Settings), and whether quitting
 * blacks out the rig; no password needed, also in Show mode
 */
const OutputSection = () => {
  const {t} = useLingui();
  const outputStatus = useAppStore((state) => state.outputStatus);
  const loadPorts = useActionLoadPorts();

  const portLocked = outputStatus.type === 'connected' || outputStatus.type === 'connecting';

  return (
    <section className={settingsSection}>
      <h2>
        <Trans>Output</Trans>
      </h2>
      <p className={message}>
        <Trans>
          The serial port of the DMX interface, an Enttec DMX USB Pro or a Eurolite USB-DMX512 PRO; ▸ marks one that
          looks like it. The app always starts disconnected: press Connect here or in the top bar.
        </Trans>
      </p>
      <div className={portControls}>
        <PortSelect disabled={portLocked} />
        <Button onClick={() => void loadPorts()} disabled={portLocked} title={t`Search the serial ports again`}>
          <RefreshPortsIcon />
        </Button>
        <ConnectButton />
      </div>
      <BlackoutOnQuitToggle />
    </section>
  );
};

export default OutputSection;
