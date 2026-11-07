import {Trans, useLingui} from '@lingui/react/macro';

import {FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from '@shared/dmx';

import {FixtureDraft} from '@/data/fixtureDraft';

import {addressInput, field, fields, nameInput} from './FixtureEditor.css';
import FixtureNotesFields from './FixtureNotesFields';

interface FixtureGeneralFieldsProps {
  draft: FixtureDraft;
  onChange: (draft: FixtureDraft) => void;
}

/** what the fixture is: its name, its start address, the hint below its faders and its description */
const FixtureGeneralFields = ({draft, onChange}: FixtureGeneralFieldsProps) => {
  const {t} = useLingui();
  return (
    <>
      <div className={fields}>
        <label className={field}>
          <Trans>Name</Trans>
          <input
            className={nameInput}
            value={draft.name}
            placeholder={t`e.g. PAR left`}
            autoFocus
            onChange={(event) => onChange({...draft, name: event.target.value})}
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
            onChange={(event) => onChange({...draft, startAddress: event.target.value})}
          />
        </label>
      </div>

      <FixtureNotesFields draft={draft} onChange={onChange} />
    </>
  );
};

export default FixtureGeneralFields;
