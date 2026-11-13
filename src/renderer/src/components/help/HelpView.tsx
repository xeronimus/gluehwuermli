import {Trans} from '@lingui/react/macro';

import {REPOSITORY_URL} from '@shared/links';

import {ExternalLinkIcon} from '../commons/icons';
import DataFolderSection from './DataFolderSection';
import {helpView, repositoryLink, sideColumn, sideSection} from './HelpView.css';
import ProjectInfoSection from './ProjectInfoSection';
import SafetySection from './SafetySection';
import UserManual from './UserManual';

/**
 * the manual, a tab per topic, what the app is not made for, the open project's file, where the app keeps its
 * settings, and where it comes from
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
          <Trans>Source code</Trans>
        </h2>
        {/* the main process opens it in the system browser, the window itself never leaves the app */}
        <a className={repositoryLink} href={REPOSITORY_URL} target="_blank" rel="noreferrer">
          <ExternalLinkIcon /> {REPOSITORY_URL}
        </a>
      </section>
    </aside>
  </div>
);

export default HelpView;
