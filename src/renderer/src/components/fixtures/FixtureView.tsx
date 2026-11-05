import {useEffect, useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import type {Fixture, Scene} from '@shared/ipc';

import {overlapMessage} from '@/i18n/messages/fixtureMessages';
import {useActionLoadFixtures} from '@/state/actionHooks/loadFixtures';
import {useActionDeleteFixture} from '@/state/actionHooks/saveFixtures';
import {selectFixtureOverlaps, selectFixtures} from '@/state/fixtures/fixturesSelectors';
import {selectIsSetupMode} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {AddFixtureIcon, AddSceneIcon, WarningIcon} from '../commons/icons';
import FixtureEditor from './FixtureEditor';
import FixtureGroup from './FixtureGroup';
import {errorMessage, fixtureGroups, fixtureView, footer, message, warnings} from './FixtureView.css';
import SceneButtons from './SceneButtons';
import SceneEditor from './SceneEditor';

type Editing =
  | {type: 'none'}
  | {type: 'adding'}
  | {type: 'editing'; fixture: Fixture}
  | {type: 'adding-scene'}
  | {type: 'editing-scene'; scene: Scene};

const NOT_EDITING: Editing = {type: 'none'};

/** the scene buttons and one control group per fixture, and adding, editing and deleting both in Setup mode */
const FixtureView = () => {
  const {t, i18n} = useLingui();
  const fixtureSetup = useAppStore((state) => state.fixtureSetup);
  const fixtures = useAppStore(selectFixtures);
  const overlaps = useAppStore(selectFixtureOverlaps);
  const error = useAppStore((state) => state.fixturesError);
  const loadFixtures = useActionLoadFixtures();
  const deleteFixture = useActionDeleteFixture();
  const setupMode = useAppStore(selectIsSetupMode);
  const [editing, setEditing] = useState<Editing>(NOT_EDITING);

  // locking (the Lock button, being idle) drops an unsaved edit (set during render, React re-renders right away)
  if (editing.type !== 'none' && !setupMode) {
    setEditing(NOT_EDITING);
  }

  // the stored setup is external state: load it once, not again every time the tab is shown
  useEffect(() => {
    if (useAppStore.getState().fixtureSetup.type === 'loading') {
      void loadFixtures();
    }
  }, []);

  if (fixtureSetup.type === 'loading') {
    return (
      <span className={message}>
        <Trans>Loading the fixtures…</Trans>
      </span>
    );
  }
  if (fixtureSetup.type === 'failed') {
    return (
      <div className={fixtureView}>
        <span className={errorMessage}>{i18n._(fixtureSetup.message)}</span>
        <Button onClick={() => void loadFixtures()}>
          <Trans>Try again</Trans>
        </Button>
      </div>
    );
  }

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

  // the scene editor works with the setup as it is: editing or deleting fixtures and scenes waits until it closes
  const editingScene = editing.type === 'adding-scene' || editing.type === 'editing-scene';

  return (
    <div className={fixtureView}>
      {error && <span className={errorMessage}>{i18n._(error)}</span>}

      <SceneButtons
        onEdit={setupMode ? (scene) => setEditing({type: 'editing-scene', scene}) : undefined}
        actionsDisabled={editingScene}
      />

      {/* above the fixtures, not in place of them: the look is set with their faders while the scene is named */}
      {editingScene && (
        <SceneEditor
          key={editing.type === 'editing-scene' ? editing.scene.id : 'new'}
          scene={editing.type === 'editing-scene' ? editing.scene : undefined}
          onClose={() => setEditing(NOT_EDITING)}
        />
      )}

      {overlaps.length > 0 && (
        <ul className={warnings}>
          {overlaps.map((overlap) => (
            <li key={`${overlap.first.id}-${overlap.second.id}`}>
              <WarningIcon /> {i18n._(overlapMessage(overlap))}
            </li>
          ))}
        </ul>
      )}

      {fixtures.length === 0 && (
        <span className={message}>
          <Trans>
            No fixtures yet: unlock Setup mode in Settings and add the devices of your rig with Add fixture, to control
            them by name.
          </Trans>
        </span>
      )}

      <div className={fixtureGroups}>
        {fixtures.map((fixture) => (
          <FixtureGroup
            key={fixture.id}
            fixture={fixture}
            actions={
              setupMode
                ? {
                    onEdit: () => setEditing({type: 'editing', fixture}),
                    onDelete: () => onDelete(fixture),
                    disabled: editingScene
                  }
                : undefined
            }
          />
        ))}
      </div>

      {/* rarely needed once the rig is set up: out of the way, below the fixtures */}
      {setupMode && editing.type === 'none' && (
        <div className={footer}>
          <Button onClick={() => setEditing({type: 'adding-scene'})} disabled={fixtures.length === 0}>
            <AddSceneIcon /> <Trans>Add scene</Trans>
          </Button>
          <Button onClick={() => setEditing({type: 'adding'})}>
            <AddFixtureIcon /> <Trans>Add fixture</Trans>
          </Button>
        </div>
      )}
    </div>
  );
};

export default FixtureView;
