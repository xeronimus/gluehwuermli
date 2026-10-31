import {app, content} from './App.css';
import ErrorBoundary from './commons/ErrorBoundary';
import FaderBank from './faders/FaderBank';
import OutputBar from './output/OutputBar';
import {defaultTheme} from './themes.css';

const App = () => (
  <div className={`${defaultTheme} ${app}`}>
    <ErrorBoundary>
      <OutputBar />
    </ErrorBoundary>
    <main className={content}>
      <ErrorBoundary>
        <FaderBank />
      </ErrorBoundary>
    </main>
  </div>
);

export default App;
