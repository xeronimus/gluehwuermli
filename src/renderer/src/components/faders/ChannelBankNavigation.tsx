import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {FIRST_DMX_CHANNEL} from '@shared/dmx';

import {
  LAST_BANK_START,
  bankEnd,
  bankStartFromInput,
  isFirstBank,
  isLastBank,
  nextBankStart,
  previousBankStart
} from '@/data/channelBank';

import Button from '../commons/Button';
import {NextIcon, PreviousIcon} from '../commons/icons';
import {bankNavigation, bankRange, jumpField, jumpInput} from './ChannelBankNavigation.css';

interface ChannelBankNavigationProps {
  start: number;
  onChange: (start: number) => void;
}

/** previous/next bank, the range shown, and a field to jump to a start channel */
const ChannelBankNavigation = ({start, onChange}: ChannelBankNavigationProps) => {
  const {t} = useLingui();
  const [jumpText, setJumpText] = useState(String(start));

  const moveTo = (newStart: number) => {
    setJumpText(String(newStart));
    onChange(newStart);
  };

  // shows the start actually applied, e.g. 497 after typing 600
  const applyJump = () => moveTo(bankStartFromInput(jumpText, start));

  return (
    <div className={bankNavigation}>
      <Button
        variant="icon"
        title={t`Previous channels`}
        disabled={isFirstBank(start)}
        onClick={() => moveTo(previousBankStart(start))}
      >
        <PreviousIcon />
      </Button>
      <span className={bankRange}>
        {start}–{bankEnd(start)}
      </span>
      <Button
        variant="icon"
        title={t`Next channels`}
        disabled={isLastBank(start)}
        onClick={() => moveTo(nextBankStart(start))}
      >
        <NextIcon />
      </Button>
      <label className={jumpField}>
        <Trans>Start channel</Trans>
        <input
          className={jumpInput}
          type="number"
          min={FIRST_DMX_CHANNEL}
          max={LAST_BANK_START}
          value={jumpText}
          onChange={(event) => setJumpText(event.target.value)}
          onBlur={applyJump}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              applyJump();
            }
          }}
        />
      </label>
    </div>
  );
};

export default ChannelBankNavigation;
