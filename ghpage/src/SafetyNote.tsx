import {Trans} from '@lingui/react/macro';

import SafetyNotice from '../../src/renderer/src/components/help/topics/SafetyNotice';

/** the app's safety notice, and what Windows and macOS say about the app as long as it isn't signed */
const SafetyNote = () => (
  <section className="section">
    <h2>
      <Trans>Safety</Trans>
    </h2>
    <SafetyNotice />
    <h3>
      <Trans>Windows SmartScreen</Trans>
    </h3>
    <p>
      <Trans>
        The installer isn't signed yet, so Windows SmartScreen may warn about an unknown publisher. To install it
        anyway, choose <strong>More info</strong>, then <strong>Run anyway</strong>.
      </Trans>
    </p>
    <h3>
      <Trans>macOS Gatekeeper</Trans>
    </h3>
    <p>
      <Trans>
        The Mac app isn't signed by Apple, so macOS refuses to open it the first time. Open{' '}
        <strong>System Settings → Privacy &amp; Security</strong> and choose <strong>Open Anyway</strong> next to the
        message about Glühwürmli, or run <code>xattr -cr "/Applications/gluehwuermli.app"</code> in Terminal. It needs
        macOS 13 Ventura or newer, and it doesn't update itself: download a new version from the releases page.
      </Trans>
    </p>
  </section>
);

export default SafetyNote;
