import {Trans} from '@lingui/react/macro';

import LocaleSwitch from './LocaleSwitch';
import {settingsSection} from './SettingsView.css';

/** the language of the UI; no password needed, also in Show mode */
const LanguageSection = () => (
  <section className={settingsSection}>
    <h2>
      <Trans>Language</Trans>
    </h2>
    <LocaleSwitch />
  </section>
);

export default LanguageSection;
