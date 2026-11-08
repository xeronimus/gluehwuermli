import {msg} from '@lingui/core/macro';

/** the manual's topics in order: their headings, and the table of contents next to them */
export const MANUAL_TOPICS = [
  {id: 'connecting', title: msg`Connecting the DMX interface`},
  {id: 'modes', title: msg`Show mode and Setup mode`},
  {id: 'channel-locks', title: msg`Channel locks`},
  {id: 'projects', title: msg`Projects`},
  {id: 'fixtures', title: msg`Setting up a fixture`},
  {id: 'presets', title: msg`Presets`},
  {id: 'scenes', title: msg`Scenes`},
  {id: 'finding-out', title: msg`Finding out what a device does`}
] as const;

export type ManualTopicId = (typeof MANUAL_TOPICS)[number]['id'];

/** the element id of a topic's section, prefixed so it can't clash with another view's */
export const topicElementId = (id: ManualTopicId): string => `manual-${id}`;
