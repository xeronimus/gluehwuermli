import {Trans, useLingui} from '@lingui/react/macro';

import {CHASE_REFERENCE_BPM_DEFAULT, CHASE_REFERENCE_BPM_MAX, CHASE_REFERENCE_BPM_MIN} from '@shared/ipc';

import type {ChaseDraft} from '@/data/chaseDraft';

import {bpmInput, tempoField} from './ChaseEditor.css';

interface ChaseReferenceBpmFieldProps {
  draft: ChaseDraft;
  onChange: (draft: ChaseDraft) => void;
}

/** Tempo [   ] BPM: the tempo the chase's times are written at; blank is the default, a synced chase scales by it */
const ChaseReferenceBpmField = ({draft, onChange}: ChaseReferenceBpmFieldProps) => {
  const {t} = useLingui();
  return (
    <label
      className={tempoField}
      title={t`The tempo the chase's times are written at, for syncing it to a tapped tempo`}
    >
      <Trans>Tempo</Trans>
      <input
        className={bpmInput}
        type="number"
        min={CHASE_REFERENCE_BPM_MIN}
        max={CHASE_REFERENCE_BPM_MAX}
        placeholder={String(CHASE_REFERENCE_BPM_DEFAULT)}
        value={draft.referenceBpm}
        onChange={(event) => onChange({...draft, referenceBpm: event.target.value})}
      />
      <Trans>BPM</Trans>
    </label>
  );
};

export default ChaseReferenceBpmField;
