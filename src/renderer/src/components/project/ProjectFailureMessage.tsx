import {Trans, useLingui} from '@lingui/react/macro';

import {projectErrorMessage} from '@/i18n/messages/projectMessages';
import type {ProjectFailure} from '@/state/fixtures/FixturesState';

import {errorMessage, projectPath} from './Project.css';

interface ProjectFailureMessageProps {
  failure: ProjectFailure;
}

/** a file that couldn't be opened or created, with its path; or a call to the main process that failed */
const ProjectFailureMessage = ({failure}: ProjectFailureMessageProps) => {
  const {i18n} = useLingui();

  if (failure.type === 'call') {
    return <p className={errorMessage}>{i18n._(failure.message)}</p>;
  }
  const {path} = failure;
  return (
    <p className={errorMessage}>
      <Trans>
        Could not open <span className={projectPath}>{path}</span>:
      </Trans>{' '}
      {i18n._(projectErrorMessage(failure.error))}
    </p>
  );
};

export default ProjectFailureMessage;
