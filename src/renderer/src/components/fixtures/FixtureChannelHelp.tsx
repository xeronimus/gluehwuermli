import {Trans} from '@lingui/react/macro';

import EditorHelp from './EditorHelp';
import {helpExample} from './EditorHelp.css';

interface FixtureChannelHelpProps {
  /** open when adding a fixture, where the help is needed most; the user can still toggle it */
  initiallyOpen: boolean;
}

/** how the entries of a device's channel list become the fixture's channels: names, offsets, addresses */
const FixtureChannelHelp = ({initiallyOpen}: FixtureChannelHelpProps) => (
  <EditorHelp title={<Trans>How to set up the channels</Trans>} initiallyOpen={initiallyOpen}>
    <ol>
      <li>
        <Trans>
          Add a <strong>channel</strong> for every entry of the list you want to control, named as you like. Its{' '}
          <strong>offset</strong> is its number in the manual minus 1: channel 1 has offset 0, channel 2 offset 1, and
          so on. Leave out the ones you don't need, the gaps are fine.
        </Trans>
      </li>
      <li>
        <Trans>
          The <strong>Address</strong> column shows where each channel lands. Fixtures sharing addresses get a warning:
          on purpose, e.g. two PARs moving together, or by mistake.
        </Trans>
      </li>
      <li>
        <Trans>
          The arrows move a channel up or down: the fixture's faders are shown in the order of this list. Its offset and
          address stay as they are, and its presets and scenes keep setting it.
        </Trans>
      </li>
    </ol>
    <p>
      <Trans>
        <strong>Values</strong> sets where the fader stops. <strong>Continuous</strong> goes through every value from
        min to max, e.g. a dimmer that does nothing below 100. <strong>Steps</strong> goes from min to max by the step
        size, e.g. a strobe in steps of 10. <strong>Positions</strong> stops only at the values listed, each with an
        optional name, e.g. the slots of a gobo wheel at 5, 6 and 200: the fader shows a tick for each (its name on
        mouse over), and a preset picks one of them. Only the fixture's faders follow these, the Channels view sends any
        value.
      </Trans>
    </p>
    <p className={helpExample}>
      <Trans>
        Example: an RGB PAR in 3-channel mode at address 10: Red offset 0 (10), Green offset 1 (11), Blue offset 2 (12).
      </Trans>
    </p>
  </EditorHelp>
);

export default FixtureChannelHelp;
