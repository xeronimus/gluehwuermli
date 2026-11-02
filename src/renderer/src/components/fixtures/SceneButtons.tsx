import {useLingui} from '@lingui/react/macro';

import type {Scene} from '@shared/ipc';

import {isSceneCapped} from '@/data/channelLocks';
import {useActionApplyScene} from '@/state/actionHooks/applyScene';
import {useActionDeleteScene} from '@/state/actionHooks/saveFixtures';
import {selectFixtures, selectScenes} from '@/state/fixtures/fixturesSelectors';
import {selectChannelLimits} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {DeleteIcon, EditIcon, LockIcon, SceneIcon} from '../commons/icons';
import {sceneButtons, sceneEntry} from './SceneButtons.css';

interface SceneButtonsProps {
  /** undefined in Show mode: scenes can be played, not changed */
  onEdit: ((scene: Scene) => void) | undefined;
}

/**
 * A button per scene, setting the channels of its fixtures at once. In Setup mode each comes with an edit and a delete
 * button. A scene touching a channel above its cap stays playable (the channel goes up to its cap) and shows the lock.
 */
const SceneButtons = ({onEdit}: SceneButtonsProps) => {
  const {t} = useLingui();
  const scenes = useAppStore(selectScenes);
  const fixtures = useAppStore(selectFixtures);
  const limits = useAppStore(selectChannelLimits);
  const applyScene = useActionApplyScene();
  const deleteScene = useActionDeleteScene();

  if (scenes.length === 0) {
    return null;
  }

  const onDelete = (scene: Scene) => {
    const sceneName = scene.name;
    if (window.confirm(t`Delete the scene ${sceneName}?`)) {
      void deleteScene(scene);
    }
  };

  return (
    <div className={sceneButtons} role="group" aria-label={t`Scenes`}>
      {scenes.map((scene) => {
        const sceneName = scene.name;
        const capped = isSceneCapped(scene, fixtures, limits);
        const button = (
          <Button
            key={scene.id}
            onClick={() => applyScene(scene)}
            title={
              capped
                ? t`Apply the scene ${sceneName}; locked channels go only up to their cap`
                : t`Apply the scene ${sceneName}`
            }
          >
            <SceneIcon />
            {scene.name}
            {capped && <LockIcon />}
          </Button>
        );
        if (!onEdit) {
          return button;
        }
        return (
          <span key={scene.id} className={sceneEntry}>
            {button}
            <Button variant="icon" onClick={() => onEdit(scene)} title={t`Edit the scene ${sceneName}`}>
              <EditIcon />
            </Button>
            <Button variant="icon" onClick={() => onDelete(scene)} title={t`Delete the scene ${sceneName}`}>
              <DeleteIcon />
            </Button>
          </span>
        );
      })}
    </div>
  );
};

export default SceneButtons;
