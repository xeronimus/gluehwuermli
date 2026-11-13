import {useState} from 'react';

import {useLingui} from '@lingui/react/macro';

import Tabs, {type Tab} from '../commons/Tabs';
import {manual, manualSection} from './UserManual.css';
import {FIRST_MANUAL_TOPIC, MANUAL_TOPICS, type ManualTopicId} from './manualTopics';
import {TOPIC_CONTENTS} from './topics/topicContents';

/**
 * how to use the app, from plugging in the DMX interface to finding out what a device does; a tab per topic, labelled
 * short, its panel headed by the topic's full title
 */
const UserManual = () => {
  const {t, i18n} = useLingui();
  const [activeTopic, setActiveTopic] = useState<ManualTopicId>(FIRST_MANUAL_TOPIC);

  const tabs: Tab<ManualTopicId>[] = MANUAL_TOPICS.map((topic) => {
    const Content = TOPIC_CONTENTS[topic.id];
    return {
      id: topic.id,
      label: i18n._(topic.tabLabel),
      panel: (
        <section className={manualSection}>
          <h2>{i18n._(topic.title)}</h2>
          <Content />
        </section>
      )
    };
  });

  return (
    <article className={manual}>
      <Tabs label={t`Manual`} tabs={tabs} activeId={activeTopic} onSelect={setActiveTopic} />
    </article>
  );
};

export default UserManual;
