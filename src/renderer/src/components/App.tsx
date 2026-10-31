import {ReactNode, useEffect, useState} from 'react';

import mascot from '@resources/gluehwuermli_mascot.png';

import {useActionLoadPorts} from '@/state/actionHooks/loadPorts';
import {useLockSubscription} from '@/state/actionHooks/lockSubscription';
import {useOutputStatusSubscription} from '@/state/actionHooks/outputStatusSubscription';
import {useUserActivityReporting} from '@/state/actionHooks/userActivity';
import {selectIsSetupMode} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import {app, backdrop, content} from './App.css';
import ErrorBoundary from './commons/ErrorBoundary';
import ModeToggle, {Mode} from './commons/ModeToggle';
import {ChannelsIcon, FixturesIcon, HelpIcon, SettingsIcon} from './commons/icons';
import FaderBank from './faders/FaderBank';
import FixtureView from './fixtures/FixtureView';
import HelpView from './help/HelpView';
import OutputBar from './output/OutputBar';
import SettingsView from './settings/SettingsView';
import {defaultTheme} from './themes.css';

type View = 'fixtures' | 'channels' | 'settings' | 'help';

/** the raw channels reach every address, the fixtures only theirs: Setup mode only */
const viewsFor = (setupMode: boolean): readonly Mode<View>[] => [
  {id: 'fixtures', label: 'Fixtures', Icon: FixturesIcon},
  // the raw channels, e.g. to find out what a new device does on which channel
  {id: 'channels', label: 'Channels', Icon: ChannelsIcon, disabled: !setupMode},
  // unlocking Setup mode and the channel lock
  {id: 'settings', label: 'Settings', Icon: SettingsIcon},
  {id: 'help', label: 'Help', Icon: HelpIcon}
];

const VIEW_CONTENT: Record<View, () => ReactNode> = {
  fixtures: () => <FixtureView />,
  channels: () => <FaderBank />,
  settings: () => <SettingsView />,
  help: () => <HelpView />
};

const App = () => {
  const [view, setView] = useState<View>('fixtures');
  const setupMode = useAppStore(selectIsSetupMode);

  // here, not in a view: the mode applies to every view, and the main process's idle timer to the whole window
  useLockSubscription();
  useUserActivityReporting();
  // the output status shows in the bar, whichever view is open
  useOutputStatusSubscription();

  const loadPorts = useActionLoadPorts();
  // the ports are external state: list them once on start, not only when Settings opens (loadPorts is a new function
  // every render)
  useEffect(() => {
    void loadPorts();
  }, []);

  // locking while on the channels falls back to the fixtures (set during render, React re-renders right away)
  if (view === 'channels' && !setupMode) {
    setView('fixtures');
  }

  return (
    <div className={`${defaultTheme} ${app}`}>
      <img className={backdrop} src={mascot} alt="" />
      <ErrorBoundary>
        <OutputBar
          viewToggle={<ModeToggle modes={viewsFor(setupMode)} activeId={view} onSelect={setView} />}
          onShowSettings={() => setView('settings')}
        />
      </ErrorBoundary>
      <main className={content}>
        <ErrorBoundary key={view}>{VIEW_CONTENT[view]()}</ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
