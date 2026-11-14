import {Trans} from '@lingui/react/macro';

/** the manual's topic on Show mode and Setup mode, the password */
const ModesTopic = () => (
  <>
    <p>
      <Trans>
        The app always starts in <strong>Show mode</strong>: the fixtures, their presets and the scenes can be played,
        but not changed, and the Channels view is off. Anything else needs <strong>Setup mode</strong>: in the{' '}
        <strong>Settings</strong> view, press <strong>Unlock Setup mode</strong> and type the password. The first time,
        there is no password yet: the one you type (twice) becomes it. The app then goes to the Show view; while Setup
        mode is open, the top bar says so.
      </Trans>
    </p>
    <p>
      <Trans>
        Setup mode returns to Show mode with the <strong>Lock</strong> button, after 10 minutes without input and
        whenever the app is restarted. A fixture or scene being edited and not saved yet is dropped then. The channel
        lock stays as it is.
      </Trans>
    </p>
    <p>
      <Trans>
        To change the password, unlock Setup mode and press <strong>Change password</strong> in the Settings view: type
        the current password and the new one twice. From then on, only the new one unlocks Setup mode and lifts the
        channel lock.
      </Trans>
    </p>
    <p>
      <Trans>
        Forgot the password? Quit the app (on macOS with ⌘Q), delete <strong>settings.json</strong> in the data folder
        (see the Data folder section) and start it again: the next time a password is asked for, it becomes the new one.
      </Trans>
    </p>
  </>
);

export default ModesTopic;
