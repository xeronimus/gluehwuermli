import {useEffect} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {useActionLoadDataFolder, useActionOpenDataFolder} from '@/state/actionHooks/dataFolder';
import {selectIsSetupMode} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {FolderIcon} from '../commons/icons';
import {errorMessage, folderPath, message} from './DataFolderSection.css';
import {sideSection} from './HelpView.css';

/**
 * where the setup is stored, to back it up or paste in a fixture; a path to copy and, in Setup mode, a button opening
 * it
 */
const DataFolderSection = () => {
  const {t, i18n} = useLingui();
  const dataFolder = useAppStore((state) => state.dataFolder);
  const error = useAppStore((state) => state.dataFolderError);
  const setupMode = useAppStore(selectIsSetupMode);
  const loadDataFolder = useActionLoadDataFolder();
  const openDataFolder = useActionOpenDataFolder();

  // the folder is the main process's: ask once, it doesn't move while the app runs
  useEffect(() => {
    if (useAppStore.getState().dataFolder.type === 'loading') {
      void loadDataFolder();
    }
  }, []);

  return (
    <section className={sideSection}>
      <h2>
        <Trans>Data folder</Trans>
      </h2>
      <p className={message}>
        <Trans>
          The fixtures, the window position and the password hash are stored here as JSON files. Copy the folder to back
          up your setup.
        </Trans>
      </p>
      {dataFolder.type === 'loading' && (
        <span className={message}>
          <Trans>Looking up the folder…</Trans>
        </span>
      )}
      {dataFolder.type === 'failed' && <span className={errorMessage}>{i18n._(dataFolder.message)}</span>}
      {dataFolder.type === 'loaded' && (
        <>
          <input
            className={folderPath}
            readOnly
            value={dataFolder.path}
            aria-label={t`Data folder`}
            onFocus={(event) => event.currentTarget.select()}
          />
          {setupMode && (
            <Button onClick={() => void openDataFolder()}>
              <FolderIcon /> <Trans>Open in Explorer</Trans>
            </Button>
          )}
        </>
      )}
      {error && <span className={errorMessage}>{i18n._(error)}</span>}
    </section>
  );
};

export default DataFolderSection;
