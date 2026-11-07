import {Trans} from '@lingui/react/macro';

import EditorHelp from './EditorHelp';

interface FixtureGeneralHelpProps {
  /** open when adding a fixture, where the help is needed most; the user can still toggle it */
  initiallyOpen: boolean;
}

/** how to turn a device's manual into a fixture: its DMX mode, its start address, the hint and the description */
const FixtureGeneralHelp = ({initiallyOpen}: FixtureGeneralHelpProps) => (
  <EditorHelp title={<Trans>How to set up a fixture</Trans>} initiallyOpen={initiallyOpen}>
    <ol>
      <li>
        <Trans>
          Look up the <strong>channel list</strong> (often called DMX chart or DMX mode) in the device's manual. Many
          devices have several modes, e.g. 3 or 7 channels: pick one and set the device to it.
        </Trans>
      </li>
      <li>
        <Trans>
          Set the <strong>start address</strong> to the DMX address set on the device (its display or DIP switches). The
          device listens there and on the addresses after it.
        </Trans>
      </li>
    </ol>
    <p>
      <Trans>
        The <strong>hint</strong> is shown below the faders, for what you need while playing, e.g. "warm up 2 min before
        smoke". Use the <strong>description</strong> for anything else worth knowing about the device: the DMX mode, DIP
        switch settings, where it hangs, who it belongs to. It stays hidden until you open it on the fixture.
      </Trans>
    </p>
    <p>
      <Trans>
        The description is <strong>Markdown</strong>: <code>**bold**</code>, lists starting with <code>-</code>, tables,
        and links like <code>[manual](https://…)</code>, which open in your browser. Only links to web pages (
        <code>http://</code> or <code>https://</code>) can be clicked, any other shows as text. <strong>Preview</strong>{' '}
        shows how it will look.
      </Trans>
    </p>
    <p>
      <Trans>
        No manual? Use the <strong>Channels</strong> tab to move one channel after the other from the device's address
        and watch what it does.
      </Trans>
    </p>
  </EditorHelp>
);

export default FixtureGeneralHelp;
