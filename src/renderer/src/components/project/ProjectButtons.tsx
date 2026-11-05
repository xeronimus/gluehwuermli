import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {useActionUnlock} from '@/state/actionHooks/lockActions';
import {useActionCreateProject, useActionOpenProject} from '@/state/actionHooks/project';
import {selectIsSetupMode} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import PasswordForm from '../commons/PasswordForm';
import {CreateProjectIcon, OpenProjectIcon} from '../commons/icons';
import {buttonRow} from './Project.css';

interface ProjectButtonsProps {
  /** the start view's main action: Create project stands out */
  emphasizeCreate?: boolean;
}

/**
 * Create project and Open project. Creating needs Setup mode: in Show mode it goes through the usual unlock first (the
 * first one sets the password), then asks for the file. Opening works in Show mode too.
 */
const ProjectButtons = ({emphasizeCreate = false}: ProjectButtonsProps) => {
  const {t} = useLingui();
  const setupMode = useAppStore(selectIsSetupMode);
  const lockStatus = useAppStore((state) => state.lockStatus);
  const unlock = useActionUnlock();
  const createProject = useActionCreateProject();
  const openProject = useActionOpenProject();
  const [unlocking, setUnlocking] = useState(false);

  const unlockAndCreate = async (password: string) => {
    const outcome = await unlock(password);
    if (outcome === 'accepted') {
      void createProject();
    }
    return outcome;
  };

  if (unlocking && lockStatus.mode === 'show') {
    return (
      <PasswordForm
        isNewPassword={!lockStatus.passwordSet}
        submitLabel={lockStatus.passwordSet ? t`Unlock and create` : t`Set password and create`}
        onSubmit={unlockAndCreate}
        onClose={() => setUnlocking(false)}
      />
    );
  }

  return (
    <div className={buttonRow}>
      <Button
        variant={emphasizeCreate ? 'primary' : 'default'}
        onClick={() => (setupMode ? void createProject() : setUnlocking(true))}
        disabled={lockStatus.mode === 'loading'}
      >
        <CreateProjectIcon /> <Trans>Create project</Trans>
      </Button>
      <Button onClick={() => void openProject()}>
        <OpenProjectIcon /> <Trans>Open project</Trans>
      </Button>
    </div>
  );
};

export default ProjectButtons;
