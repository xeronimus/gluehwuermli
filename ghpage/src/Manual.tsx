import {Trans, useLingui} from '@lingui/react/macro';

import {MANUAL_TOPICS} from '../../src/renderer/src/components/help/manualTopics';
import {TOPIC_CONTENTS} from '../../src/renderer/src/components/help/topics/topicContents';

/** the app's manual, the same topics as its Help view, one after the other below a table of contents */
const Manual = () => {
  const {i18n} = useLingui();

  return (
    <section className="section manual" id="manual">
      <h2>
        <Trans>User manual</Trans>
      </h2>
      <nav className="contents">
        <ol>
          {MANUAL_TOPICS.map((topic) => (
            <li key={topic.id}>
              <a href={`#${topic.id}`}>{i18n._(topic.title)}</a>
            </li>
          ))}
        </ol>
      </nav>
      {MANUAL_TOPICS.map((topic) => {
        const Content = TOPIC_CONTENTS[topic.id];
        return (
          <section key={topic.id} id={topic.id} className="manualTopic">
            <h3>{i18n._(topic.title)}</h3>
            <Content />
          </section>
        );
      })}
    </section>
  );
};

export default Manual;
