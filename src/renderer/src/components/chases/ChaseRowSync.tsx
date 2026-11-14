import {useLingui} from '@lingui/react/macro';

import {CHASE_SPEEDS, type ChaseSpeed} from '@shared/ipc';

import {type ChaseSyncShown, speedLabel} from '@/data/chaseRows';

import Button from '../commons/Button';
import {SyncChaseIcon} from '../commons/icons';
import {rowSync} from './ChaseRow.css';

/** a chase row's sync switch and speed; they work whether the chase is stopped, running or paused */
export interface ChaseRowSyncProps {
  chaseName: string;
  sync: ChaseSyncShown;
  /** without a tapped tempo there is nothing to sync to: the switch is off and disabled */
  hasTempo: boolean;
  onSync: (synced: boolean) => void;
  onSpeed: (speed: ChaseSpeed) => void;
}

/** the switch, then ½× 1× 2× 4×, the chosen speed highlighted; the speeds only apply while synced */
const ChaseRowSync = ({chaseName, sync, hasTempo, onSync, onSpeed}: ChaseRowSyncProps) => {
  const {t} = useLingui();
  return (
    <span className={rowSync}>
      <Button
        variant={sync.synced ? 'iconPrimary' : 'icon'}
        pressed={sync.synced}
        disabled={!hasTempo && !sync.synced}
        onClick={() => onSync(!sync.synced)}
        title={
          hasTempo
            ? t`Sync the chase ${chaseName} to the tempo`
            : t`Sync the chase ${chaseName} to the tempo: tap it first`
        }
      >
        <SyncChaseIcon />
      </Button>
      {CHASE_SPEEDS.map((speed) => {
        const label = speedLabel(speed);
        return (
          <Button
            key={speed}
            size="compact"
            variant={speed === sync.speed ? 'primary' : 'default'}
            pressed={speed === sync.speed}
            disabled={!sync.synced}
            onClick={() => onSpeed(speed)}
            title={t`Play the chase ${chaseName} at ${label} the tempo`}
          >
            {label}
          </Button>
        );
      })}
    </span>
  );
};

export default ChaseRowSync;
