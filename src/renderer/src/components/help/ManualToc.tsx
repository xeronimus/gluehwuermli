import {Trans, useLingui} from '@lingui/react/macro';

import {tocEntry, tocList, tocNav} from './ManualToc.css';
import {MANUAL_TOPICS, type ManualTopicId, topicElementId} from './manualTopics';

/**
 * the manual's topics, left of it; a click scrolls to one. Buttons, not `#` links: the window must not navigate, not
 * even within its page
 */
const ManualToc = () => {
  const {t, i18n} = useLingui();
  const scrollTo = (id: ManualTopicId) =>
    document.getElementById(topicElementId(id))?.scrollIntoView({behavior: 'smooth', block: 'start'});

  return (
    <nav className={tocNav} aria-label={t`Contents of the manual`}>
      <h2>
        <Trans>Contents</Trans>
      </h2>
      <ul className={tocList}>
        {MANUAL_TOPICS.map((topic) => (
          <li key={topic.id}>
            <button type="button" className={tocEntry} onClick={() => scrollTo(topic.id)}>
              {i18n._(topic.title)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default ManualToc;
