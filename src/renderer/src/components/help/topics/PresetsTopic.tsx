import {Trans} from '@lingui/react/macro';

/** the manual's topic on a fixture's buttons setting several of its channels */
const PresetsTopic = () => (
  <p>
    <Trans>
      A preset is a button on a fixture that sets several of its channels at once, e.g. "Warm white". To make one, set
      the fixture's faders and press the save button next to its presets. Edit the fixture to rename a preset, give it a
      color (a dot on its button) or choose which channels it sets: the ones it leaves out stay as they are.
    </Trans>
  </p>
);

export default PresetsTopic;
