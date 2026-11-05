import {Trans, useLingui} from '@lingui/react/macro';

import {useActionConnectOutput, useActionDisconnectOutput} from '@/state/actionHooks/connectOutput';
import {useActionLoadPorts} from '@/state/actionHooks/loadPorts';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {ConnectIcon, DisconnectIcon, RefreshPortsIcon} from '../commons/icons';
import BlackoutOnQuitToggle from './BlackoutOnQuitToggle';
import PortSelect from './PortSelect';
import {message, portControls, settingsSection} from './SettingsView.css';

/**
 * the serial port of the DMX USB Pro: choosing it, connecting and disconnecting, no password needed, also in Show mode;
 * and whether quitting blacks out the rig, changed in Setup mode only
 */
const OutputSection = () => {
  const {t} = useLingui();
  const outputStatus = useAppStore((state) => state.outputStatus);
  const selectedPortPath = useAppStore((state) => state.selectedPortPath);
  const loadPorts = useActionLoadPorts();
  const connect = useActionConnectOutput();
  const disconnect = useActionDisconnectOutput();

  const connected = outputStatus.type === 'connected';
  const portLocked = connected || outputStatus.type === 'connecting';

  const onConnect = () => {
    if (selectedPortPath) {
      void connect(selectedPortPath);
    }
  };

  return (
    <section className={settingsSection}>
      <h2>
        <Trans>Output</Trans>
      </h2>
      <p className={message}>
        <Trans>The serial port of the Enttec DMX USB Pro. The top bar shows whether the app is sending.</Trans>
      </p>
      <div className={portControls}>
        <PortSelect disabled={portLocked} />
        <Button onClick={() => void loadPorts()} disabled={portLocked} title={t`Search the serial ports again`}>
          <RefreshPortsIcon />
        </Button>
        {connected ? (
          <Button onClick={() => void disconnect()}>
            <DisconnectIcon /> <Trans>Disconnect</Trans>
          </Button>
        ) : (
          <Button variant="primary" onClick={onConnect} disabled={portLocked || !selectedPortPath}>
            <ConnectIcon /> <Trans>Connect</Trans>
          </Button>
        )}
      </div>
      <BlackoutOnQuitToggle />
    </section>
  );
};

export default OutputSection;
