import {Trans} from '@lingui/react/macro';

import {REPOSITORY_URL} from './pageLinks';

/** a ribbon across the top right corner of the page, leading to the repository */
const GitHubRibbon = () => (
  <div className="githubRibbon">
    <a href={REPOSITORY_URL}>
      <Trans>View on GitHub</Trans>
    </a>
  </div>
);

export default GitHubRibbon;
