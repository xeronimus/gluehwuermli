import {useEffect} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {projectNameOf} from '@shared/projects';

import {recentProjectsBesides} from '@/data/recentProjects';
import {
  useActionLoadRecentProjects,
  useActionOpenRecentProject,
  useActionRemoveRecentProject
} from '@/state/actionHooks/project';
import {selectOpenProject} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {MissingProjectIcon, ProjectIcon, RemoveIcon} from '../commons/icons';
import {message, missingMarker, projectPath, recentEntry, recentLabel, recentList} from './Project.css';

/**
 * the projects opened before, besides the open one; a file that is gone is marked and can be removed from the list.
 * A missing one can still be tried: a USB stick plugged in later brings it back, opening it says if it is still gone
 */
const RecentProjectList = () => {
  const {t} = useLingui();
  const recentProjects = useAppStore((state) => state.recentProjects);
  const openPath = useAppStore((state) => selectOpenProject(state)?.path);
  const loadRecentProjects = useActionLoadRecentProjects();
  const openRecentProject = useActionOpenRecentProject();
  const removeRecentProject = useActionRemoveRecentProject();
  const shown = recentProjectsBesides(recentProjects, openPath);

  // the files on disk are external state: checked again when the list is shown and when the user comes back to the app
  useEffect(() => {
    const reload = () => void loadRecentProjects();
    reload();
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, [loadRecentProjects]);

  if (shown.length === 0) {
    return null;
  }

  return (
    <>
      <span className={message}>
        <Trans>Recent projects</Trans>
      </span>
      <ul className={recentList}>
        {shown.map(({path, exists}) => {
          const projectName = projectNameOf(path);
          return (
            <li key={path} className={recentEntry}>
              <Button onClick={() => void openRecentProject(path)}>
                {exists ? <ProjectIcon /> : <MissingProjectIcon />}
                <span className={recentLabel}>
                  <span>
                    {projectName}{' '}
                    {!exists && (
                      <span className={missingMarker}>
                        <Trans>missing</Trans>
                      </span>
                    )}
                  </span>
                  <span className={projectPath}>{path}</span>
                </span>
              </Button>
              <Button
                variant="icon"
                onClick={() => void removeRecentProject(path)}
                title={t`Remove ${projectName} from the list (the file stays)`}
              >
                <RemoveIcon />
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default RecentProjectList;
