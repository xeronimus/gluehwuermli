import {type ComponentType, useState} from 'react';

import {useLingui} from '@lingui/react/macro';

import Tabs, {type Tab} from '../commons/Tabs';
import {manual, manualSection} from './UserManual.css';
import {FIRST_MANUAL_TOPIC, MANUAL_TOPICS, type ManualTopicId} from './manualTopics';
import ChannelLocksTopic from './topics/ChannelLocksTopic';
import ChasesTopic from './topics/ChasesTopic';
import ConnectingTopic from './topics/ConnectingTopic';
import FindingOutTopic from './topics/FindingOutTopic';
import FixturesTopic from './topics/FixturesTopic';
import ModesTopic from './topics/ModesTopic';
import PresetsTopic from './topics/PresetsTopic';
import ProjectsTopic from './topics/ProjectsTopic';
import ScenesTopic from './topics/ScenesTopic';

const TOPIC_CONTENTS: Record<ManualTopicId, ComponentType> = {
  connecting: ConnectingTopic,
  modes: ModesTopic,
  'channel-locks': ChannelLocksTopic,
  projects: ProjectsTopic,
  fixtures: FixturesTopic,
  presets: PresetsTopic,
  scenes: ScenesTopic,
  chases: ChasesTopic,
  'finding-out': FindingOutTopic
};

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
