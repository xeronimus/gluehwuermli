import {Trans} from '@lingui/react/macro';

import type {Fixture} from '@shared/ipc';

import {checkboxLabel, fixtureChoices, fixtureChoicesTitle} from './SceneEditor.css';

interface SceneFixtureChoicesProps {
  fixtures: readonly Fixture[];
  fixtureIds: readonly string[];
  onChange: (fixtureIds: readonly string[]) => void;
}

/** a checkbox per fixture: the ones the scene covers */
const SceneFixtureChoices = ({fixtures, fixtureIds, onChange}: SceneFixtureChoicesProps) => {
  const onToggle = (fixtureId: string, chosen: boolean) =>
    onChange(chosen ? [...fixtureIds, fixtureId] : fixtureIds.filter((id) => id !== fixtureId));
  return (
    <fieldset className={fixtureChoices}>
      <legend className={fixtureChoicesTitle}>
        <Trans>Fixtures in the scene</Trans>
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
  );
};

export default SceneFixtureChoices;
