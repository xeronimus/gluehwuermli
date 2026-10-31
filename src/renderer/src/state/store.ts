import {create} from 'zustand';
import {combine, devtools} from 'zustand/middleware';
import {UseBoundStore} from 'zustand/react';
import {StoreApi} from 'zustand/vanilla';

import envConfig from '../envConfig';
import {ChannelsActions, getChannelsActions} from './channels/ChannelsActions';
import {ChannelsState, getDefaultChannelsState} from './channels/ChannelsState';
import {DataFolderActions, getDataFolderActions} from './dataFolder/DataFolderActions';
import {DataFolderState, getDefaultDataFolderState} from './dataFolder/DataFolderState';
import {FixturesActions, getFixturesActions} from './fixtures/FixturesActions';
import {FixturesState, getDefaultFixturesState} from './fixtures/FixturesState';
import {OutputActions, getOutputActions} from './output/OutputActions';
import {OutputState, getDefaultOutputState} from './output/OutputState';

export interface AppState extends ChannelsState, OutputState, FixturesState, DataFolderState {}

export interface AppActions extends ChannelsActions, OutputActions, FixturesActions, DataFolderActions {}

export interface AppStore extends AppState, AppActions {}

const innerUseAppStore = combine(
  {
    ...getDefaultChannelsState(),
    ...getDefaultOutputState(),
    ...getDefaultFixturesState(),
    ...getDefaultDataFolderState()
  },

  (set) => ({
    ...getChannelsActions(set),
    ...getOutputActions(set),
    ...getFixturesActions(set),
    ...getDataFolderActions(set)
  })
);

// no logger middleware like my-life: a fader move is one action per pointer event and would flood the console
export const useAppStore: UseBoundStore<StoreApi<AppStore>> = envConfig.debug
  ? create(devtools(innerUseAppStore, {name: 'gluehwuermli'}))
  : create(innerUseAppStore);
