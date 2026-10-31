import {useState} from 'react';

import mascot from '@resources/gluehwuermli_mascot.png';

import {app, backdrop, content} from './App.css';
import ErrorBoundary from './commons/ErrorBoundary';
import ModeToggle, {Mode} from './commons/ModeToggle';
import {ChannelsIcon, FixturesIcon} from './commons/icons';
import FaderBank from './faders/FaderBank';
import FixtureView from './fixtures/FixtureView';
import OutputBar from './output/OutputBar';
import {defaultTheme} from './themes.css';

type View = 'fixtures' | 'channels';

const VIEWS: readonly Mode<View>[] = [
  {id: 'fixtures', label: 'Fixtures', Icon: FixturesIcon},
  // the raw channels, e.g. to find out what a new device does on which channel
  {id: 'channels', label: 'Channels', Icon: ChannelsIcon}
];

const App = () => {
  const [view, setView] = useState<View>('fixtures');

  return (
    <div className={`${defaultTheme} ${app}`}>
      <img className={backdrop} src={mascot} alt="" />
      <ErrorBoundary>
        <OutputBar viewToggle={<ModeToggle modes={VIEWS} activeId={view} onSelect={setView} />} />
      </ErrorBoundary>
      <main className={content}>
        <ErrorBoundary key={view}>{view === 'fixtures' ? <FixtureView /> : <FaderBank />}</ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
