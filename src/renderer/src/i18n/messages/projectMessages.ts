import type {MessageDescriptor} from '@lingui/core';
import {msg} from '@lingui/core/macro';

import type {ProjectError} from '@shared/ipc';

/** why a project file couldn't be opened or created; a reason of the OS is shown as it is, it isn't translated */
export function projectErrorMessage(error: ProjectError): MessageDescriptor {
  switch (error.reason) {
    case 'missing':
      return msg`The file isn't there: it was moved, renamed or deleted, or it is on a drive that isn't plugged in.`;
    case 'unreadable': {
      const {message} = error;
      return msg`The file can't be read: ${message}`;
    }
    case 'invalid':
      return msg`The file is no Glühwürmli project, or it is damaged. It was left as it is.`;
    case 'too-new': {
      const {version} = error;
      return msg`The file was saved by a newer version of Glühwürmli (project version ${version}). Update the app to open it.`;
    }
    case 'not-writable': {
      const {message} = error;
      return msg`The file can't be created: ${message}`;
    }
  }
}
