import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import type {SetChannelRequest} from '@shared/ipc';

import {presetChoices} from '@/data/chaseStepFill';
import {presetChannelValues} from '@/data/presets';
import {sceneChannelValues} from '@/data/scenes';
import {useActionCurrentFixtureValues} from '@/state/actionHooks/currentFixtureValues';
import {selectFixtures, selectScenes} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {AddIcon} from '../commons/icons';
import ChaseCurrentValuesPicker from './ChaseCurrentValuesPicker';
import {fillSelect, stepFill} from './ChaseEditor.css';

/** the value of a choice list while nothing is picked: it goes back to it after each pick, so the same can be taken again */
const NOTHING_PICKED = '';

interface ChaseStepFillProps {
  onAddChannel: () => void;
  /** absolute channels and values to merge into the step */
  onTake: (values: readonly SetChannelRequest[]) => void;
}

/**
 * fills a step: a channel by hand, the current values of the checked fixtures, a scene's or a preset's values, turned
 * into absolute channels when taken
 */
const ChaseStepFill = ({onAddChannel, onTake}: ChaseStepFillProps) => {
  const {t} = useLingui();
  const fixtures = useAppStore(selectFixtures);
  const scenes = useAppStore(selectScenes);
  const currentFixtureValues = useActionCurrentFixtureValues();
  const [picking, setPicking] = useState(false);
  const presets = presetChoices(fixtures);
  const fixturesWithPresets = fixtures.filter((fixture) => presets.some((choice) => choice.fixture === fixture));

  const takeScene = (choice: string) => {
    const scene = scenes[Number(choice)];
    if (scene) {
      onTake(sceneChannelValues(scene, fixtures));
    }
  };
  const takePreset = (choice: string) => {
    const picked = presets[Number(choice)];
    if (picked) {
      onTake(presetChannelValues(picked.fixture, picked.preset));
    }
  };

  return (
    <>
      <div className={stepFill}>
        <Button size="compact" onClick={onAddChannel}>
          <AddIcon />
          <Trans>Add channel</Trans>
        </Button>
        <Button size="compact" onClick={() => setPicking(!picking)} disabled={fixtures.length === 0}>
          <Trans>Take current values</Trans>
        </Button>
        <select
          className={fillSelect}
          value={NOTHING_PICKED}
          aria-label={t`Take from scene`}
          disabled={scenes.length === 0}
          onChange={(event) => takeScene(event.target.value)}
        >
          <option value={NOTHING_PICKED} disabled>
            {t`Take from scene…`}
          </option>
          {scenes.map((scene, sceneIndex) => (
            <option key={scene.id} value={sceneIndex}>
              {scene.name}
            </option>
          ))}
        </select>
        <select
          className={fillSelect}
          value={NOTHING_PICKED}
          aria-label={t`Take from preset`}
          disabled={presets.length === 0}
          onChange={(event) => takePreset(event.target.value)}
        >
          <option value={NOTHING_PICKED} disabled>
            {t`Take from preset…`}
          </option>
          {fixturesWithPresets.map((fixture) => (
            <optgroup key={fixture.id} label={fixture.name}>
              {presets.map(
                (choice, choiceIndex) =>
                  choice.fixture === fixture && (
                    <option key={choice.preset.id} value={choiceIndex}>
                      {choice.preset.name}
                    </option>
                  )
              )}
            </optgroup>
          ))}
        </select>
      </div>
      {picking && (
        <ChaseCurrentValuesPicker
          fixtures={fixtures}
          onTake={(fixtureIds) => {
            onTake(currentFixtureValues(fixtureIds));
            setPicking(false);
          }}
          onCancel={() => setPicking(false)}
        />
      )}
    </>
  );
};

export default ChaseStepFill;
