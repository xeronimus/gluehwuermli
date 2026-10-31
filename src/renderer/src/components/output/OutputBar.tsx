import {useEffect} from 'react';

import fireflyLogo from '@resources/favicon/favicon-96x96.png';

import {describeOutputStatus} from '@/data/outputStatus';
import {useActionConnectOutput, useActionDisconnectOutput} from '@/state/actionHooks/connectOutput';
import {useActionLoadPorts} from '@/state/actionHooks/loadPorts';
import {selectActiveChannelCount} from '@/state/channels/channelsSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {ConnectIcon, DisconnectIcon, RefreshPortsIcon} from '../commons/icons';
import {activeChannels, appLogo, appTitle, outputBar, outputError, spacer, statusVariants} from './OutputBar.css';
import PortSelect from './PortSelect';
import {useOutputStatusSubscription} from './useOutputStatusSubscription';

/** port choice, connect/disconnect and the status of the DMX output */
const OutputBar = () => {
  const outputStatus = useAppStore((state) => state.outputStatus);
  const selectedPortPath = useAppStore((state) => state.selectedPortPath);
  const error = useAppStore((state) => state.outputError);
  const activeChannelCount = useAppStore(selectActiveChannelCount);
  const loadPorts = useActionLoadPorts();
  const connect = useActionConnectOutput();
  const disconnect = useActionDisconnectOutput();

  useOutputStatusSubscription();

  // the ports are external state: list them once when the bar appears (loadPorts is a new function every render)
  useEffect(() => {
    void loadPorts();
  }, []);

  const connected = outputStatus.type === 'connected';
  const portLocked = connected || outputStatus.type === 'connecting';

  const onConnect = () => {
    if (selectedPortPath) {
      void connect(selectedPortPath);
    }
  };

  return (
    <header className={outputBar}>
      <img className={appLogo} src={fireflyLogo} alt="" />
      <span className={appTitle}>Glühwürmli</span>
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
      <span className={statusVariants[outputStatus.type]}>{describeOutputStatus(outputStatus)}</span>
      {error && <span className={outputError}>{error}</span>}
      <span className={spacer} />
      <span className={activeChannels}>{activeChannelCount} channels above 0</span>
    </header>
  );
};

export default OutputBar;
