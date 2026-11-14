import {Trans} from '@lingui/react/macro';

import {LICENSE_URL, REPOSITORY_URL} from './pageLinks';

interface PageFooterProps {
  rootPath: string;
}

/** where the app comes from and under which license; the credit is always English, like the app's, so it isn't translated */
const PageFooter = ({rootPath}: PageFooterProps) => (
  <footer className="footer">
    <a href={REPOSITORY_URL}>
      <Trans>Source code on GitHub</Trans>
    </a>
    <a href={LICENSE_URL}>GPL-3.0</a>
    <span className="madeIn">
      Made with Love in <img src={`${rootPath}assets/switzerland.png`} alt="Switzerland" width={16} height={16} />
    </span>
  </footer>
);

export default PageFooter;
