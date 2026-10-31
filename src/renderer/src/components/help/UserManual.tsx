import {manual, manualSection} from './UserManual.css';

/** how to use the app, from plugging in the widget to presets; one section per task */
const UserManual = () => (
  <article className={manual}>
    <section className={manualSection}>
      <h2>Connecting the DMX USB Pro</h2>
      <ol>
        <li>
          Plug in the Enttec DMX USB Pro and connect your fixtures to its DMX output. Windows shows it as a serial port
          (COM3, for example).
        </li>
        <li>
          Choose the port in the top bar. A port that looks like an Enttec is marked <strong>Enttec?</strong> and chosen
          for you. Plugged it in after starting the app? Search the ports again with the refresh button.
        </li>
        <li>
          Press <strong>Connect</strong>. The status says <strong>Sending on COM3</strong> once the app sends to the
          widget.
        </li>
      </ol>
      <p>
        If the port can't be opened, or the widget is unplugged while sending, the status shows the port and what went
        wrong, e.g. that another program is using it. Fix that and press Connect again: the faders kept their values and
        are sent again as soon as the port is open.
      </p>
      <p>
        After <strong>Disconnect</strong>, and after closing the app, the widget keeps sending the last values for as
        long as it has USB power: the lights stay as they are. Pull the faders down before disconnecting to black out.
      </p>
    </section>

    <section className={manualSection}>
      <h2>Setting up a fixture</h2>
      <p>
        A fixture is one device of your rig, e.g. a PAR or a smoke machine. In the <strong>Fixtures</strong> view, press{' '}
        <strong>Add fixture</strong>:
      </p>
      <ol>
        <li>
          Set the <strong>start address</strong> to the DMX address set on the device (its display or DIP switches).
        </li>
        <li>
          Add a <strong>channel</strong> for every entry of the device's channel list you want to control. Its{' '}
          <strong>offset</strong> is its number in the manual minus 1: channel 1 has offset 0, channel 2 offset 1.
        </li>
        <li>
          Optionally, a <strong>hint</strong> shown below the faders (e.g. "warm up 2 min before smoke") and a{' '}
          <strong>description</strong> for anything else: the DMX mode, DIP switches, where it hangs.
        </li>
      </ol>
      <p>
        The editor explains each step in its own help. Fixtures sharing addresses get a warning. A click on a fader's
        value raises it by one, a click on its name lowers it by one.
      </p>
    </section>

    <section className={manualSection}>
      <h2>Presets</h2>
      <p>
        A preset is a button on a fixture that sets several of its channels at once, e.g. "Warm white". To make one, set
        the fixture's faders and press the save button next to its presets. Edit the fixture to rename a preset or
        choose which channels it sets: the ones it leaves out stay as they are.
      </p>
    </section>

    <section className={manualSection}>
      <h2>Finding out what a device does</h2>
      <p>
        No manual, or not sure it is right? The <strong>Channels</strong> view has a fader for every DMX channel, 16 at
        a time. Jump to the device's address, move one channel after the other and watch what it does. The fixtures and
        the channels show the same values: a fader moved in one view has moved in the other, too.
      </p>
    </section>
  </article>
);

export default UserManual;
