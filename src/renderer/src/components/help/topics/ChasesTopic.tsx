import {Trans} from '@lingui/react/macro';

/** the manual's topic on steps played one after the other: playing, hold vs. pause, what stops a chase, making one */
const ChasesTopic = () => (
  <>
    <p>
      <Trans>
        A chase plays <strong>steps</strong> one after the other, e.g. a laser and a strobe taking turns. Each step sets
        some channels and <strong>holds</strong> for its time, then the next one follows. After the last step, the chase
        ends, plays again or loops until stopped, as its repeat says: <strong>1×</strong>, <strong>8×</strong> or{' '}
        <strong>∞</strong> at the end of its row. The chases are listed below the fixtures, one row each.
      </Trans>
    </p>
    <p>
      <Trans>
        The play button of a row starts its chase at the first step, in Show and in Setup mode. One chase plays at a
        time: starting another one stops the one playing. Its row is highlighted, the current step filled, and the pass
        is counted. <strong>Pause</strong> keeps the current step. The hold is part of the chase, the pause is pressed
        live: a paused chase doesn't count down its hold, and <strong>Resume</strong> continues the step with the time
        that was left. <strong>Stop</strong> ends the chase. The app always starts with no chase playing.
      </Trans>
    </p>
    <p>
      <Trans>
        A step only sets the channels it names; all others stay as they are. The faders stay live while a chase plays: a
        channel moved by hand keeps its value until a step sets it again. After Stop, and when a chase ends, the
        channels keep the values the last step left; press <strong>Emergency off</strong> to black out. The channel lock
        caps a chase's values like a fader's.
      </Trans>
    </p>
    <p>
      <Trans>
        A chase stops by itself on Emergency off (before the blackout), when another project is opened or created, when
        the app is closed, and when the playing chase is changed or deleted in Setup mode. It keeps playing when Setup
        mode is locked, when the channel lock is turned on or off, and while the interface is disconnected: its steps go
        out again once it is connected.
      </Trans>
    </p>
    <p>
      <Trans>
        To make one, unlock Setup mode and press <strong>Add chase</strong> below the rows. The chase editor sets the
        name, the repeat and the steps, a tab each with its <strong>Hold</strong> in seconds and the channels it sets,
        in a table grouped by the fixtures on those addresses. <strong>Add channel</strong> adds one by hand. The{' '}
        <strong>Fill from</strong> panel beside it takes the current values of a fixture or of all, a scene or a preset
        in one click and merges them into the step: a channel the step already sets takes the new value, the others are
        added. Hovering a button marks the rows it would change. A step stores only channels and values, so changing a
        fixture, scene or preset later doesn't change the chase. The buttons next to a chase edit, delete and move it.
      </Trans>
    </p>
    <p>
      <Trans>
        <strong>Preview on rig</strong> in the chase editor sends the shown step to the output while it is edited: when
        it is turned on, when another step is chosen and on every change, capped by the channel lock like a fader. A
        chase playing is stopped when it is turned on. Start, Resume, Emergency off and closing the editor turn it off;
        the channels keep the values last sent. A fader moved meanwhile keeps its value until the step changes again.
      </Trans>
    </p>
    <p>
      <Trans>
        The arrows left of the step tabs choose the previous or the next step, like a tab, whether Preview on rig is on
        or off.
      </Trans>
    </p>
  </>
);

export default ChasesTopic;
