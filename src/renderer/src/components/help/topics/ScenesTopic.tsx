import {Trans} from '@lingui/react/macro';

/** the manual's topic on buttons setting the channels of several fixtures */
const ScenesTopic = () => (
  <>
    <p>
      <Trans>
        A scene is a button above the fixtures that sets the channels of several fixtures at once, e.g. "Intro" or
        "Blackout". The fixtures a scene leaves out stay as they are, so scenes can be layered: a colour scene for the
        PARs while the smoke machine keeps running.
      </Trans>
    </p>
    <p>
      <Trans>
        To make one, unlock Setup mode, set the faders to the look you want, press the <strong>Add scene</strong> button
        after the scenes, name it and choose its fixtures: their current values are stored. The edit button next to a
        scene renames it, gives it a color (a dot on its button) or changes its fixtures; check{' '}
        <strong>Save current values</strong> to store what the faders show now. Deleting a fixture takes it out of every
        scene.
      </Trans>
    </p>
  </>
);

export default ScenesTopic;
