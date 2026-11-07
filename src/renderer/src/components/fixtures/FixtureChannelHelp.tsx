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
    </ol>
    <p className={helpExample}>
      <Trans>
        Example: an RGB PAR in 3-channel mode at address 10: Red offset 0 (10), Green offset 1 (11), Blue offset 2 (12).
      </Trans>
    </p>
  </EditorHelp>
);

export default FixtureChannelHelp;
