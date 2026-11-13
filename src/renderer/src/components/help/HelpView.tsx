import {Trans} from '@lingui/react/macro';

import {LANDING_PAGE_URL, REPOSITORY_URL} from '@shared/links';

import {ExternalLinkIcon} from '../commons/icons';
import DataFolderSection from './DataFolderSection';
import {message} from './DataFolderSection.css';
import {externalLink, helpView, sideColumn, sideSection} from './HelpView.css';
import ProjectInfoSection from './ProjectInfoSection';
import SafetySection from './SafetySection';
import UserManual from './UserManual';

/**
 * the manual, a tab per topic, what the app is not made for, the open project's file, where the app keeps its
 * settings, its website and where it comes from. The main process opens the links in the system browser, the window
 * itself never leaves the app
 */
const HelpView = () => (
  <div className={helpView}>
    <UserManual />
    <aside className={sideColumn}>
      <SafetySection />
      <ProjectInfoSection />
      <DataFolderSection />
      <section className={sideSection}>
        <h2>
          <Trans>Website</Trans>
        </h2>
        <p className={message}>
          <Trans>Downloads of new versions, and this manual to read in the browser.</Trans>
        </p>
        <a className={externalLink} href={LANDING_PAGE_URL} target="_blank" rel="noreferrer">
          <ExternalLinkIcon /> {LANDING_PAGE_URL}
        </a>
      </section>
      <section className={sideSection}>
        <h2>
          <Trans>Source code</Trans>
        </h2>
        <a className={externalLink} href={REPOSITORY_URL} target="_blank" rel="noreferrer">
          <ExternalLinkIcon /> {REPOSITORY_URL}
        </a>
      </section>
    </aside>
  </div>
);

export default HelpView;
