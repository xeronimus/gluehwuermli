import {HelpIcon} from '../commons/icons';
import {fixtureHelp, helpBody, helpExample, helpSummary} from './FixtureHelp.css';

interface FixtureHelpProps {
  /** open when adding a fixture, where the help is needed most; the user can still toggle it */
  initiallyOpen: boolean;
}

/** how to turn a device's manual into a fixture: the start address, channel names and offsets */
const FixtureHelp = ({initiallyOpen}: FixtureHelpProps) => (
  <details className={fixtureHelp} open={initiallyOpen}>
    <summary className={helpSummary}>
      <HelpIcon /> How to set up a fixture
    </summary>
    <div className={helpBody}>
      <ol>
        <li>
          Look up the <strong>channel list</strong> (often called DMX chart or DMX mode) in the device's manual. Many
          devices have several modes, e.g. 3 or 7 channels: pick one and set the device to it.
        </li>
        <li>
          Set the <strong>start address</strong> to the DMX address set on the device (its display or DIP switches). The
          device listens there and on the addresses after it.
        </li>
        <li>
          Add a <strong>channel</strong> for every entry of the list you want to control, named as you like. Its{' '}
          <strong>offset</strong> is its number in the manual minus 1: channel 1 has offset 0, channel 2 offset 1, and
          so on. Leave out the ones you don't need, the gaps are fine.
        </li>
        <li>
          The <strong>Address</strong> column shows where each channel lands. Fixtures sharing addresses get a warning:
          on purpose, e.g. two PARs moving together, or by mistake.
        </li>
      </ol>
      <p className={helpExample}>
        Example: an RGB PAR in 3-channel mode at address 10: Red offset 0 (10), Green offset 1 (11), Blue offset 2 (12).
      </p>
      <p>
        The <strong>hint</strong> is shown below the faders, for what you need while playing, e.g. "warm up 2 min before
        smoke". Use the <strong>description</strong> for anything else worth knowing about the device: the DMX mode, DIP
        switch settings, where it hangs, who it belongs to. It stays hidden until you open it on the fixture.
      </p>
      <p>
        The description is <strong>Markdown</strong>: <code>**bold**</code>, lists starting with <code>-</code>, tables,
        and links like <code>[manual](https://…)</code>, which open in your browser. Only links to web pages (
        <code>http://</code> or <code>https://</code>) can be clicked, any other shows as text. <strong>Preview</strong>{' '}
        shows how it will look.
      </p>
      <p>
        A <strong>preset</strong> is a button on the fixture that sets several channels at once, e.g. "Warm white". The
        channels it leaves unticked stay as they are. To make one quickly, set the faders and press the save button next
        to the presets.
      </p>
      <p>
        No manual? Use the <strong>Channels</strong> tab to move one channel after the other from the device's address
        and watch what it does.
      </p>
    </div>
  </details>
);

export default FixtureHelp;
