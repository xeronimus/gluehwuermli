import {Trans} from '@lingui/react/macro';

import {useActionConnectOutput, useActionDisconnectOutput} from '@/state/actionHooks/connectOutput';
import {useAppStore} from '@/state/store';

import Button from './Button';
import type {ButtonSize} from './Button.css';
import {ConnectIcon, DisconnectIcon} from './icons';

interface ConnectButtonProps {
  size?: ButtonSize;
}

/**
 * Connect to the selected port, or Disconnect while connected; in the top bar and in the Settings, so both follow the
 * same rules. No password needed, also in Show mode.
 */
const ConnectButton = ({size}: ConnectButtonProps) => {
  const outputStatus = useAppStore((state) => state.outputStatus);
  const selectedPortPath = useAppStore((state) => state.selectedPortPath);
  const connect = useActionConnectOutput();
  const disconnect = useActionDisconnectOutput();

  if (outputStatus.type === 'connected') {
    return (
      <Button size={size} onClick={() => void disconnect()}>
        <DisconnectIcon /> <Trans>Disconnect</Trans>
      </Button>
    );
  }

  const onConnect = () => {
    if (selectedPortPath) {
      void connect(selectedPortPath);
    }
  };

  return (
    <Button
      variant="primary"
      size={size}
      onClick={onConnect}
      disabled={outputStatus.type === 'connecting' || !selectedPortPath}
    >
      <ConnectIcon /> <Trans>Connect</Trans>
    </Button>
  );
};

export default ConnectButton;
