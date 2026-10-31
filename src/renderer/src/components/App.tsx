import {useState} from 'react';

import mascot from '@resources/gluehwuermli_mascot.png';

import {app, backdrop, content} from './App.css';
import ErrorBoundary from './commons/ErrorBoundary';
import Tabs, {Tab} from './commons/Tabs';
import FaderBank from './faders/FaderBank';
import FixtureView from './fixtures/FixtureView';
import OutputBar from './output/OutputBar';
import {defaultTheme} from './themes.css';

type View = 'fixtures' | 'channels';

const VIEWS: readonly Tab<View>[] = [
  {id: 'fixtures', label: 'Fixtures'},
  // the raw channels, e.g. to find out what a new device does on which channel
  {id: 'channels', label: 'Channels'}
];

const App = () => {
  const [view, setView] = useState<View>('fixtures');

  return (
    <div className={`${defaultTheme} ${app}`}>
      <img className={backdrop} src={mascot} alt="" />
      <ErrorBoundary>
        <OutputBar />
      </ErrorBoundary>
      <Tabs tabs={VIEWS} activeId={view} onSelect={setView} />
      <main className={content}>
        <ErrorBoundary key={view}>{view === 'fixtures' ? <FixtureView /> : <FaderBank />}</ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
