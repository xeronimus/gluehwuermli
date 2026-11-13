import {Trans} from '@lingui/react/macro';

/** the only interfaces the app talks to; product names aren't translated */
const TESTED_INTERFACES = ['Enttec DMX USB Pro', 'Eurolite USB-DMX512 PRO'];

/** which USB DMX interfaces the app is tested with */
const TestedHardware = () => (
  <section className="section">
    <h2>
      <Trans>Tested hardware</Trans>
    </h2>
    <p>
      <Trans>
        Glühwürmli sends DMX through a USB DMX interface. It is tested with these two, which speak the same protocol:
      </Trans>
    </p>
    <ul className="hardwareList">
      {TESTED_INTERFACES.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
    <p>
      <Trans>Any DMX device can be connected to them: PARs, moving heads, lasers, smoke machines.</Trans>
    </p>
  </section>
);

export default TestedHardware;
