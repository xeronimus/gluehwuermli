import {Trans} from '@lingui/react/macro';

/** the manual's topic on adding a fixture: its address, channels, colors, notes, order */
const FixturesTopic = () => (
  <>
    <p>
      <Trans>
        A fixture is one device of your rig, e.g. a PAR or a smoke machine. In Setup mode, press{' '}
        <strong>Add fixture</strong> in the <strong>Show</strong> view:
      </Trans>
    </p>
    <ol>
      <li>
        <Trans>
          Set the <strong>start address</strong> to the DMX address set on the device (its display or DIP switches).
        </Trans>
      </li>
      <li>
        <Trans>
          Add a <strong>channel</strong> for every entry of the device's channel list you want to control. Its{' '}
          <strong>offset</strong> is its number in the manual minus 1: channel 1 has offset 0, channel 2 offset 1.
        </Trans>
      </li>
      <li>
        <Trans>
          Optionally, a channel's <strong>color</strong> as a hex value, e.g. ff0000 for red or #7f00ff for UV, or
          picked with a click on the swatch beside the field: its fader is filled with it and glows the brighter the
          higher the value, so the red channel is found at a glance.
        </Trans>
      </li>
      <li>
        <Trans>
          Optionally, a <strong>hint</strong> shown below the faders (e.g. "warm up 2 min before smoke") and a{' '}
          <strong>description</strong> for anything else: the DMX mode, DIP switches, where it hangs. The description is
          Markdown (lists, tables, links to web pages that open in your browser), with a preview in the editor.
        </Trans>
      </li>
    </ol>
    <p>
      <Trans>
        The editor explains each step in its own help. Fixtures sharing addresses get a warning. A click on a fader's
        value raises it by one, a click on its name lowers it by one, a right click on it sets it to its lowest value.
      </Trans>
    </p>
    <p>
      <Trans>
        The fixtures are shown in the order they were added. To arrange them the way your rig is run, use the arrows
        next to a fixture's name in Setup mode: they move it one place to the left or right. The scene buttons have the
        same arrows, and so do the presets and the channels in the fixture editor. Moving a channel only changes where
        its fader is shown, not its address.
      </Trans>
    </p>
  </>
);

export default FixturesTopic;
