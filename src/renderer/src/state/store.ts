import {create} from 'zustand';
import {combine, devtools} from 'zustand/middleware';
import {UseBoundStore} from 'zustand/react';
import {StoreApi} from 'zustand/vanilla';

import envConfig from '../envConfig';
import {ChannelsActions, getChannelsActions} from './channels/ChannelsActions';
import {ChannelsState, getDefaultChannelsState} from './channels/ChannelsState';
import {OutputActions, getOutputActions} from './output/OutputActions';
import {OutputState, getDefaultOutputState} from './output/OutputState';

export interface AppState extends ChannelsState, OutputState {}

export interface AppActions extends ChannelsActions, OutputActions {}

export interface AppStore extends AppState, AppActions {}

const innerUseAppStore = combine(
  {
    ...getDefaultChannelsState(),
    ...getDefaultOutputState()
  },

  (set) => ({
    ...getChannelsActions(set),
    ...getOutputActions(set)
  })
);

// no logger middleware like my-life: a fader move is one action per pointer event and would flood the console
export const useAppStore: UseBoundStore<StoreApi<AppStore>> = envConfig.debug
  ? create(devtools(innerUseAppStore, {name: 'gluehwuermli'}))
  : create(innerUseAppStore);
