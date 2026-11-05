import {ReactNode, useEffect, useState} from 'react';

import type {I18n} from '@lingui/core';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react/macro';

import mascot from '@assets/gluehwuermli_mascot.png';

import envConfig from '@/envConfig';
import {useActionLoadPorts} from '@/state/actionHooks/loadPorts';
import {useLockSubscription} from '@/state/actionHooks/lockSubscription';
import {useOutputStatusSubscription} from '@/state/actionHooks/outputStatusSubscription';
import {useProjectSubscription} from '@/state/actionHooks/project';
import {useUserActivityReporting} from '@/state/actionHooks/userActivity';
import {selectIsSetupMode} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import {app, backdrop, contentVariants, showViewVariants, versionLabel} from './App.css';
import ShowView from './ShowView';
import ErrorBoundary from './commons/ErrorBoundary';
import ModeToggle, {Mode} from './commons/ModeToggle';
import {ChannelsIcon, FixturesIcon, HelpIcon, SettingsIcon} from './commons/icons';
import FaderBank from './faders/FaderBank';
import HelpView from './help/HelpView';
import OutputBar from './output/OutputBar';
import ProjectSection from './project/ProjectSection';
import SettingsView from './settings/SettingsView';
import {defaultTheme} from './themes.css';

type View = 'fixtures' | 'channels' | 'settings' | 'help';

/** the views other than Show, mounted only while open */
type OtherView = Exclude<View, 'fixtures'>;

/** the raw channels reach every address, the fixtures only theirs: Setup mode only */
const viewsFor = (setupMode: boolean, i18n: I18n): readonly Mode<View>[] => [
  {id: 'fixtures', label: i18n._(msg`Show`), Icon: FixturesIcon},
  // the raw channels, e.g. to find out what a new device does on which channel
  {id: 'channels', label: i18n._(msg`Channels`), Icon: ChannelsIcon, disabled: !setupMode},
  // unlocking Setup mode and the channel lock
  {id: 'settings', label: i18n._(msg`Settings`), Icon: SettingsIcon},
  {id: 'help', label: i18n._(msg`Help`), Icon: HelpIcon}
];

const VIEW_CONTENT: Record<OtherView, () => ReactNode> = {
  channels: () => <FaderBank />,
  settings: () => <SettingsView projectSection={(className) => <ProjectSection className={className} />} />,
  help: () => <HelpView />
};

const App = () => {
  const {i18n} = useLingui();
  const [view, setView] = useState<View>('fixtures');
  const setupMode = useAppStore(selectIsSetupMode);
  const contentClass = view === 'fixtures' && setupMode ? contentVariants.inSetupMode : contentVariants.default;

  // here, not in a view: the mode applies to every view, and the main process's idle timer to the whole window
  useLockSubscription();
  useUserActivityReporting();
  // the output status shows in the bar, whichever view is open
  useOutputStatusSubscription();
  // the open project, and a .glp double-clicked while the app runs, whichever view is open
  useProjectSubscription();

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
      <span className={versionLabel}>v{envConfig.version}</span>
      <ErrorBoundary>
        <OutputBar
          viewToggle={<ModeToggle modes={viewsFor(setupMode, i18n)} activeId={view} onSelect={setView} />}
          onShowSettings={() => setView('settings')}
        />
      </ErrorBoundary>
      <main className={contentClass}>
        {/*
          The Show view stays mounted, only hidden, while another view is open: a fixture or scene editor keeps its
          draft in component state, and unmounting would drop it without a word. Kept, the draft is still there when
          the user comes back, and opening another project from Settings asks before it drops it (hasOpenDraft).
        */}
        <div className={showViewVariants[view === 'fixtures' ? 'shown' : 'hidden']}>
          <ErrorBoundary>
            <ShowView />
          </ErrorBoundary>
        </div>
        {view !== 'fixtures' && <ErrorBoundary key={view}>{VIEW_CONTENT[view]()}</ErrorBoundary>}
      </main>
    </div>
  );
};

export default App;
