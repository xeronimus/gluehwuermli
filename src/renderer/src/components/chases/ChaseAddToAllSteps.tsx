import {useId, useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL, isDmxChannel} from '@shared/dmx';

import {numberOf} from '@/data/channelValuesDraft';
import {type AllStepsLine, channelInAllStepsEffect, stepIdsWithoutChannel} from '@/data/chaseAllSteps';
import {fixtureChannelsAt, withChannelInAllSteps} from '@/data/chaseDraft';
import {chaseRowErrorMessage} from '@/i18n/messages/chaseMessages';
import {selectFixtures} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import ColorDot from '../commons/ColorDot';
import {actionField, actionLabel, allStepsAction, fieldErrors, fixtureChannelLabel} from './ChaseAllSteps.css';
import ChaseAllStepsButton from './ChaseAllStepsButton';
import {numberInput} from './ChaseStepTable.css';
import {type AllStepsActionProps, applyOnEnter} from './allStepsAction';

/** Add channel [ N ] [Add]: channel N at 0 in every step without it; the fixture channels on N beside the field */
const ChaseAddToAllSteps = ({steps, shownStep, onPreview, onApply}: AllStepsActionProps) => {
  const {t, i18n} = useLingui();
  const fieldId = useId();
  const fixtures = useAppStore(selectFixtures);
  const [channelText, setChannelText] = useState('');
  const channel = numberOf(channelText);
  const canApply = isDmxChannel(channel);
  const inError = channelText.trim() !== '' && !canApply;
  const labels = canApply ? fixtureChannelsAt(fixtures, channelText) : [];
  const line = (): AllStepsLine => ({
    action: 'add',
    done: false,
    channel,
    effect: channelInAllStepsEffect(steps, channel)
  });
  const apply = () => {
    if (!canApply) {
      return;
    }
    // made here, not in the change: a change may run twice (React's strict mode), and must add the same rows each time
    const newIds = new Map(stepIdsWithoutChannel(steps, channel).map((stepId) => [stepId, crypto.randomUUID()]));
    const shownNewId = shownStep && newIds.get(shownStep.id);
    onApply((draft) => withChannelInAllSteps(draft, channel, (stepId) => newIds.get(stepId) ?? crypto.randomUUID()), {
      line: line(),
      valueIds: shownNewId === undefined ? [] : [shownNewId]
    });
  };

  return (
    <div className={allStepsAction}>
      <label className={actionLabel} htmlFor={fieldId}>
        <Trans>Add channel</Trans>
      </label>
      <span className={actionField}>
        <input
          id={fieldId}
          className={numberInput[inError ? 'invalid' : 'valid']}
          type="number"
          min={FIRST_DMX_CHANNEL}
          max={LAST_DMX_CHANNEL}
          value={channelText}
          aria-invalid={inError}
          onChange={(event) => setChannelText(event.target.value)}
          onKeyDown={applyOnEnter(apply)}
        />
        {labels.map(({fixtureName, channelName, color}) => (
          <span key={`${fixtureName}:${channelName}`} className={fixtureChannelLabel}>
            {color !== undefined && <ColorDot color={color} />}
            {fixtureName} · {channelName}
          </span>
        ))}
      </span>
      <ChaseAllStepsButton
        title={t`Add the channel to all steps`}
        disabled={!canApply}
        onApply={apply}
        onPreview={(active) => onPreview(active ? {line: line(), valueIds: []} : undefined)}
      >
        <Trans>Add</Trans>
      </ChaseAllStepsButton>
      {inError && (
        <ul className={fieldErrors}>
          <li>{i18n._(chaseRowErrorMessage({type: 'chase-step-channel-invalid', valueIndexes: []}))}</li>
        </ul>
      )}
    </div>
  );
};

export default ChaseAddToAllSteps;
