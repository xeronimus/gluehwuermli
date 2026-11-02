import {useState} from 'react';

import {useLingui} from '@lingui/react/macro';

import type {Fixture} from '@shared/ipc';

import {addressRangeOf, fixtureFaders} from '@/data/fixtureFaders';
import {useActionSetChannelValue} from '@/state/actionHooks/setChannelValue';

import Button from '../commons/Button';
import ChannelFader from '../commons/ChannelFader';
import MarkdownText from '../commons/MarkdownText';
import {CollapseIcon, DeleteIcon, EditIcon, ExpandIcon} from '../commons/icons';
import {
  fixtureGroup,
  groupAddresses,
  groupFaders,
  groupFooter,
  groupHeader,
  groupHint,
  groupName,
  groupNote
} from './FixtureGroup.css';
import FixturePresetButtons from './FixturePresetButtons';

/** changing the fixture, only in Setup mode */
export interface FixtureGroupActions {
  onEdit: () => void;
  onDelete: () => void;
}

interface FixtureGroupProps {
  fixture: Fixture;
  /** undefined in Show mode: the fixture can be played, not changed */
  actions: FixtureGroupActions | undefined;
}

/**
 * The fixture's name and addresses, a fader per channel on its absolute DMX channel, its preset buttons and its hint
 * below them. The description is reference material, hidden until opened with the button next to the hint.
 */
const FixtureGroup = ({fixture, actions}: FixtureGroupProps) => {
  const {t} = useLingui();
  const fixtureName = fixture.name;
  const setChannelValue = useActionSetChannelValue();
  const [descriptionShown, setDescriptionShown] = useState(false);

  return (
    <section className={fixtureGroup} aria-label={fixture.name}>
      <header className={groupHeader}>
        <span className={groupName}>{fixture.name}</span>
        <span className={groupAddresses}>{addressRangeOf(fixture)}</span>
        {actions && (
          <>
            <Button variant="icon" onClick={actions.onEdit} title={t`Edit ${fixtureName}`}>
              <EditIcon />
            </Button>
            <Button variant="icon" onClick={actions.onDelete} title={t`Delete ${fixtureName}`}>
              <DeleteIcon />
            </Button>
          </>
        )}
      </header>
      <div className={groupFaders}>
        {fixtureFaders(fixture).map((fader) => (
          <ChannelFader key={fader.channel} fader={fader} onChange={setChannelValue} />
        ))}
      </div>
      <FixturePresetButtons fixture={fixture} canSavePreset={actions !== undefined} />
      {(fixture.hint || fixture.description) && (
        <footer className={groupFooter}>
          <p className={groupHint}>{fixture.hint}</p>
          {fixture.description && (
            <Button
              variant="icon"
              onClick={() => setDescriptionShown(!descriptionShown)}
              title={descriptionShown ? t`Hide the description` : t`Show the description`}
            >
              {descriptionShown ? <CollapseIcon /> : <ExpandIcon />}
            </Button>
          )}
        </footer>
      )}
      {descriptionShown && fixture.description && (
        <div className={groupNote}>
          <MarkdownText text={fixture.description} />
        </div>
      )}
    </section>
  );
};

export default FixtureGroup;
