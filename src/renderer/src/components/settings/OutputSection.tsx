import {useActionConnectOutput, useActionDisconnectOutput} from '@/state/actionHooks/connectOutput';
import {useActionLoadPorts} from '@/state/actionHooks/loadPorts';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {ConnectIcon, DisconnectIcon, RefreshPortsIcon} from '../commons/icons';
import PortSelect from './PortSelect';
import {message, portControls, settingsSection} from './SettingsView.css';

/** the serial port of the DMX USB Pro: choosing it, connecting and disconnecting; no password needed, also in Show mode */
const OutputSection = () => {
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
      <h2>Output</h2>
      <p className={message}>
        The serial port of the Enttec DMX USB Pro. The top bar shows whether the app is sending.
      </p>
      <div className={portControls}>
        <PortSelect disabled={portLocked} />
        <Button onClick={() => void loadPorts()} disabled={portLocked} title="Search the serial ports again">
          <RefreshPortsIcon />
        </Button>
        {connected ? (
          <Button onClick={() => void disconnect()}>
            <DisconnectIcon /> Disconnect
          </Button>
        ) : (
          <Button variant="primary" onClick={onConnect} disabled={portLocked || !selectedPortPath}>
            <ConnectIcon /> Connect
          </Button>
        )}
      </div>
    </section>
  );
};

export default OutputSection;
