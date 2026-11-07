import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {fixtureErrors, overlappingFixtures} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import {draftOf, fixtureOfDraft, newFixtureDraft} from '@/data/fixtureDraft';
import {type FixtureEditorTab, tabsWithErrors} from '@/data/fixtureEditorTabs';
import {useActionSaveFixture} from '@/state/actionHooks/saveFixtures';

import Button from '../commons/Button';
import Tabs, {type Tab} from '../commons/Tabs';
import FixtureChannelHelp from './FixtureChannelHelp';
import FixtureChannelRows from './FixtureChannelRows';
import {actions, editorForm, editorTitle, fixtureEditor} from './FixtureEditor.css';
import FixtureEditorProblems from './FixtureEditorProblems';
import FixtureGeneralFields from './FixtureGeneralFields';
import FixtureGeneralHelp from './FixtureGeneralHelp';
import FixturePresetColumns from './FixturePresetColumns';
import FixturePresetHelp from './FixturePresetHelp';

interface FixtureEditorProps {
  /** undefined to add a new fixture */
  fixture: Fixture | undefined;
  /** all fixtures, to warn about shared addresses */
  fixtures: readonly Fixture[];
  onClose: () => void;
}

const editTitle = ({name: fixtureName}: Fixture) => <Trans>Edit {fixtureName}</Trans>;

/**
 * edits a copy of the fixture, in three tabs on one draft; nothing changes until it is saved, and it can't be saved
 * while it has errors. The errors and Save sit outside the tabs, so they are seen from every tab
 */
const FixtureEditor = ({fixture, fixtures, onClose}: FixtureEditorProps) => {
  const {t} = useLingui();
  const saveFixture = useActionSaveFixture();
  const [id] = useState(() => fixture?.id ?? crypto.randomUUID());
  const [draft, setDraft] = useState(() => (fixture ? draftOf(fixture) : newFixtureDraft()));
  const [activeTab, setActiveTab] = useState<FixtureEditorTab>('general');
  const [saving, setSaving] = useState(false);

  const candidate = fixtureOfDraft(id, draft);
  const errors = fixtureErrors(candidate);
  const tabErrors = tabsWithErrors(errors);
  const otherFixtures = fixtures.filter((other) => other.id !== id);
  const overlaps = errors.length === 0 ? overlappingFixtures([candidate, ...otherFixtures]) : [];
  const ownOverlaps = overlaps.filter((overlap) => overlap.first.id === id);
  const helpOpen = !fixture;
  const channelCount = draft.channels.length;
  const presetCount = draft.presets.length;
  const warningOf = (tab: FixtureEditorTab) => (tabErrors.has(tab) ? t`Has errors` : undefined);

  const tabs: Tab<FixtureEditorTab>[] = [
    {
      id: 'general',
      label: <Trans>General</Trans>,
      warning: warningOf('general'),
      panel: (
        <>
          <FixtureGeneralFields draft={draft} onChange={setDraft} />
          <FixtureGeneralHelp initiallyOpen={helpOpen} />
        </>
      )
    },
    {
      id: 'channels',
      label: <Trans>Channels ({channelCount})</Trans>,
      warning: warningOf('channels'),
      panel: (
        <>
          <FixtureChannelRows draft={draft} onChange={setDraft} />
          <FixtureChannelHelp initiallyOpen={helpOpen} />
        </>
      )
    },
    {
      id: 'presets',
      label: <Trans>Presets ({presetCount})</Trans>,
      warning: warningOf('presets'),
      panel: (
        <>
          <FixturePresetColumns draft={draft} onChange={setDraft} />
          <FixturePresetHelp initiallyOpen={helpOpen} />
        </>
      )
    }
  ];

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
        <Tabs label={t`Fixture editor`} tabs={tabs} activeId={activeTab} onSelect={setActiveTab} />

        <FixtureEditorProblems errors={errors} overlaps={ownOverlaps} />

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
