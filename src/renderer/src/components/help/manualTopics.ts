import {msg} from '@lingui/core/macro';

/** the manual's topics in order: a short label for its tab, and the title its panel starts with */
export const MANUAL_TOPICS = [
  {id: 'connecting', tabLabel: msg`Connecting`, title: msg`Connecting the DMX interface`},
  {id: 'modes', tabLabel: msg`Modes`, title: msg`Show mode and Setup mode`},
  {id: 'channel-locks', tabLabel: msg`Channel locks`, title: msg`Channel locks`},
  {id: 'projects', tabLabel: msg`Projects`, title: msg`Projects`},
  {id: 'fixtures', tabLabel: msg`Fixtures`, title: msg`Setting up a fixture`},
  {id: 'presets', tabLabel: msg`Presets`, title: msg`Presets`},
  {id: 'scenes', tabLabel: msg`Scenes`, title: msg`Scenes`},
  {id: 'chases', tabLabel: msg`Chases`, title: msg`Chases`},
  {id: 'finding-out', tabLabel: msg`Exploring`, title: msg`Finding out what a device does`}
] as const;

export type ManualTopicId = (typeof MANUAL_TOPICS)[number]['id'];

/** the topic shown when the Help view opens */
export const FIRST_MANUAL_TOPIC: ManualTopicId = 'connecting';
