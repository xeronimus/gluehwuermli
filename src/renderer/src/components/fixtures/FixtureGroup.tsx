import {useState} from 'react';

import type {Fixture} from '@shared/ipc';

import {addressRangeOf, fixtureFaders} from '@/data/fixtureFaders';
import {useActionSetChannelValue} from '@/state/actionHooks/setChannelValue';

import Button from '../commons/Button';
import ChannelFader from '../commons/ChannelFader';
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

interface FixtureGroupProps {
  fixture: Fixture;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * The fixture's name and addresses, its preset buttons, a fader per channel on its absolute DMX channel and its hint
 * below them. The description is reference material, hidden until opened with the button next to the hint.
 */
const FixtureGroup = ({fixture, onEdit, onDelete}: FixtureGroupProps) => {
  const setChannelValue = useActionSetChannelValue();
  const [descriptionShown, setDescriptionShown] = useState(false);

  return (
    <section className={fixtureGroup} aria-label={fixture.name}>
      <header className={groupHeader}>
        <span className={groupName}>{fixture.name}</span>
        <span className={groupAddresses}>{addressRangeOf(fixture)}</span>
        <Button variant="icon" onClick={onEdit} title={`Edit ${fixture.name}`}>
          <EditIcon />
        </Button>
        <Button variant="icon" onClick={onDelete} title={`Delete ${fixture.name}`}>
          <DeleteIcon />
        </Button>
      </header>
      <FixturePresetButtons fixture={fixture} />
      <div className={groupFaders}>
        {fixtureFaders(fixture).map((fader) => (
          <ChannelFader key={fader.channel} fader={fader} onChange={setChannelValue} />
        ))}
      </div>
      {(fixture.hint || fixture.description) && (
        <footer className={groupFooter}>
          <p className={groupHint}>{fixture.hint}</p>
          {fixture.description && (
            <Button
              variant="icon"
              onClick={() => setDescriptionShown(!descriptionShown)}
              title={descriptionShown ? 'Hide the description' : 'Show the description'}
            >
              {descriptionShown ? <CollapseIcon /> : <ExpandIcon />}
            </Button>
          )}
        </footer>
      )}
      {descriptionShown && fixture.description && <p className={groupNote}>{fixture.description}</p>}
    </section>
  );
};

export default FixtureGroup;
