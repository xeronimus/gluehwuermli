import {useLingui} from '@lingui/react/macro';

import {DMX_MAX_VALUE, DMX_MIN_VALUE, FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from '@shared/dmx';

import {
  type ChaseDraft,
  type ChaseStepValueDraft,
  fixtureChannelsAt,
  withStepValueChange,
  withoutStepValue
} from '@/data/chaseDraft';
import {selectFixtures} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import ColorDot from '../commons/ColorDot';
import {RemoveIcon} from '../commons/icons';
import {channelInput, stepValue, valueArrow, valueInput, valueLabel, valueLabelPart} from './ChaseEditor.css';

interface ChaseStepValueRowProps {
  value: ChaseStepValueDraft;
  stepIndex: number;
  valueIndex: number;
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
  /** the channel field lost its focus to `nextFocus` (null when it went nowhere): the step sorts its rows */
  onChannelLeft: (nextFocus: EventTarget | null) => void;
}

/**
 * one channel a step sets: `channel → value`, both typed, and the fixture channels on that address as a label (all of
 * them where fixtures share it, each after a dot in its color there if it has one); the label isn't stored, the step
 * knows the address only
 */
const ChaseStepValueRow = ({value, stepIndex, valueIndex, onChange, onChannelLeft}: ChaseStepValueRowProps) => {
  const {t} = useLingui();
  const fixtures = useAppStore(selectFixtures);
  const labels = fixtureChannelsAt(fixtures, value.channel);
  const channelNumber = value.channel;
  const change = (changed: Partial<Omit<ChaseStepValueDraft, 'id'>>) =>
    onChange((draft) => withStepValueChange(draft, stepIndex, valueIndex, changed));

  return (
    <li className={stepValue}>
      <input
        className={channelInput}
        type="number"
        min={FIRST_DMX_CHANNEL}
        max={LAST_DMX_CHANNEL}
        value={value.channel}
        aria-label={t`Channel`}
        onChange={(event) => change({channel: event.target.value})}
        onBlur={(event) => onChannelLeft(event.relatedTarget)}
      />
      <span className={valueArrow}>→</span>
      <input
        className={valueInput}
        type="number"
        min={DMX_MIN_VALUE}
        max={DMX_MAX_VALUE}
        value={value.value}
        aria-label={t`Value of channel ${channelNumber}`}
        onChange={(event) => change({value: event.target.value})}
      />
      <span className={valueLabel}>
        {labels.map(({fixtureName, channelName, color}, labelIndex) => (
          // a fixture may have two channels of the same name, so the index tells them apart
          <span key={labelIndex} className={valueLabelPart}>
            {color !== undefined && <ColorDot color={color} />}
            {`${fixtureName} · ${channelName}`}
            {labelIndex < labels.length - 1 && ','}
          </span>
        ))}
      </span>
      <Button
        variant="icon"
        onClick={() => onChange((draft) => withoutStepValue(draft, stepIndex, valueIndex))}
        title={t`Remove channel ${channelNumber}`}
      >
        <RemoveIcon />
      </Button>
    </li>
  );
};

export default ChaseStepValueRow;
