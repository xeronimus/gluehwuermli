import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from '@shared/dmx';
import {fixtureErrors, overlappingFixtures} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import {draftOf, fixtureOfDraft, newFixtureDraft} from '@/data/fixtureDraft';
import {fixtureErrorMessage, overlapMessage} from '@/i18n/messages/fixtureMessages';
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

const editTitle = ({name: fixtureName}: Fixture) => <Trans>Edit {fixtureName}</Trans>;

/** edits a copy of the fixture; nothing changes until it is saved, and it can't be saved while it has errors */
const FixtureEditor = ({fixture, fixtures, onClose}: FixtureEditorProps) => {
  const {t, i18n} = useLingui();
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
    <section className={fixtureEditor} aria-label={t`Fixture editor`}>
      <h2 className={editorTitle}>{fixture ? editTitle(fixture) : <Trans>New fixture</Trans>}</h2>
      <div className={editorForm}>
        <div className={fields}>
          <label className={field}>
            <Trans>Name</Trans>
            <input
              className={nameInput}
              value={draft.name}
              placeholder={t`e.g. PAR left`}
              autoFocus
              onChange={(event) => setDraft({...draft, name: event.target.value})}
            />
          </label>
          <label className={field}>
            <Trans>Start address</Trans>
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
            {errors.map((error) => {
              const text = i18n._(fixtureErrorMessage(error, (message) => i18n._(message)));
              return <li key={text}>{text}</li>;
            })}
          </ul>
        )}
        {ownOverlaps.length > 0 && (
          <ul className={warningList}>
            {ownOverlaps.map((overlap) => (
              <li key={overlap.second.id}>
                <WarningIcon /> {i18n._(overlapMessage(overlap))}
              </li>
            ))}
          </ul>
        )}

        <div className={actions}>
          <Button variant="primary" onClick={() => void onSave()} disabled={errors.length > 0 || saving}>
            <Trans>Save</Trans>
          </Button>
          <Button onClick={onClose} disabled={saving}>
            <Trans>Cancel</Trans>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FixtureEditor;
