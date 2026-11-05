import {Trans} from '@lingui/react/macro';

import {projectNameOf} from '@shared/projects';

import {selectOpenProject} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import {ProjectIcon} from '../commons/icons';
import {currentProject, message, projectPath} from './Project.css';
import ProjectButtons from './ProjectButtons';
import ProjectFailureMessage from './ProjectFailureMessage';
import RecentProjectList from './RecentProjectList';

interface ProjectSectionProps {
  /** the section box of the view it is shown in */
  className: string;
}

/** the Settings view's project box: which project is open, and switching to another one or a new one */
const ProjectSection = ({className}: ProjectSectionProps) => {
  const openProject = useAppStore(selectOpenProject);
  const projectError = useAppStore((state) => state.projectError);

  return (
    <section className={className}>
      <h2>
        <Trans>Project</Trans>
      </h2>
      {openProject ? (
        <>
          <span className={currentProject}>
            <ProjectIcon /> {projectNameOf(openProject.path)}
          </span>
          <span className={projectPath}>{openProject.path}</span>
        </>
      ) : (
        <span className={message}>
          <Trans>No project open</Trans>
        </span>
      )}
      <p className={message}>
        <Trans>
          Every change to the fixtures and scenes is saved to the project file right away. Opening another project sets
          all channels to 0 first.
        </Trans>
      </p>
      <ProjectButtons />
      {projectError && <ProjectFailureMessage failure={projectError} />}
      <RecentProjectList />
    </section>
  );
};

export default ProjectSection;
