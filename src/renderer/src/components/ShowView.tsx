import {Trans, useLingui} from '@lingui/react/macro';

import {useAppStore} from '@/state/store';

import {message} from './ShowView.css';
import FixtureView from './fixtures/FixtureView';
import ProjectStartView from './project/ProjectStartView';

/**
 * The Show view: the open project's scenes and fixtures, or the start view without one. A new FixtureView per project
 * opened, so no editor of the project before stays open.
 */
const ShowView = () => {
  const {i18n} = useLingui();
  const project = useAppStore((state) => state.project);
  const projectSwitches = useAppStore((state) => state.projectSwitches);

  switch (project.type) {
    case 'loading':
      return (
        <span className={message}>
          <Trans>Opening the project…</Trans>
        </span>
      );
    case 'unreachable':
      return <span className={message}>{i18n._(project.message)}</span>;
    case 'none':
    case 'failed':
      return <ProjectStartView />;
    case 'open':
      return <FixtureView key={projectSwitches} />;
  }
};

export default ShowView;
