import {Trans} from '@lingui/react/macro';

import {manual, manualSection} from './UserManual.css';

/** how to use the app, from plugging in the widget to presets; one section per task */
const UserManual = () => (
  <article className={manual}>
    <section className={manualSection}>
      <h2>
        <Trans>Connecting the DMX USB Pro</Trans>
      </h2>
      <ol>
        <li>
          <Trans>
            Plug in the Enttec DMX USB Pro and connect your fixtures to its DMX output. Windows shows it as a serial
            port (COM3, for example).
          </Trans>
        </li>
        <li>
          <Trans>
            Choose the port in the <strong>Output</strong> section of the <strong>Settings</strong> view (a click on the
            status in the top bar leads there; no password needed). A port that looks like an Enttec is marked{' '}
            <strong>Enttec?</strong> and chosen for you. Plugged it in after starting the app? Search the ports again
            with the refresh button.
          </Trans>
        </li>
        <li>
          <Trans>
            Press <strong>Connect</strong>. The status in the top bar says <strong>Sending on COM3</strong> once the app
            sends to the widget.
          </Trans>
        </li>
      </ol>
      <p>
        <Trans>
          The app remembers the port it was last connected to, also after a Disconnect. On the next start it connects to
          it by itself, as long as the widget is plugged in before the app starts; otherwise it starts disconnected:
          plug the widget in, search the serial ports again and press Connect.
        </Trans>
      </p>
      <p>
        <Trans>
          If the port can't be opened, or the widget is unplugged while sending, the status shows the port and what went
          wrong, e.g. that another program is using it. Fix that, click the status and press Connect again: the faders
          kept their values and are sent again as soon as the port is open.
        </Trans>
      </p>
      <p>
        <Trans>
          After <strong>Disconnect</strong>, and after closing the app, the widget keeps sending the last values for as
          long as it has USB power: the lights stay as they are. Pull the faders down before disconnecting to black out.
        </Trans>
      </p>
    </section>

    <section className={manualSection}>
      <h2>
        <Trans>Show mode and Setup mode</Trans>
      </h2>
      <p>
        <Trans>
          The app always starts in <strong>Show mode</strong>: the fixtures and their presets can be played, but not
          changed, and the Channels view is off. Anything else needs <strong>Setup mode</strong>: in the{' '}
          <strong>Settings</strong> view, press <strong>Unlock Setup mode</strong> and type the password. The first
          time, there is no password yet: the one you type (twice) becomes it. While Setup mode is open, the top bar
          says so.
        </Trans>
      </p>
      <p>
        <Trans>
          Setup mode returns to Show mode with the <strong>Lock</strong> button, after 10 minutes without input and
          whenever the app is restarted. A fixture being edited and not saved yet is dropped then. The channel lock
          stays as it is.
        </Trans>
      </p>
      <p>
        <Trans>
          To change the password, unlock Setup mode and press <strong>Change password</strong> in the Settings view:
          type the current password and the new one twice. From then on, only the new one unlocks Setup mode and lifts
          the channel lock.
        </Trans>
      </p>
      <p>
        <Trans>
          Forgot the password? Close the app, delete <strong>settings.json</strong> in the data folder (see the Data
          folder section) and start it again: the next time a password is asked for, it becomes the new one.
        </Trans>
      </p>
    </section>

    <section className={manualSection}>
      <h2>
        <Trans>Channel locks</Trans>
      </h2>
      <p>
        <Trans>
          A fixture's channel can have a <strong>Max while locked</strong> (in the fixture editor): while the channel
          lock is on, the channel never goes above it, whichever fader, preset or view sets it. A laser gets 0, a macro
          channel running the device's own programs e.g. 50. Its faders show a lock and stop at the maximum (at 0 they
          are greyed out), and a preset that would set it higher is disabled.
        </Trans>
      </p>
      <p>
        <Trans>
          The channel lock is on after every start, independent of the mode. Lift it in the <strong>Settings</strong>{' '}
          view, e.g. for a show where the laser hangs high enough: in Show mode with the password, in Setup mode with a
          confirmation. It then stays lifted, also in Show mode and after Lock, until{' '}
          <strong>Turn channel lock on</strong> or a restart; the top bar shows <strong>Channel lock lifted</strong>{' '}
          meanwhile. Turned on again, the locked channels drop to their maximum right away.
        </Trans>
      </p>
      <p>
        <Trans>
          The lock only covers what the app sends. A laser can still come on without it: through its infrared remote
          (Laser, Auto, Sound), the programs in its own menu, or on its own when there is no DMX signal. Where it can't
          be mounted high enough, cover the laser opening, put the remote away and leave the device's menu on DMX.
        </Trans>
      </p>
    </section>

    <section className={manualSection}>
      <h2>
        <Trans>Setting up a fixture</Trans>
      </h2>
      <p>
        <Trans>
          A fixture is one device of your rig, e.g. a PAR or a smoke machine. In Setup mode, press{' '}
          <strong>Add fixture</strong> in the <strong>Fixtures</strong> view:
        </Trans>
      </p>
      <ol>
        <li>
          <Trans>
            Set the <strong>start address</strong> to the DMX address set on the device (its display or DIP switches).
          </Trans>
        </li>
        <li>
          <Trans>
            Add a <strong>channel</strong> for every entry of the device's channel list you want to control. Its{' '}
            <strong>offset</strong> is its number in the manual minus 1: channel 1 has offset 0, channel 2 offset 1.
          </Trans>
        </li>
        <li>
          <Trans>
            Optionally, a <strong>hint</strong> shown below the faders (e.g. "warm up 2 min before smoke") and a{' '}
            <strong>description</strong> for anything else: the DMX mode, DIP switches, where it hangs. The description
            is Markdown (lists, tables, links to web pages that open in your browser), with a preview in the editor.
          </Trans>
        </li>
      </ol>
      <p>
        <Trans>
          The editor explains each step in its own help. Fixtures sharing addresses get a warning. A click on a fader's
          value raises it by one, a click on its name lowers it by one.
        </Trans>
      </p>
    </section>

    <section className={manualSection}>
      <h2>
        <Trans>Presets</Trans>
      </h2>
      <p>
        <Trans>
          A preset is a button on a fixture that sets several of its channels at once, e.g. "Warm white". To make one,
          set the fixture's faders and press the save button next to its presets. Edit the fixture to rename a preset or
          choose which channels it sets: the ones it leaves out stay as they are.
        </Trans>
      </p>
    </section>

    <section className={manualSection}>
      <h2>
        <Trans>Finding out what a device does</Trans>
      </h2>
      <p>
        <Trans>
          No manual, or not sure it is right? The <strong>Channels</strong> view (Setup mode only) has a fader for every
          DMX channel, 16 at a time. Jump to the device's address, move one channel after the other and watch what it
          does. The fixtures and the channels show the same values: a fader moved in one view has moved in the other,
          too.
        </Trans>
      </p>
    </section>
  </article>
);

export default UserManual;
