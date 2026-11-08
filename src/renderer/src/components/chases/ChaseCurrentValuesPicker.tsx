import {useState} from 'react';

import {Trans} from '@lingui/react/macro';

import type {Fixture} from '@shared/ipc';

import Button from '../commons/Button';
import {checkboxLabel, fillChoices, fillChoicesTitle, fillPicker, fillPickerActions} from './ChaseEditor.css';

interface ChaseCurrentValuesPickerProps {
  fixtures: readonly Fixture[];
  /** the checked fixtures, in the order of the fixture list */
  onTake: (fixtureIds: readonly string[]) => void;
  onCancel: () => void;
}

/** a checkbox per fixture: all channels of the checked ones are taken into the step with the values they have now */
const ChaseCurrentValuesPicker = ({fixtures, onTake, onCancel}: ChaseCurrentValuesPickerProps) => {
  const [fixtureIds, setFixtureIds] = useState<readonly string[]>([]);
  const onToggle = (fixtureId: string, checked: boolean) =>
    setFixtureIds((current) => (checked ? [...current, fixtureId] : current.filter((id) => id !== fixtureId)));

  return (
    <div className={fillPicker}>
      <fieldset className={fillChoices}>
        <legend className={fillChoicesTitle}>
          <Trans>Fixtures whose current values to take</Trans>
        </legend>
        {fixtures.map((fixture) => (
          <label key={fixture.id} className={checkboxLabel}>
            <input
              type="checkbox"
              checked={fixtureIds.includes(fixture.id)}
              onChange={(event) => onToggle(fixture.id, event.target.checked)}
            />
            {fixture.name}
          </label>
        ))}
      </fieldset>
      <div className={fillPickerActions}>
        <Button size="compact" variant="primary" onClick={() => onTake(fixtureIds)} disabled={fixtureIds.length === 0}>
          <Trans>Take</Trans>
        </Button>
        <Button size="compact" onClick={onCancel}>
          <Trans>Cancel</Trans>
        </Button>
      </div>
    </div>
  );
};

export default ChaseCurrentValuesPicker;
