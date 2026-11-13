import {Trans} from '@lingui/react/macro';

/** what professional lighting software does and Glühwürmli leaves out on purpose, so nobody finds out by trying */
const Limitations = () => (
  <section className="section">
    <h2>
      <Trans>Kept simple on purpose</Trans>
    </h2>
    <p>
      <Trans>
        Glühwürmli is made to be set up in an evening and played without a manual at hand. It leaves out what
        professional lighting software does:
      </Trans>
    </p>
    <ul>
      <li>
        <Trans>One DMX universe: 512 channels.</Trans>
      </li>
      <li>
        <Trans>Only the two USB interfaces above; no Art-Net, sACN or other DMX over the network.</Trans>
      </li>
      <li>
        <Trans>Windows only, for now.</Trans>
      </li>
      <li>
        <Trans>Values and chase steps change at once; there are no fades yet (planned).</Trans>
      </li>
      <li>
        <Trans>No fixture library: you enter each device's channels yourself, from its manual.</Trans>
      </li>
      <li>
        <Trans>Every channel is 0–255; a device's coarse and fine channel are two separate faders.</Trans>
      </li>
      <li>
        <Trans>No MIDI or other hardware controllers; mouse and keyboard only.</Trans>
      </li>
      <li>
        <Trans>
          No sound-to-light, beat detection or timecode; a device's own sound mode still works through its channel.
        </Trans>
      </li>
      <li>
        <Trans>No cue lists, no moving-head effects (pan/tilt shapes), no RDM.</Trans>
      </li>
      <li>
        <Trans>One computer, one operator; no remote control from a phone or tablet.</Trans>
      </li>
    </ul>
  </section>
);

export default Limitations;
