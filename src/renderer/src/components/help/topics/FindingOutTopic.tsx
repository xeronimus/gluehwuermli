import {Trans} from '@lingui/react/macro';

/** the manual's topic on the Channels view as a way to learn what a device does */
const FindingOutTopic = () => (
  <p>
    <Trans>
      No manual, or not sure it is right? The <strong>Channels</strong> view (Setup mode only) has a fader for every DMX
      channel, 16 at a time. Jump to the device's address, move one channel after the other and watch what it does. The
      fixtures and the channels show the same values: a fader moved in one view has moved in the other, too.
    </Trans>
  </p>
);

export default FindingOutTopic;
