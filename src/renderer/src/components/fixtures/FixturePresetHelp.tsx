import {Trans} from '@lingui/react/macro';

import EditorHelp from './EditorHelp';

interface FixturePresetHelpProps {
  /** open when adding a fixture, where the help is needed most; the user can still toggle it */
  initiallyOpen: boolean;
}

/** what a preset is and how to make one quickly */
const FixturePresetHelp = ({initiallyOpen}: FixturePresetHelpProps) => (
  <EditorHelp title={<Trans>How presets work</Trans>} initiallyOpen={initiallyOpen}>
    <p>
      <Trans>
        A <strong>preset</strong> is a button on the fixture that sets several channels at once, e.g. "Warm white". The
        channels it leaves unticked stay as they are. To make one quickly, set the faders and press the save button next
        to the presets.
      </Trans>
    </p>
  </EditorHelp>
);

export default FixturePresetHelp;
