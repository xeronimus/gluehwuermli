import {Trans, useLingui} from '@lingui/react/macro';

import {DOWNLOAD_URL} from './pageLinks';

interface HeroProps {
  rootPath: string;
}

/** the mascot, what the app is in one line, and the download */
const Hero = ({rootPath}: HeroProps) => {
  const {t} = useLingui();

  return (
    <section className="hero">
      <img
        className="mascot"
        src={`${rootPath}assets/mascot.png`}
        alt={t`The Glühwürmli mascot, a firefly`}
        width={240}
        height={240}
      />
      <div>
        <h1>Glühwürmli</h1>
        <p className="pitch">
          <Trans>A DMX lighting controller for Windows, for the living room, the party and the small band.</Trans>
        </p>
        <a className="downloadButton" href={DOWNLOAD_URL}>
          <Trans>Download for Windows</Trans>
        </a>
        <p className="downloadNote">
          <Trans>Free and open source (GPL-3.0).</Trans>
        </p>
      </div>
    </section>
  );
};

export default Hero;
