import {Trans, useLingui} from '@lingui/react/macro';

import type {SetChannelRequest} from '@shared/ipc';

import type {StepFillEffect} from '@/data/chaseStepFill';
import {sceneChannelValues} from '@/data/scenes';
import {useActionCurrentFixtureValues} from '@/state/actionHooks/currentFixtureValues';
import {selectFixtures, selectScenes} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import ColorDot from '../commons/ColorDot';
import {SceneIcon} from '../commons/icons';
import ChaseFillButton from './ChaseFillButton';
import {
  fillButtons,
  fillHint,
  fillPanel,
  fillPreview,
  fillSection,
  fillSectionTitle,
  fillTitle
} from './ChaseFillPanel.css';
import ChaseFillPresets from './ChaseFillPresets';

interface ChaseFillPanelProps {
  /** what the hovered button would do; undefined while none is */
  preview: StepFillEffect | undefined;
  /** absolute channels and values to merge into the step */
  onTake: (values: readonly SetChannelRequest[]) => void;
  onPreview: (values: readonly SetChannelRequest[] | undefined) => void;
}

const PreviewText = ({preview}: {preview: StepFillEffect}) => {
  const addedCount = preview.addedCount;
  const changedCount = preview.changedIds.length;
  if (addedCount === 0 && changedCount === 0) {
    return <Trans>Changes nothing</Trans>;
  }
  return (
    <Trans>
      {addedCount} new, {changedCount} changed
    </Trans>
  );
};

/**
 * fills the step in one click: the current values of a fixture or of all, a scene's or a preset's values, turned into
 * absolute channels when taken and merged into the step
 */
const ChaseFillPanel = ({preview, onTake, onPreview}: ChaseFillPanelProps) => {
  const {t} = useLingui();
  const fixtures = useAppStore(selectFixtures);
  const scenes = useAppStore(selectScenes);
  const currentFixtureValues = useActionCurrentFixtureValues();
  const buttonProps = {onTake, onPreview};

  return (
    <aside className={fillPanel} aria-label={t`Fill the step`}>
      <h3 className={fillTitle}>
        <Trans>Fill from</Trans>
      </h3>
      {fixtures.length === 0 ? (
        <p className={fillHint}>
          <Trans>Without fixtures there is nothing to fill from; add channels by hand.</Trans>
        </p>
      ) : (
        <>
          <section className={fillSection}>
            <h4 className={fillSectionTitle}>
              <Trans>Current values</Trans>
            </h4>
            <div className={fillButtons}>
              <ChaseFillButton
                {...buttonProps}
                values={() => currentFixtureValues(fixtures.map(({id}) => id))}
                title={t`Take the current values of all fixtures`}
              >
                <Trans>All</Trans>
              </ChaseFillButton>
              {fixtures.map((fixture) => {
                const fixtureName = fixture.name;
                return (
                  <ChaseFillButton
                    key={fixture.id}
                    {...buttonProps}
                    values={() => currentFixtureValues([fixture.id])}
                    title={t`Take the current values of ${fixtureName}`}
                  >
                    {fixture.name}
                  </ChaseFillButton>
                );
              })}
            </div>
          </section>
          {scenes.length > 0 && (
            <section className={fillSection}>
              <h4 className={fillSectionTitle}>
                <Trans>Scenes</Trans>
              </h4>
              <div className={fillButtons}>
                {scenes.map((scene) => {
                  const sceneName = scene.name;
                  return (
                    <ChaseFillButton
                      key={scene.id}
                      {...buttonProps}
                      values={() => sceneChannelValues(scene, fixtures)}
                      title={t`Take the values of the scene ${sceneName}`}
                    >
                      <SceneIcon />
                      {scene.color !== undefined && <ColorDot color={scene.color} />}
                      {scene.name}
                    </ChaseFillButton>
                  );
                })}
              </div>
            </section>
          )}
          <ChaseFillPresets fixtures={fixtures} {...buttonProps} />
          <p className={fillPreview} aria-live="polite">
            {preview && <PreviewText preview={preview} />}
          </p>
        </>
      )}
    </aside>
  );
};

export default ChaseFillPanel;
