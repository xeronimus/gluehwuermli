import {REPOSITORY_URL} from '@shared/links';

import {ExternalLinkIcon} from '../commons/icons';
import DataFolderSection from './DataFolderSection';
import {helpView, repositoryLink, sideColumn, sideSection} from './HelpView.css';
import UserManual from './UserManual';

/** the user manual, where the app keeps its files, and where it comes from */
const HelpView = () => (
  <div className={helpView}>
    <UserManual />
    <aside className={sideColumn}>
      <DataFolderSection />
      <section className={sideSection}>
        <h2>Source code</h2>
        {/* the main process opens it in the system browser, the window itself never leaves the app */}
        <a className={repositoryLink} href={REPOSITORY_URL} target="_blank" rel="noreferrer">
          <ExternalLinkIcon /> {REPOSITORY_URL}
        </a>
      </section>
    </aside>
  </div>
);

export default HelpView;
