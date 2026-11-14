import type {ReactNode} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

interface Feature {
  title: string;
  text: ReactNode;
}

/** what the app does, a card each */
const FeatureCards = () => {
  const {t} = useLingui();

  const features: Feature[] = [
    {
      title: t`Fixtures and presets`,
      text: (
        <Trans>
          Name your devices and their channels, give a channel a color, and set several channels at once with a preset
          button.
        </Trans>
      )
    },
    {
      title: t`Scenes`,
      text: <Trans>One button sets the channels of several fixtures at once: the whole rig in one look.</Trans>
    },
    {
      title: t`Chases`,
      text: (
        <Trans>
          Steps of channel values played one after the other, each fading in and held as long as you like; started,
          paused and stopped with a click, and synced to a tempo you tap.
        </Trans>
      )
    },
    {
      title: t`Show mode and Setup mode`,
      text: (
        <Trans>
          The app starts in Show mode: everything can be played, nothing changed. A password unlocks Setup mode.
        </Trans>
      )
    },
    {
      title: t`Channel caps`,
      text: (
        <Trans>
          A channel can be capped, e.g. a laser's, while the channel lock is on. Only the password lifts the lock.
        </Trans>
      )
    },
    {
      title: t`English and German`,
      text: <Trans>The app and its manual in English and German, switched in the Settings view.</Trans>
    }
  ];

  return (
    <section className="features" aria-label={t`Features`}>
      {features.map((feature) => (
        <article key={feature.title} className="card">
          <h2>{feature.title}</h2>
          <p>{feature.text}</p>
        </article>
      ))}
    </section>
  );
};

export default FeatureCards;
