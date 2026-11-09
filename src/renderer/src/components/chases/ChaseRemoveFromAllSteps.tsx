import {useId, useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {
  type AllStepsLine,
  type RemovableChannel,
  type RemovableChannelGroup,
  removableChannels,
  withoutChannelInAllStepsEffect
} from '@/data/chaseAllSteps';
import {withoutChannelInAllSteps} from '@/data/chaseDraft';
import {selectFixtures} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import {actionField, actionLabel, allStepsAction, removeChoice} from './ChaseAllSteps.css';
import ChaseAllStepsButton from './ChaseAllStepsButton';
import {type AllStepsActionProps, applyOnEnter} from './allStepsAction';

const groupKeyOf = (group: RemovableChannelGroup) => (group.kind === 'fixture' ? group.fixture.id : 'unassigned');

/**
 * Remove channel [ choice ▾ ] [Remove]: a channel the steps set, out of every step. Only what is there is offered; the choice is
 * kept while its channel is, else it falls back to the first one
 */
const ChaseRemoveFromAllSteps = ({steps, shownStep, onPreview, onApply}: AllStepsActionProps) => {
  const {t} = useLingui();
  const fieldId = useId();
  const fixtures = useAppStore(selectFixtures);
  const [chosen, setChosen] = useState<number | undefined>(undefined);
  const groups = removableChannels(fixtures, steps);
  const offered = groups.flatMap(({channels}) => channels.map(({channel}) => channel));
  const channel = chosen !== undefined && offered.includes(chosen) ? chosen : offered[0];
  const totalSteps = steps.length;

  const effectOf = (removed: number) => {
    const effect = withoutChannelInAllStepsEffect(steps, removed, shownStep?.id);
    const line: AllStepsLine = {action: 'remove', done: false, channel: removed, effect};
    return {line, valueIds: effect.shownChangedIds};
  };
  const apply = () => {
    if (channel !== undefined) {
      onApply((draft) => withoutChannelInAllSteps(draft, channel), effectOf(channel));
    }
  };
  const optionText = ({channel: channelNumber, stepCount, fixtureChannel}: RemovableChannel) => {
    if (!fixtureChannel) {
      return t`${channelNumber} (${stepCount} of ${totalSteps})`;
    }
    const channelName = fixtureChannel.name;
    return t`${channelNumber} · ${channelName} (${stepCount} of ${totalSteps})`;
  };

  return (
    <div className={allStepsAction}>
      <label className={actionLabel} htmlFor={fieldId}>
        <Trans>Remove channel</Trans>
      </label>
      <span className={actionField}>
        <select
          id={fieldId}
          className={removeChoice}
          value={channel ?? ''}
          disabled={channel === undefined}
          onChange={(event) => setChosen(Number(event.target.value))}
          onKeyDown={applyOnEnter(apply)}
        >
          {groups.map((group) => (
            <optgroup key={groupKeyOf(group)} label={group.kind === 'fixture' ? group.fixture.name : t`Unassigned`}>
              {group.channels.map((removable) => (
                <option key={removable.channel} value={removable.channel}>
                  {optionText(removable)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </span>
      <ChaseAllStepsButton
        title={t`Remove the channel from all steps`}
        disabled={channel === undefined}
        onApply={apply}
        onPreview={(active) => onPreview(active && channel !== undefined ? effectOf(channel) : undefined)}
      >
        <Trans>Remove</Trans>
      </ChaseAllStepsButton>
    </div>
  );
};

export default ChaseRemoveFromAllSteps;
