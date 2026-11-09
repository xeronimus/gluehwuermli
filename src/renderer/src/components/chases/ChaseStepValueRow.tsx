import {useLingui} from '@lingui/react/macro';

import type {ChaseValueError} from '@shared/chases';
import {DMX_MAX_VALUE, DMX_MIN_VALUE, FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from '@shared/dmx';

import {numberOf} from '@/data/channelValuesDraft';
import {type ChaseDraft, type ChaseStepValueDraft, withStepValueChange, withoutStepValues} from '@/data/chaseDraft';
import {type ChaseStepRow, positionNameOf} from '@/data/chaseStepTable';
import {chaseRowErrorMessage} from '@/i18n/messages/chaseMessages';

import Button from '../commons/Button';
import ColorDot from '../commons/ColorDot';
import ValueBar from '../commons/ValueBar';
import {RemoveIcon} from '../commons/icons';
import {
  type StepRowMark,
  cell,
  channelName,
  dotSlot,
  numberInput,
  positionName,
  rowErrors,
  stepRow,
  valueCell
} from './ChaseStepTable.css';

/** the field that keeps the focus when its row moves to another group: see ChaseStepEditor */
export const focusKeyOf = (valueId: string, field: 'channel' | 'value') => `${valueId}:${field}`;

interface ChaseStepValueRowProps {
  row: ChaseStepRow;
  stepIndex: number;
  /** the step's problems of this row */
  errors: readonly ChaseValueError[];
  mark: StepRowMark;
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
  /** the channel field got the focus: the row stays in its group while the channel is typed */
  onChannelFocus: (value: ChaseStepValueDraft) => void;
  /** the channel field lost its focus to `nextFocus` (null when it went nowhere): the step sorts and groups its rows */
  onChannelLeft: (nextFocus: EventTarget | null) => void;
}

/**
 * one channel a step sets: its channel and value, both typed, the name and color of the group's fixture channel on
 * that address, a bar showing the value and the name of the position it is on; the problems of the row below it
 */
const ChaseStepValueRow = ({
  row,
  stepIndex,
  errors,
  mark,
  onChange,
  onChannelFocus,
  onChannelLeft
}: ChaseStepValueRowProps) => {
  const {t, i18n} = useLingui();
  const {value, valueIndex, channel} = row;
  const channelNumber = value.channel;
  const color = channel?.color;
  const position = positionNameOf(channel, value.value);
  const channelInError = errors.some(({type}) => type !== 'chase-step-value-invalid');
  const valueInError = errors.some(({type}) => type === 'chase-step-value-invalid');
  const change = (changed: Partial<Omit<ChaseStepValueDraft, 'id'>>) =>
    onChange((draft) => withStepValueChange(draft, stepIndex, valueIndex, changed));

  return (
    <>
      <tr className={stepRow[mark]}>
        <td className={cell}>
          <input
            className={numberInput[channelInError ? 'invalid' : 'valid']}
            type="number"
            min={FIRST_DMX_CHANNEL}
            max={LAST_DMX_CHANNEL}
            value={value.channel}
            aria-label={t`Channel`}
            aria-invalid={channelInError}
            data-focus-key={focusKeyOf(value.id, 'channel')}
            onChange={(event) => change({channel: event.target.value})}
            onFocus={() => onChannelFocus(value)}
            onBlur={(event) => onChannelLeft(event.relatedTarget)}
          />
        </td>
        <td className={cell}>
          <span className={channelName}>
            <span className={dotSlot}>{color !== undefined && <ColorDot color={color} />}</span>
            {channel?.name}
          </span>
        </td>
        <td className={cell}>
          <span className={valueCell}>
            <input
              className={numberInput[valueInError ? 'invalid' : 'valid']}
              type="number"
              min={DMX_MIN_VALUE}
              max={DMX_MAX_VALUE}
              value={value.value}
              aria-label={t`Value of channel ${channelNumber}`}
              aria-invalid={valueInError}
              data-focus-key={focusKeyOf(value.id, 'value')}
              onChange={(event) => change({value: event.target.value})}
            />
            <ValueBar value={numberOf(value.value)} {...(color !== undefined && {color})} />
            {position !== undefined && <span className={positionName}>{position}</span>}
          </span>
        </td>
        <td className={cell}>
          <Button
            variant="icon"
            onClick={() => onChange((draft) => withoutStepValues(draft, stepIndex, [valueIndex]))}
            title={t`Remove channel ${channelNumber}`}
          >
            <RemoveIcon />
          </Button>
        </td>
      </tr>
      {errors.length > 0 && (
        <tr>
          <td />
          <td className={rowErrors} colSpan={3}>
            {errors.map((error) => (
              <div key={error.type}>{i18n._(chaseRowErrorMessage(error))}</div>
            ))}
          </td>
        </tr>
      )}
    </>
  );
};

export default ChaseStepValueRow;
