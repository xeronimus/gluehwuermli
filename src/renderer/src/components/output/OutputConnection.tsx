import {useLingui} from '@lingui/react/macro';

import {selectedPortOf} from '@/data/outputStatus';
import {noPortMessage} from '@/i18n/messages/outputMessages';
import {useAppStore} from '@/state/store';

import ConnectButton from '../commons/ConnectButton';
import {outputConnection, selectedPort} from './OutputBar.css';

/**
 * the port chosen in the Settings and Connect; only Disconnect while connected, the status next to it already names the
 * port then
 */
const OutputConnection = () => {
  const {i18n} = useLingui();
  const connected = useAppStore((state) => state.outputStatus.type === 'connected');
  const availablePorts = useAppStore((state) => state.availablePorts);
  const selectedPortPath = useAppStore((state) => state.selectedPortPath);

  const port = selectedPortOf(availablePorts, selectedPortPath);

  return (
    <span className={outputConnection}>
      {!connected && (
        <span className={selectedPort}>{port.type === 'selected' ? port.path : i18n._(noPortMessage(port))}</span>
      )}
      <ConnectButton />
    </span>
  );
};

export default OutputConnection;
