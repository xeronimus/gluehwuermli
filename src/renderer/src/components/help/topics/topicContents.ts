import type {ComponentType} from 'react';

import type {ManualTopicId} from '../manualTopics';
import ChannelLocksTopic from './ChannelLocksTopic';
import ChasesTopic from './ChasesTopic';
import ConnectingTopic from './ConnectingTopic';
import FindingOutTopic from './FindingOutTopic';
import FixturesTopic from './FixturesTopic';
import ModesTopic from './ModesTopic';
import PresetsTopic from './PresetsTopic';
import ProjectsTopic from './ProjectsTopic';
import ScenesTopic from './ScenesTopic';

/** the text of each manual topic; the Help view shows them as tabs, the landing page one after the other */
export const TOPIC_CONTENTS: Record<ManualTopicId, ComponentType> = {
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
