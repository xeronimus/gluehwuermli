import {CHANNEL_BANK_SIZE} from '@/data/channelBank';
import {fadersFor} from '@/data/channelValues';
import {useActionSetChannelValue} from '@/state/actionHooks/setChannelValue';
import {useAppStore} from '@/state/store';

import ChannelFader from '../commons/ChannelFader';
import ChannelBankNavigation from './ChannelBankNavigation';
import {faderBank, faders} from './FaderBank.css';

/** a bank of consecutive raw channels, movable across the universe, independent of the fixtures */
const FaderBank = () => {
  const bankStart = useAppStore((state) => state.bankStart);
  const setBankStart = useAppStore((state) => state.setBankStart);
  const setChannelValue = useActionSetChannelValue();

  return (
    <div className={faderBank}>
      <ChannelBankNavigation start={bankStart} onChange={setBankStart} />
      <div className={faders}>
        {fadersFor(bankStart, CHANNEL_BANK_SIZE).map((fader) => (
          <ChannelFader key={fader.channel} fader={fader} onChange={setChannelValue} />
        ))}
      </div>
    </div>
  );
};

export default FaderBank;
