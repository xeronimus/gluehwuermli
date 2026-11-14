import {useLingui} from '@lingui/react/macro';

import FeatureCards from './FeatureCards';
import GitHubRibbon from './GitHubRibbon';
import Hero from './Hero';
import LanguageSwitch from './LanguageSwitch';
import Limitations from './Limitations';
import Manual from './Manual';
import PageFooter from './PageFooter';
import SafetyNote from './SafetyNote';
import Screenshots from './Screenshots';
import TestedHardware from './TestedHardware';
import {PAGE_LOCALES, type PageLocale, publishedUrlOf, rootPathOf} from './pageLocales';

interface LandingPageProps {
  page: PageLocale;
}

/**
 * the whole document of one language: what the app is, the download, the features, screenshots, the hardware, what it
 * leaves out, safety,
 * the manual
 */
const LandingPage = ({page}: LandingPageProps) => {
  const {t} = useLingui();
  const rootPath = rootPathOf(page);

  return (
    <html lang={page.locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{t`Glühwürmli – DMX lighting controller for Windows and macOS`}</title>
        <meta
          name="description"
          content={t`A DMX lighting controller for Windows and macOS, for the living room, the party and the small band.`}
        />
        <link rel="canonical" href={publishedUrlOf(page)} />
        {PAGE_LOCALES.map((other) => (
          <link key={other.locale} rel="alternate" hrefLang={other.locale} href={publishedUrlOf(other)} />
        ))}
        <link rel="icon" href={`${rootPath}favicon.ico`} sizes="any" />
        <link rel="icon" href={`${rootPath}assets/favicon-32x32.png`} type="image/png" />
        <link rel="apple-touch-icon" href={`${rootPath}assets/apple-touch-icon.png`} />
        <link rel="stylesheet" href={`${rootPath}assets/page.css`} />
      </head>
      <body>
        <GitHubRibbon />
        <header className="topBar">
          <span className="brand">Glühwürmli</span>
          <LanguageSwitch page={page} />
        </header>
        <main>
          <Hero rootPath={rootPath} />
          <FeatureCards />
          <Screenshots rootPath={rootPath} />
          <TestedHardware />
          <Limitations />
          <SafetyNote />
          <Manual />
        </main>
        <PageFooter rootPath={rootPath} />
      </body>
    </html>
  );
};

export default LandingPage;
