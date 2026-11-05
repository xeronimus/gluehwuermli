import {Trans} from '@lingui/react/macro';

import {useAppStore} from '@/state/store';

import {message, projectHeading, projectStartView} from './Project.css';
import ProjectButtons from './ProjectButtons';
import ProjectFailureMessage from './ProjectFailureMessage';
import RecentProjectList from './RecentProjectList';

/**
 * The Show view without a project: on the first start, or when the last project couldn't be opened (then it says
 * which file and why). Fixtures and scenes live in a project, so nothing can be added before there is one.
 */
const ProjectStartView = () => {
  const project = useAppStore((state) => state.project);
  const projectError = useAppStore((state) => state.projectError);

  return (
    <div className={projectStartView}>
      <h2 className={projectHeading}>
        <Trans>No project open</Trans>
      </h2>
      {project.type === 'failed' && (
        <ProjectFailureMessage failure={{type: 'file', path: project.path, error: project.error}} />
      )}
      <p className={message}>
        <Trans>
          A project is a .glp file with the fixtures and scenes of one rig, e.g. one per venue or show. Keep it wherever
          you like: in Documents, on the Desktop or on a USB stick. Every change is saved to the file right away. The
          app opens the last project again on its next start, and a double-click on a .glp file opens it.
        </Trans>
      </p>
      <ProjectButtons emphasizeCreate />
      {projectError && <ProjectFailureMessage failure={projectError} />}
      <RecentProjectList />
    </div>
  );
};

export default ProjectStartView;
