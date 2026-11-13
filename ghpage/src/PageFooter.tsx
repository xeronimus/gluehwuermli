import {Trans} from '@lingui/react/macro';

import {LICENSE_URL, REPOSITORY_URL} from './pageLinks';

/** where the app comes from and under which license */
const PageFooter = () => (
  <footer className="footer">
    <a href={REPOSITORY_URL}>
      <Trans>Source code on GitHub</Trans>
    </a>
    <a href={LICENSE_URL}>GPL-3.0</a>
  </footer>
);

export default PageFooter;
