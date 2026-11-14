import swissFlag from '@assets/switzerland_24.png';

import envConfig from '@/envConfig';

import {flag, madeIn, versionLabel} from './VersionLabel.css';

/** the app version and where it's made; the credit is always English, like a signature, so it isn't translated */
const VersionLabel = () => (
  <span className={versionLabel}>
    <span>v{envConfig.version}</span>
    <span className={madeIn}>
      Made with Love in <img className={flag} src={swissFlag} alt="Switzerland" />
    </span>
  </span>
);

export default VersionLabel;
