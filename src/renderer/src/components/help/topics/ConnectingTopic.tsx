import {Trans} from '@lingui/react/macro';

/** the manual's topic on plugging in the DMX interface, connecting, Emergency off, what the interface does after a disconnect */
const ConnectingTopic = () => (
  <>
    <ol>
      <li>
        <Trans>
          Plug in the DMX interface, an Enttec DMX USB Pro or a Eurolite USB-DMX512 PRO, and connect your fixtures to
          its DMX output. Windows shows it as a serial port (COM3, for example), macOS as /dev/cu.usbserial-… .
        </Trans>
      </li>
      <li>
        <Trans>
          Choose the port in the <strong>Output</strong> section of the <strong>Settings</strong> view (a click on the
          status in the top bar leads there; no password needed). A port that looks like one of the two (both use the
          same USB chip) is marked with a <strong>▸</strong> and chosen for you. Plugged it in after starting the app?
          Search the ports again with the refresh button.
        </Trans>
      </li>
      <li>
        <Trans>
          Press <strong>Connect</strong> in the top bar (or in the Settings). The status in the top bar says{' '}
          <strong>Sending on COM3</strong> (or /dev/cu.usbserial-…) once the app sends to the interface.
        </Trans>
      </li>
    </ol>
    <p>
      <Trans>
        The app remembers the port it was last connected to, also after a Disconnect, and chooses it again on the next
        start. It always starts disconnected, so nothing is sent before you press Connect. Plugged the interface in
        after starting the app? Search the serial ports again in the Settings, then press Connect.
      </Trans>
    </p>
    <p>
      <Trans>
        <strong>Emergency off</strong> at the right of the top bar sets all 512 channels to 0 at once, in Show and in
        Setup mode, with or without a project. The fixtures, presets and scenes stay as they are; the faders show 0.
      </Trans>
    </p>
    <p>
      <Trans>
        If the port can't be opened, or the interface is unplugged while sending, the status shows the port and what
        went wrong, e.g. that another program is using it. Fix that and press Connect again: the faders kept their
        values and are sent again as soon as the port is open.
      </Trans>
    </p>
    <p>
      <Trans>
        After <strong>Disconnect</strong>, and after quitting the app, the interface keeps sending the last values for
        as long as it has USB power: the lights stay as they are. Press <strong>Emergency off</strong> before
        disconnecting to black out. With <strong>Black out on quit</strong> on (in the Output section), quitting the app
        sets all channels to 0 first. On macOS, quit with ⌘Q: closing the window leaves the app running and sending, a
        running chase too.
      </Trans>
    </p>
  </>
);

export default ConnectingTopic;
