import {FIRST_DMX_CHANNEL} from '@shared/dmx';

import {fadersFor} from '@/data/channelValues';
import {useActionSetChannelValue} from '@/state/actionHooks/setChannelValue';

import ChannelFader from '../commons/ChannelFader';
import {faderBank} from './FaderBank.css';

/** one fader per channel, from channel 1, independent of the fixtures */
const FADER_COUNT = 16;
const faders = fadersFor(FIRST_DMX_CHANNEL, FADER_COUNT);

const FaderBank = () => {
  const setChannelValue = useActionSetChannelValue();

  return (
    <div className={faderBank}>
      {faders.map((fader) => (
        <ChannelFader key={fader.channel} fader={fader} onChange={setChannelValue} />
      ))}
    </div>
  );
};

export default FaderBank;
