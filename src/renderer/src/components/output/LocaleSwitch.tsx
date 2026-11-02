import {useLingui} from '@lingui/react/macro';

import type {Locale} from '@shared/ipc';

import {LOCALES, LOCALE_LABELS, isLocale} from '@/i18n/i18n';
import {useActionChangeLocale} from '@/state/actionHooks/locale';

import ModeToggle, {Mode} from '../commons/ModeToggle';

const LOCALE_MODES: readonly Mode<Locale>[] = LOCALES.map((locale) => ({id: locale, label: LOCALE_LABELS[locale]}));

/** the language of the UI, switched without a reload; allowed in Show mode too, it changes nothing that is sent */
const LocaleSwitch = () => {
  const {i18n} = useLingui();
  const changeLocale = useActionChangeLocale();
  const activeLocale = isLocale(i18n.locale) ? i18n.locale : undefined;
  if (!activeLocale) {
    return null;
  }

  return <ModeToggle modes={LOCALE_MODES} activeId={activeLocale} onSelect={(locale) => void changeLocale(locale)} />;
};

export default LocaleSwitch;
