import {describePort} from '@/data/outputStatus';
import {useAppStore} from '@/state/store';

interface PortSelectProps {
  disabled: boolean;
}

const NO_PORT = '';

const PortSelect = ({disabled}: PortSelectProps) => {
  const ports = useAppStore((state) => state.availablePorts);
  const selectedPortPath = useAppStore((state) => state.selectedPortPath);
  const setSelectedPortPath = useAppStore((state) => state.setSelectedPortPath);

  return (
    <select
      value={selectedPortPath ?? NO_PORT}
      disabled={disabled || ports.length === 0}
      onChange={(event) => setSelectedPortPath(event.target.value || undefined)}
    >
      {ports.length === 0 && <option value={NO_PORT}>No serial port found</option>}
      {ports.map((port) => (
        <option key={port.path} value={port.path}>
          {describePort(port)}
        </option>
      ))}
    </select>
  );
};

export default PortSelect;
