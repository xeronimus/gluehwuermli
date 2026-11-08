import {useEffect, useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import type {Fixture, Scene} from '@shared/ipc';

import {overlapMessage} from '@/i18n/messages/fixtureMessages';
import {useActionDeleteFixture, useActionMoveFixture} from '@/state/actionHooks/saveFixtures';
import {selectFixtureOverlaps, selectFixtures} from '@/state/fixtures/fixturesSelectors';
import {selectIsSetupMode} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {AddFixtureIcon, WarningIcon} from '../commons/icons';
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

/**
 * the open project's scene buttons and one control group per fixture; adding, editing, moving and deleting both in
 * Setup mode
 */
const FixtureView = () => {
  const {t, i18n} = useLingui();
  const fixtures = useAppStore(selectFixtures);
  const overlaps = useAppStore(selectFixtureOverlaps);
  const error = useAppStore((state) => state.fixturesError);
  const deleteFixture = useActionDeleteFixture();
  const moveFixture = useActionMoveFixture();
  const setupMode = useAppStore(selectIsSetupMode);
  const setHasOpenDraft = useAppStore((state) => state.setHasOpenDraft);
  const [editing, setEditing] = useState<Editing>(NOT_EDITING);
  const hasOpenDraft = editing.type !== 'none';

  // locking (the Lock button, being idle) drops an unsaved edit (set during render, React re-renders right away)
  if (editing.type !== 'none' && !setupMode) {
    setEditing(NOT_EDITING);
  }

  // a double-clicked .glp asks before it drops the draft; the main process pushes that request outside React
  useEffect(() => {
    setHasOpenDraft(hasOpenDraft);
    return () => setHasOpenDraft(false);
  }, [hasOpenDraft, setHasOpenDraft]);

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
        onAdd={setupMode ? () => setEditing({type: 'adding-scene'}) : undefined}
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
          {/* in Setup mode the Add fixture button is right below, there is nothing to unlock */}
          {setupMode ? (
            <Trans>No fixtures yet: add the devices of your rig with Add fixture below, to control them by name.</Trans>
          ) : (
            <Trans>
              No fixtures yet: unlock Setup mode in Settings and add the devices of your rig with Add fixture, to
              control them by name.
            </Trans>
          )}
        </span>
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
          <Button onClick={() => setEditing({type: 'adding'})}>
            <AddFixtureIcon /> <Trans>Add fixture</Trans>
          </Button>
        </div>
      )}
    </div>
  );
};

export default FixtureView;
