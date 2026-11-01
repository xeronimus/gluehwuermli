import {useState} from 'react';

import {FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from '@shared/dmx';
import {fixtureErrors, overlappingFixtures} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import {draftOf, fixtureOfDraft, newFixtureDraft} from '@/data/fixtureDraft';
import {describeOverlap} from '@/data/fixtureOverlaps';
import {useActionSaveFixture} from '@/state/actionHooks/saveFixtures';

import Button from '../commons/Button';
import {WarningIcon} from '../commons/icons';
import FixtureChannelRows from './FixtureChannelRows';
import {
  actions,
  addressInput,
  channelsAndPresets,
  editorForm,
  editorTitle,
  errorList,
  field,
  fields,
  fixtureEditor,
  nameInput,
  warningList
} from './FixtureEditor.css';
import FixtureHelp from './FixtureHelp';
import FixtureNotesFields from './FixtureNotesFields';
import FixturePresetColumns from './FixturePresetColumns';

interface FixtureEditorProps {
  /** undefined to add a new fixture */
  fixture: Fixture | undefined;
  /** all fixtures, to warn about shared addresses */
  fixtures: readonly Fixture[];
  onClose: () => void;
}

/** edits a copy of the fixture; nothing changes until it is saved, and it can't be saved while it has errors */
const FixtureEditor = ({fixture, fixtures, onClose}: FixtureEditorProps) => {
  const saveFixture = useActionSaveFixture();
  const [id] = useState(() => fixture?.id ?? crypto.randomUUID());
  const [draft, setDraft] = useState(() => (fixture ? draftOf(fixture) : newFixtureDraft()));
  const [saving, setSaving] = useState(false);

  const candidate = fixtureOfDraft(id, draft);
  const errors = fixtureErrors(candidate);
  const otherFixtures = fixtures.filter((other) => other.id !== id);
  const overlaps = errors.length === 0 ? overlappingFixtures([candidate, ...otherFixtures]) : [];
  const ownOverlaps = overlaps.filter((overlap) => overlap.first.id === id);

  const onSave = async () => {
    setSaving(true);
    const saved = await saveFixture(candidate);
    setSaving(false);
    if (saved) {
      onClose();
    }
  };

  return (
    <section className={fixtureEditor} aria-label="Fixture editor">
      <h2 className={editorTitle}>{fixture ? `Edit ${fixture.name}` : 'New fixture'}</h2>
      <div className={editorForm}>
        <div className={fields}>
          <label className={field}>
            Name
            <input
              className={nameInput}
              value={draft.name}
              placeholder="e.g. PAR left"
              autoFocus
              onChange={(event) => setDraft({...draft, name: event.target.value})}
            />
          </label>
          <label className={field}>
            Start address
            <input
              className={addressInput}
              type="number"
              min={FIRST_DMX_CHANNEL}
              max={LAST_DMX_CHANNEL}
              value={draft.startAddress}
              onChange={(event) => setDraft({...draft, startAddress: event.target.value})}
            />
          </label>
        </div>

        <div className={channelsAndPresets}>
          <FixtureChannelRows draft={draft} onChange={setDraft} />
          <FixturePresetColumns draft={draft} onChange={setDraft} />
        </div>

        <FixtureNotesFields draft={draft} onChange={setDraft} />

        <FixtureHelp initiallyOpen={!fixture} />

        {errors.length > 0 && (
          <ul className={errorList}>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        {ownOverlaps.length > 0 && (
          <ul className={warningList}>
            {ownOverlaps.map((overlap) => (
              <li key={overlap.second.id}>
                <WarningIcon /> {describeOverlap(overlap)}
              </li>
            ))}
          </ul>
        )}

        <div className={actions}>
          <Button variant="primary" onClick={() => void onSave()} disabled={errors.length > 0 || saving}>
            Save
          </Button>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FixtureEditor;
