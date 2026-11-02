import type {MessageDescriptor} from '@lingui/core';

import {DataFolderPathState, DataFolderState} from './DataFolderState';

export type DataFolderStateSetter = (
  partial:
    | DataFolderState
    | Partial<DataFolderState>
    | ((state: DataFolderState) => DataFolderState | Partial<DataFolderState>),
  replace?: false,
  action?: string
) => void;

export interface DataFolderActions {
  setDataFolder: (dataFolder: DataFolderPathState) => void;
  setDataFolderError: (dataFolderError: MessageDescriptor | undefined) => void;
}

export const getDataFolderActions = (set: DataFolderStateSetter): DataFolderActions => ({
  setDataFolder: (dataFolder) => set({dataFolder}, undefined, 'dataFolder/setDataFolder'),
  setDataFolderError: (dataFolderError) => set({dataFolderError}, undefined, 'dataFolder/setDataFolderError')
});
