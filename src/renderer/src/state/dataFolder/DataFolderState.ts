import type {MessageDescriptor} from '@lingui/core';

/** where the app keeps its files, as the main process reports it; `failed` when it can't be reached */
export type DataFolderPathState =
  | {readonly type: 'loading'}
  | {readonly type: 'loaded'; readonly path: string}
  | {readonly type: 'failed'; readonly message: MessageDescriptor};

export interface DataFolderState {
  dataFolder: DataFolderPathState;
  /** the last attempt to open the folder in the file explorer that failed */
  dataFolderError: MessageDescriptor | undefined;
}

export const getDefaultDataFolderState = (): DataFolderState => ({
  dataFolder: {type: 'loading'},
  dataFolderError: undefined
});
