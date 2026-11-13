import {isDmxChannel, isDmxValue} from '@shared/dmx';
import type {SetChannelRequest} from '@shared/ipc';

import {numberOf} from './channelValuesDraft';
import type {ChaseStepValueDraft} from './chaseDraft';
import type {ChannelBeingTyped} from './chaseStepTable';

/**
 * The chase editor's "Preview on rig": the values of the shown step sent to the output. A row that isn't a valid
 * channel and value is left out, and so is the row whose channel is being typed (typing 51 must not send to channel 5
 * first); it is sent once its channel is left. A channel set twice in the step (a step error) sends its first row.
 * Sorted by channel, so the result is a stable key of what is sent
 */
export function stepOnRigValues(
  values: readonly ChaseStepValueDraft[],
  beingTyped: ChannelBeingTyped | undefined
): SetChannelRequest[] {
  const byChannel = new Map<number, number>();
  values
    .filter(({id}) => id !== beingTyped?.id)
    .forEach((row) => {
      const channel = numberOf(row.channel);
      const value = numberOf(row.value);
      if (isDmxChannel(channel) && isDmxValue(value) && !byChannel.has(channel)) {
        byChannel.set(channel, value);
      }
    });
  return [...byChannel].toSorted(([first], [second]) => first - second).map(([channel, value]) => ({channel, value}));
}
