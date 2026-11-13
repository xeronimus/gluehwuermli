import {Trans} from '@lingui/react/macro';

import SafetyNotice from '../../src/renderer/src/components/help/topics/SafetyNotice';

/** the app's safety notice, and what Windows says about the installer as long as it isn't signed */
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
  </section>
);

export default SafetyNote;
