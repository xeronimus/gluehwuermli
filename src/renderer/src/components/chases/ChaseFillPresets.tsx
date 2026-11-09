import {Trans, useLingui} from '@lingui/react/macro';

import {fixturePresets as presetsOf} from '@shared/fixtures';
import type {Fixture, SetChannelRequest} from '@shared/ipc';

import {presetChannelValues} from '@/data/presets';

import ColorDot from '../commons/ColorDot';
import ChaseFillButton from './ChaseFillButton';
import {fillSection, fillSectionTitle, fixturePresets, fixturePresetsName} from './ChaseFillPanel.css';

interface ChaseFillPresetsProps {
  fixtures: readonly Fixture[];
  onTake: (values: readonly SetChannelRequest[]) => void;
  onPreview: (values: readonly SetChannelRequest[] | undefined) => void;
}

/** the presets of the fill panel, under the name of their fixture; nothing without presets */
const ChaseFillPresets = ({fixtures, onTake, onPreview}: ChaseFillPresetsProps) => {
  const {t} = useLingui();
  const fixturesWithPresets = fixtures.filter((fixture) => presetsOf(fixture).length > 0);
  if (fixturesWithPresets.length === 0) {
    return null;
  }

  return (
    <section className={fillSection}>
      <h4 className={fillSectionTitle}>
        <Trans>Presets</Trans>
      </h4>
      {fixturesWithPresets.map((fixture) => (
        <div key={fixture.id} className={fixturePresets}>
          <span className={fixturePresetsName}>{fixture.name}</span>
          {presetsOf(fixture).map((preset) => {
            const presetName = preset.name;
            return (
              <ChaseFillButton
                key={preset.id}
                onTake={onTake}
                onPreview={onPreview}
                values={() => presetChannelValues(fixture, preset)}
                title={t`Take the values of the preset ${presetName}`}
              >
                {preset.color !== undefined && <ColorDot color={preset.color} />}
                {preset.name}
              </ChaseFillButton>
            );
          })}
        </div>
      ))}
    </section>
  );
};

export default ChaseFillPresets;
