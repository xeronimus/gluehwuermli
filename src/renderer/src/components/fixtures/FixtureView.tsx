import {useLingui} from '@lingui/react/macro';

import type {Fixture} from '@shared/ipc';

import {useActionDeleteFixture, useActionMoveFixture} from '@/state/actionHooks/saveFixtures';
import {selectFixtures} from '@/state/fixtures/fixturesSelectors';
import {selectIsSetupMode} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import ChaseEditor from '../chases/ChaseEditor';
import ChaseList from '../chases/ChaseList';
import Button from '../commons/Button';
import {AddFixtureIcon} from '../commons/icons';
import FixtureEditor from './FixtureEditor';
import FixtureGroup from './FixtureGroup';
import FixtureOverlapWarnings from './FixtureOverlapWarnings';
import {addFixture, errorMessage, fixtureGroups, fixtureView} from './FixtureView.css';
import NoFixturesHint from './NoFixturesHint';
import SceneButtons from './SceneButtons';
import SceneEditor from './SceneEditor';
import {NOT_EDITING, useFixtureViewEditing} from './useFixtureViewEditing';

/**
 * the open project's scene buttons, one control group per fixture and the chase rows below them; adding, editing,
 * moving and deleting scenes, fixtures and chases in Setup mode
 */
const FixtureView = () => {
  const {t, i18n} = useLingui();
  const fixtures = useAppStore(selectFixtures);
  const error = useAppStore((state) => state.fixturesError);
  const deleteFixture = useActionDeleteFixture();
  const moveFixture = useActionMoveFixture();
  const setupMode = useAppStore(selectIsSetupMode);
  const [editing, setEditing] = useFixtureViewEditing(setupMode);

  const onDelete = (fixture: Fixture) => {
    const fixtureName = fixture.name;
    if (window.confirm(t`Delete the fixture ${fixtureName}?`)) {
      void deleteFixture(fixture);
    }
  };

  // while editing a fixture, the editor alone: it shows its own shared addresses, the list would only be clutter
  if (editing.type === 'adding' || editing.type === 'editing') {
    return (
      <div className={fixtureView}>
        {error && <span className={errorMessage}>{i18n._(error)}</span>}
        <FixtureEditor
          fixture={editing.type === 'editing' ? editing.fixture : undefined}
          fixtures={fixtures}
          onClose={() => setEditing(NOT_EDITING)}
        />
      </div>
    );
  }

  // one editor at a time; the scene editor works with the setup as it is: editing or deleting fixtures and scenes
  // waits until it closes
  const editingScene = editing.type === 'adding-scene' || editing.type === 'editing-scene';
  const editingChase = editing.type === 'adding-chase' || editing.type === 'editing-chase';
  const editorOpen = editingScene || editingChase;
  const onAddFixture = () => setEditing({type: 'adding'});

  return (
    <div className={fixtureView}>
      {/* the chase editor shows a failed save next to its Save button, below the fixtures */}
      {error && !editingChase && <span className={errorMessage}>{i18n._(error)}</span>}

      <SceneButtons
        onEdit={setupMode ? (scene) => setEditing({type: 'editing-scene', scene}) : undefined}
        onAdd={setupMode ? () => setEditing({type: 'adding-scene'}) : undefined}
        actionsDisabled={editorOpen}
      />

      {/* above the fixtures, not in place of them: the look is set with their faders while the scene is named */}
      {editingScene && (
        <SceneEditor
          key={editing.type === 'editing-scene' ? editing.scene.id : 'new'}
          scene={editing.type === 'editing-scene' ? editing.scene : undefined}
          onClose={() => setEditing(NOT_EDITING)}
        />
      )}

      <FixtureOverlapWarnings />

      {fixtures.length === 0 && (
        <NoFixturesHint onAdd={setupMode ? onAddFixture : undefined} addDisabled={editorOpen} />
      )}

      <div className={fixtureGroups}>
        {fixtures.map((fixture, index) => (
          <FixtureGroup
            key={fixture.id}
            fixture={fixture}
            actions={
              setupMode
                ? {
                    onEdit: () => setEditing({type: 'editing', fixture}),
                    onDelete: () => onDelete(fixture),
                    onMove: (direction) => void moveFixture(fixture, direction),
                    index,
                    count: fixtures.length,
                    disabled: editorOpen
                  }
                : undefined
            }
          />
        ))}
        {/* after the last fixture, at its top: where the new one will be */}
        {setupMode && fixtures.length > 0 && (
          <span className={addFixture}>
            <Button onClick={onAddFixture} disabled={editorOpen} title={t`Add fixture`}>
              <AddFixtureIcon />
            </Button>
          </span>
        )}
      </div>

      <ChaseList
        editing={
          setupMode
            ? {
                onEdit: (chase) => setEditing({type: 'editing-chase', chase}),
                onAdd: () => setEditing({type: 'adding-chase'}),
                disabled: editorOpen
              }
            : undefined
        }
      />

      {editingChase && (
        <ChaseEditor
          key={editing.type === 'editing-chase' ? editing.chase.id : 'new'}
          chase={editing.type === 'editing-chase' ? editing.chase : undefined}
          onClose={() => setEditing(NOT_EDITING)}
        />
      )}
    </div>
  );
};

export default FixtureView;
