import {useEffect, useState} from 'react';

import type {Fixture} from '@shared/ipc';

import {describeOverlap} from '@/data/fixtureOverlaps';
import {useActionLoadFixtures} from '@/state/actionHooks/loadFixtures';
import {useActionDeleteFixture} from '@/state/actionHooks/saveFixtures';
import {selectFixtureOverlaps, selectFixtures} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {AddIcon, WarningIcon} from '../commons/icons';
import FixtureEditor from './FixtureEditor';
import FixtureGroup from './FixtureGroup';
import {errorMessage, fixtureGroups, fixtureView, footer, message, warnings} from './FixtureView.css';

type Editing = {type: 'none'} | {type: 'adding'} | {type: 'editing'; fixture: Fixture};

const NOT_EDITING: Editing = {type: 'none'};

/** one control group per fixture, and adding, editing and deleting them */
const FixtureView = () => {
  const fixtureSetup = useAppStore((state) => state.fixtureSetup);
  const fixtures = useAppStore(selectFixtures);
  const overlaps = useAppStore(selectFixtureOverlaps);
  const error = useAppStore((state) => state.fixturesError);
  const loadFixtures = useActionLoadFixtures();
  const deleteFixture = useActionDeleteFixture();
  const [editing, setEditing] = useState<Editing>(NOT_EDITING);

  // the stored setup is external state: load it once, not again every time the tab is shown
  useEffect(() => {
    if (useAppStore.getState().fixtureSetup.type === 'loading') {
      void loadFixtures();
    }
  }, []);

  if (fixtureSetup.type === 'loading') {
    return <span className={message}>Loading the fixtures…</span>;
  }
  if (fixtureSetup.type === 'failed') {
    return <span className={errorMessage}>{fixtureSetup.message}</span>;
  }

  const onDelete = (fixture: Fixture) => {
    if (window.confirm(`Delete the fixture ${fixture.name}?`)) {
      void deleteFixture(fixture);
    }
  };

  return (
    <div className={fixtureView}>
      {error && <span className={errorMessage}>{error}</span>}

      {editing.type !== 'none' && (
        <FixtureEditor
          key={editing.type === 'editing' ? editing.fixture.id : 'new'}
          fixture={editing.type === 'editing' ? editing.fixture : undefined}
          fixtures={fixtures}
          onClose={() => setEditing(NOT_EDITING)}
        />
      )}

      {overlaps.length > 0 && (
        <ul className={warnings}>
          {overlaps.map((overlap) => (
            <li key={`${overlap.first.id}-${overlap.second.id}`}>
              <WarningIcon /> {describeOverlap(overlap)}
            </li>
          ))}
        </ul>
      )}

      {fixtures.length === 0 && editing.type === 'none' && (
        <span className={message}>
          No fixtures yet: add the devices of your rig with Add fixture, to control them by name.
        </span>
      )}

      <div className={fixtureGroups}>
        {fixtures.map((fixture) => (
          <FixtureGroup
            key={fixture.id}
            fixture={fixture}
            onEdit={() => setEditing({type: 'editing', fixture})}
            onDelete={() => onDelete(fixture)}
          />
        ))}
      </div>

      {/* rarely needed once the rig is set up: out of the way, below the fixtures */}
      <div className={footer}>
        <Button onClick={() => setEditing({type: 'adding'})} disabled={editing.type !== 'none'}>
          <AddIcon /> Add fixture
        </Button>
      </div>
    </div>
  );
};

export default FixtureView;
