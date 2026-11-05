import {Trans} from '@lingui/react/macro';

import EditorHelp from './EditorHelp';

interface SceneHelpProps {
  /** open when adding a scene, where the help is needed most; the user can still toggle it */
  initiallyOpen: boolean;
}

/** how a scene takes its values from the faders: on adding, on editing, with "Save current values" */
const SceneHelp = ({initiallyOpen}: SceneHelpProps) => (
  <EditorHelp title={<Trans>How scenes work</Trans>} initiallyOpen={initiallyOpen}>
    <ol>
      <li>
        <Trans>
          Set the <strong>faders</strong> of the fixtures below to the look you want. They stay usable while this form
          is open; pressing a preset or another scene helps, too.
        </Trans>
      </li>
      <li>
        <Trans>
          Give the scene a <strong>name</strong> and tick the <strong>fixtures</strong> it covers. On{' '}
          <strong>Save</strong>, the current value of every channel of the ticked fixtures is stored.
        </Trans>
      </li>
      <li>
        <Trans>
          Pressing the scene sets these values again. Unticked fixtures are left out and stay as they are, so scenes can
          be layered, e.g. a colour scene for the PARs while the smoke machine keeps running.
        </Trans>
      </li>
    </ol>
    <p>
      <Trans>
        When editing, renaming the scene or ticking and unticking fixtures doesn't change the values already stored:
        only a newly ticked fixture is stored with what its faders show now. <strong>Save current values</strong> stores
        what the faders show now for every ticked fixture, replacing the stored values. To change a scene's look, press
        the scene, adjust the faders, then save it with Save current values.
      </Trans>
    </p>
    <p>
      <Trans>
        Values can't be changed one by one here. A channel added to a fixture later is only stored in a scene once it is
        saved with Save current values; deleting a fixture takes it out of every scene. While the channel lock is on, a
        locked channel only goes up to its maximum, whatever the scene stores.
      </Trans>
    </p>
  </EditorHelp>
);

export default SceneHelp;
