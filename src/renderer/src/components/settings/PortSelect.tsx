import {Trans} from '@lingui/react/macro';

import {describePort} from '@/data/outputStatus';
import {useAppStore} from '@/state/store';

interface PortSelectProps {
  disabled: boolean;
}

const NO_PORT = '';

const PortSelect = ({disabled}: PortSelectProps) => {
  const ports = useAppStore((state) => state.availablePorts);
  const selectedPortPath = useAppStore((state) => state.selectedPortPath);
  const choosePortPath = useAppStore((state) => state.choosePortPath);

  return (
    <select
      value={selectedPortPath ?? NO_PORT}
      disabled={disabled || ports.length === 0}
      onChange={(event) => choosePortPath(event.target.value || undefined)}
    >
      {ports.length === 0 && (
        <option value={NO_PORT}>
          <Trans>No serial port found</Trans>
        </option>
      )}
      {ports.map((port) => (
        <option key={port.path} value={port.path}>
          {describePort(port)}
        </option>
      ))}
    </select>
  );
};

export default PortSelect;
