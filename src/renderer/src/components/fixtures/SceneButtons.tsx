import {useLingui} from '@lingui/react/macro';

import type {Scene} from '@shared/ipc';

import {sceneExceedsLimits} from '@/data/channelLocks';
import {useActionApplyScene} from '@/state/actionHooks/applyScene';
import {useActionDeleteScene, useActionMoveScene} from '@/state/actionHooks/saveFixtures';
import {selectFixtures, selectScenes} from '@/state/fixtures/fixturesSelectors';
import {selectChannelLimits, selectLiftedChannelLimits} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import MoveButtons from '../commons/MoveButtons';
import {DeleteIcon, EditIcon, LockIcon, SceneIcon} from '../commons/icons';
import {sceneButtons, sceneEntry} from './SceneButtons.css';

interface SceneButtonsProps {
  /** undefined in Show mode: scenes can be played, not changed */
  onEdit: ((scene: Scene) => void) | undefined;
  /** while a scene is being edited: no other edit, and the scene being edited can't be deleted under the editor */
  actionsDisabled: boolean;
}

/**
 * A button per scene, setting the channels of its fixtures at once. In Setup mode each comes with move, edit and delete
 * buttons. A scene touching a channel above its cap stays playable (the channel goes up to its cap) and shows the lock.
 */
const SceneButtons = ({onEdit, actionsDisabled}: SceneButtonsProps) => {
  const {t} = useLingui();
  const scenes = useAppStore(selectScenes);
  const fixtures = useAppStore(selectFixtures);
  const limits = useAppStore(selectChannelLimits);
  const lifted = useAppStore(selectLiftedChannelLimits);
  const applyScene = useActionApplyScene();
  const deleteScene = useActionDeleteScene();
  const moveScene = useActionMoveScene();

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
      {scenes.map((scene, index) => {
        const sceneName = scene.name;
        const capped = sceneExceedsLimits(scene, fixtures, limits);
        const capLifted = sceneExceedsLimits(scene, fixtures, lifted);
        const button = (
          <Button
            key={scene.id}
            onClick={() => applyScene(scene)}
            variant={capLifted ? 'capLifted' : 'default'}
            title={
              capped
                ? t`Apply the scene ${sceneName}; locked channels go only up to their cap`
                : capLifted
                  ? t`Apply the scene ${sceneName}; it sets a channel above its cap, the channel lock is lifted`
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
            <MoveButtons
              index={index}
              count={scenes.length}
              onMove={(direction) => void moveScene(scene, direction)}
              disabled={actionsDisabled}
              titles={{
                earlier: t`Move the scene ${sceneName} to the left`,
                later: t`Move the scene ${sceneName} to the right`
              }}
            />
            <Button
              variant="icon"
              onClick={() => onEdit(scene)}
              disabled={actionsDisabled}
              title={t`Edit the scene ${sceneName}`}
            >
              <EditIcon />
            </Button>
            <Button
              variant="icon"
              onClick={() => onDelete(scene)}
              disabled={actionsDisabled}
              title={t`Delete the scene ${sceneName}`}
            >
              <DeleteIcon />
            </Button>
          </span>
        );
      })}
    </div>
  );
};

export default SceneButtons;
