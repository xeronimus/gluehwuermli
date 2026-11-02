import ReactDOM from 'react-dom/client';

import {I18nProvider} from '@lingui/react';
import 'normalize.css';

import App from './components/App';
import './components/global.css';
import {i18n} from './i18n/i18n';
import {activateStartLocale} from './state/actionHooks/locale';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('index.html has no #root element');
}

// the catalog first: the app's first render is already in the right language
void activateStartLocale().then(() =>
  ReactDOM.createRoot(rootElement).render(
    <I18nProvider i18n={i18n}>
      <App />
    </I18nProvider>
  )
);
