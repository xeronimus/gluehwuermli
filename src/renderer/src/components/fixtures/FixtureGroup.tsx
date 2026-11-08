import {useState} from 'react';

import {useLingui} from '@lingui/react/macro';

import type {Fixture} from '@shared/ipc';

import {showsAsButtons} from '@/data/faderStops';
import {addressRangeOf, fixtureFaders} from '@/data/fixtureFaders';
import type {MoveDirection} from '@/data/listOrder';
import {useActionSetChannelValue} from '@/state/actionHooks/setChannelValue';

import Button from '../commons/Button';
import ChannelFader from '../commons/ChannelFader';
import MarkdownText from '../commons/MarkdownText';
import MoveButtons from '../commons/MoveButtons';
import {CollapseIcon, DeleteIcon, EditIcon, ExpandIcon, FixtureIcon} from '../commons/icons';
import ChannelPositionButtons from './ChannelPositionButtons';
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
  onMove: (direction: MoveDirection) => void;
  /** where the fixture is in the Show view, of `count` fixtures */
  index: number;
  count: number;
  /** while a scene or chase is being edited: the scene editor works with the fixtures as they are */
  disabled: boolean;
}

interface FixtureGroupProps {
  fixture: Fixture;
  /** undefined in Show mode: the fixture can be played, not changed */
  actions: FixtureGroupActions | undefined;
}

/**
 * The fixture's name and addresses, a fader per channel on its absolute DMX channel (a button per position for a
 * positions channel set to buttons), its preset buttons and its hint below them. The description is reference
 * material, hidden until opened with the button next to the hint.
 */
const FixtureGroup = ({fixture, actions}: FixtureGroupProps) => {
  const {t} = useLingui();
  const fixtureName = fixture.name;
  const setChannelValue = useActionSetChannelValue();
  const [descriptionShown, setDescriptionShown] = useState(false);

  return (
    <section className={fixtureGroup} aria-label={fixture.name}>
      <header className={groupHeader}>
        <span className={groupName}>
          <FixtureIcon />
          {fixture.name}
        </span>
        <span className={groupAddresses}>{addressRangeOf(fixture)}</span>
        {actions && (
          <>
            <MoveButtons
              index={actions.index}
              count={actions.count}
              onMove={actions.onMove}
              disabled={actions.disabled}
              titles={{earlier: t`Move ${fixtureName} to the left`, later: t`Move ${fixtureName} to the right`}}
            />
            <Button variant="icon" onClick={actions.onEdit} disabled={actions.disabled} title={t`Edit ${fixtureName}`}>
              <EditIcon />
            </Button>
            <Button
              variant="icon"
              onClick={actions.onDelete}
              disabled={actions.disabled}
              title={t`Delete ${fixtureName}`}
            >
              <DeleteIcon />
            </Button>
          </>
        )}
      </header>
      <div className={groupFaders}>
        {fixtureFaders(fixture).map((fader) =>
          showsAsButtons(fader) ? (
            <ChannelPositionButtons key={fader.channel} fader={fader} onChange={setChannelValue} />
          ) : (
            <ChannelFader key={fader.channel} fader={fader} onChange={setChannelValue} />
          )
        )}
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
