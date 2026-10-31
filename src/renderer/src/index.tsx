import ReactDOM from 'react-dom/client';

import 'normalize.css';

import App from './components/App';
import './components/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('index.html has no #root element');
}

ReactDOM.createRoot(rootElement).render(<App />);
