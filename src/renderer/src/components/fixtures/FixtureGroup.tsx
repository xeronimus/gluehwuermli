import {lastAddress} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import {fixtureFaders} from '@/data/fixtureFaders';
import {useActionSetChannelValue} from '@/state/actionHooks/setChannelValue';

import Button from '../commons/Button';
import ChannelFader from '../commons/ChannelFader';
import {DeleteIcon, EditIcon} from '../commons/icons';
import {fixtureGroup, groupAddresses, groupFaders, groupHeader, groupName} from './FixtureGroup.css';

interface FixtureGroupProps {
  fixture: Fixture;
  onEdit: () => void;
  onDelete: () => void;
}

/** the fixture's name and addresses, and a fader per channel on its absolute DMX channel */
const FixtureGroup = ({fixture, onEdit, onDelete}: FixtureGroupProps) => {
  const setChannelValue = useActionSetChannelValue();

  return (
    <section className={fixtureGroup} aria-label={fixture.name}>
      <header className={groupHeader}>
        <span className={groupName}>{fixture.name}</span>
        <span className={groupAddresses}>
          {fixture.startAddress}–{lastAddress(fixture)}
        </span>
        <Button onClick={onEdit} title={`Edit ${fixture.name}`}>
          <EditIcon />
        </Button>
        <Button onClick={onDelete} title={`Delete ${fixture.name}`}>
          <DeleteIcon />
        </Button>
      </header>
      <div className={groupFaders}>
        {fixtureFaders(fixture).map((fader) => (
          <ChannelFader key={fader.channel} fader={fader} onChange={setChannelValue} />
        ))}
      </div>
    </section>
  );
};

export default FixtureGroup;
