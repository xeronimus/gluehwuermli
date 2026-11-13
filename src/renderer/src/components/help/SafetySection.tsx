import {Trans} from '@lingui/react/macro';

import {message} from './DataFolderSection.css';
import {sideSection} from './HelpView.css';
import SafetyNotice from './topics/SafetyNotice';

/** what the app is made for and what it doesn't promise, the same text as on the landing page */
const SafetySection = () => (
  <section className={sideSection}>
    <h2>
      <Trans>Safety</Trans>
    </h2>
    <SafetyNotice paragraphClassName={message} />
  </section>
);

export default SafetySection;
