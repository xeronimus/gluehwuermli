import {Trans} from '@lingui/react/macro';

import Button from '../commons/Button';
import {AddFixtureIcon} from '../commons/icons';
import {message, noFixturesHint} from './NoFixturesHint.css';

interface NoFixturesHintProps {
  /** undefined in Show mode: fixtures are added in Setup mode */
  onAdd: (() => void) | undefined;
  addDisabled: boolean;
}

/**
 * what the Show view has without fixtures: in Setup mode there is nothing to unlock, the hint ends with the button
 * adding the first fixture (with fixtures, it is an icon after the last one)
 */
const NoFixturesHint = ({onAdd, addDisabled}: NoFixturesHintProps) =>
  onAdd ? (
    <span className={noFixturesHint}>
      <span className={message}>
        <Trans>No fixtures yet: add the devices of your rig, to control them by name.</Trans>
      </span>
      <Button onClick={onAdd} disabled={addDisabled}>
        <AddFixtureIcon /> <Trans>Add fixture</Trans>
      </Button>
    </span>
  ) : (
    <span className={message}>
      <Trans>
        No fixtures yet: unlock Setup mode in Settings and add the devices of your rig with Add fixture, to control them
        by name.
      </Trans>
    </span>
  );

export default NoFixturesHint;
