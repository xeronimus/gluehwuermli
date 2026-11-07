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
            Press <strong>Connect</strong> in the top bar (or in the Settings). The status in the top bar says{' '}
            <strong>Sending on COM3</strong> once the app sends to the widget.
          </Trans>
        </li>
      </ol>
      <p>
        <Trans>
          The app remembers the port it was last connected to, also after a Disconnect, and chooses it again on the next
          start. It always starts disconnected, so nothing is sent before you press Connect. Plugged the widget in after
          starting the app? Search the serial ports again in the Settings, then press Connect.
        </Trans>
      </p>
      <p>
        <Trans>
          If the port can't be opened, or the widget is unplugged while sending, the status shows the port and what went
          wrong, e.g. that another program is using it. Fix that and press Connect again: the faders kept their values
          and are sent again as soon as the port is open.
        </Trans>
      </p>
      <p>
        <Trans>
          After <strong>Disconnect</strong>, and after closing the app, the widget keeps sending the last values for as
          long as it has USB power: the lights stay as they are. Pull the faders down before disconnecting to black out.
          With <strong>Black out on quit</strong> on (in the Output section), closing the app sets all channels to 0
          first.
        </Trans>
      </p>
    </section>

    <section className={manualSection}>
      <h2>
        <Trans>Show mode and Setup mode</Trans>
      </h2>
      <p>
        <Trans>
          The app always starts in <strong>Show mode</strong>: the fixtures, their presets and the scenes can be played,
          but not changed, and the Channels view is off. Anything else needs <strong>Setup mode</strong>: in the{' '}
          <strong>Settings</strong> view, press <strong>Unlock Setup mode</strong> and type the password. The first
          time, there is no password yet: the one you type (twice) becomes it. While Setup mode is open, the top bar
          says so.
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
          lock is on, the channel never goes above it, whichever fader, preset, scene or view sets it. A laser gets 0, a
          macro channel running the device's own programs e.g. 50. Its faders show a lock and stop at the maximum (at 0
          they are greyed out), and a preset that would set it higher is disabled. A scene that would set it higher
          stays playable, so a look of the whole rig still works: the channel only goes up to its maximum, and the
          scene's button shows a lock.
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
        <Trans>Projects</Trans>
      </h2>
      <p>
        <Trans>
          The fixtures and scenes of a rig live in a <strong>project</strong>: a .glp file you keep wherever you like,
          in Documents, on the Desktop or on a USB stick. Keep one project per venue or show. Every change to a fixture
          or scene is saved to the file right away; there is no Save button.
        </Trans>
      </p>
      <p>
        <Trans>
          Without a project, the <strong>Show</strong> view offers <strong>Create project</strong> and{' '}
          <strong>Open project</strong>; later they are in the <strong>Project</strong> section of the{' '}
          <strong>Settings</strong> view, with the recent projects. Creating a project needs Setup mode (in Show mode,
          the password is asked first), opening one doesn't. A double-click on a .glp file opens it in the app, also
          while the app is running. The app opens the last project again on its next start.
        </Trans>
      </p>
      <p>
        <Trans>
          Opening another project sets all channels to 0 first, then applies the new project's channel locks. A fixture
          or scene being edited is dropped, the app asks first. A file that is no valid project, or one saved by a newer
          version of the app, is not opened and left exactly as it is. To back up a project or take it to another
          computer, copy the file; its path is shown in the Help view.
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
          <strong>Add fixture</strong> in the <strong>Show</strong> view:
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
            Optionally, a channel's <strong>color</strong> as a hex value, e.g. ff0000 for red or #7f00ff for UV: its
            fader is filled with it and glows the brighter the higher the value, so the red channel is found at a
            glance.
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
          value raises it by one, a click on its name lowers it by one, a right click on it sets it to its lowest value.
        </Trans>
      </p>
      <p>
        <Trans>
          The fixtures are shown in the order they were added. To arrange them the way your rig is run, use the arrows
          next to a fixture's name in Setup mode: they move it one place to the left or right. The scene buttons have
          the same arrows, and so do the presets in the fixture editor.
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
        <Trans>Scenes</Trans>
      </h2>
      <p>
        <Trans>
          A scene is a button above the fixtures that sets the channels of several fixtures at once, e.g. "Intro" or
          "Blackout". The fixtures a scene leaves out stay as they are, so scenes can be layered: a colour scene for the
          PARs while the smoke machine keeps running.
        </Trans>
      </p>
      <p>
        <Trans>
          To make one, unlock Setup mode, set the faders to the look you want, press <strong>Add scene</strong> next to{' '}
          <strong>Add fixture</strong>, name it and choose its fixtures: their current values are stored. The edit
          button next to a scene renames it or changes its fixtures; check <strong>Save current values</strong> to store
          what the faders show now. Deleting a fixture takes it out of every scene.
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
