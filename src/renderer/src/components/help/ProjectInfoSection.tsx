import {Trans, useLingui} from '@lingui/react/macro';

import {projectNameOf} from '@shared/projects';

import {selectOpenProject} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import {folderPath, message} from './DataFolderSection.css';
import {sideSection} from './HelpView.css';

/** which project file is open: to back it up, or to find it again on another computer */
const ProjectInfoSection = () => {
  const {t} = useLingui();
  const openProject = useAppStore(selectOpenProject);

  return (
    <section className={sideSection}>
      <h2>
        <Trans>Project</Trans>
      </h2>
      {openProject ? (
        <>
          <p className={message}>
            <Trans>
              The fixtures and scenes are stored in this file. Copy it to back up the project or to take it to another
              computer.
            </Trans>
          </p>
          <strong>{projectNameOf(openProject.path)}</strong>
          <input
            className={folderPath}
            readOnly
            value={openProject.path}
            aria-label={t`Project file`}
            onFocus={(event) => event.currentTarget.select()}
          />
        </>
      ) : (
        <p className={message}>
          <Trans>No project open. Create or open one in the Show view or in Settings.</Trans>
        </p>
      )}
    </section>
  );
};

export default ProjectInfoSection;
