import {useLingui} from '@lingui/react/macro';

import {PAGE_LOCALES, type PageLocale, relativeLink} from './pageLocales';

interface LanguageSwitchProps {
  page: PageLocale;
}

/** a link to the same page in every language, each named in its own language */
const LanguageSwitch = ({page}: LanguageSwitchProps) => {
  const {t} = useLingui();

  return (
    <nav className="languageSwitch" aria-label={t`Language`}>
      {PAGE_LOCALES.map((other) => (
        <a
          key={other.locale}
          href={relativeLink(page, other)}
          hrefLang={other.locale}
          lang={other.locale}
          aria-current={other.locale === page.locale ? 'page' : undefined}
        >
          {other.label}
        </a>
      ))}
    </nav>
  );
};

export default LanguageSwitch;
