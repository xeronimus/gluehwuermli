import type {MessageDescriptor} from '@lingui/core';
import {msg} from '@lingui/core/macro';

import type {DmxOutputStatus} from '@shared/ipc';

/** the status in the top bar; a port error shows the raw text of serialport or the OS, it isn't translated */
export function outputStatusMessage(status: DmxOutputStatus): MessageDescriptor {
  switch (status.type) {
    case 'disconnected':
      return msg`Not connected`;
    case 'connecting': {
      const {path} = status;
      return msg`Connecting to ${path}…`;
    }
    case 'connected': {
      const {path} = status;
      return msg`Sending on ${path}`;
    }
    case 'failed': {
      const {path} = status;
      if (status.reason === 'port-closed') {
        return msg`${path}: the port was closed, is the widget still plugged in?`;
      }
      const {message} = status;
      return msg`${path}: ${message}`;
    }
  }
}
