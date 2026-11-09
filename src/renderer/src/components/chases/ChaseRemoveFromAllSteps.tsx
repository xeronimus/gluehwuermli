import {useId, useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {
  type AllStepsLine,
  type RemovableChannel,
  type RemovableChannelGroup,
  pickedRemovableChannel,
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
 * Remove channel [ choice ▾ ] [Remove]: a channel the steps set, out of every step. Only what is there is offered;
 * nothing is picked at first and after a removal, so Remove never removes a channel that wasn't picked
 */
const ChaseRemoveFromAllSteps = ({steps, shownStep, onPreview, onApply}: AllStepsActionProps) => {
  const {t} = useLingui();
  const fieldId = useId();
  const fixtures = useAppStore(selectFixtures);
  const [picked, setPicked] = useState<number | undefined>(undefined);
  const groups = removableChannels(fixtures, steps);
  const channel = pickedRemovableChannel(groups, picked);
  const totalSteps = steps.length;

  const effectOf = (removed: number) => {
    const effect = withoutChannelInAllStepsEffect(steps, removed, shownStep?.id);
    const line: AllStepsLine = {action: 'remove', done: false, channel: removed, effect};
    return {line, valueIds: effect.shownChangedIds};
  };
  const apply = () => {
    if (channel !== undefined) {
      onApply((draft) => withoutChannelInAllSteps(draft, channel), effectOf(channel));
      setPicked(undefined);
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
          disabled={groups.length === 0}
          onChange={(event) => setPicked(Number(event.target.value))}
          onKeyDown={applyOnEnter(apply)}
        >
          <option value="" disabled>
            {t`Pick a channel`}
          </option>
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
