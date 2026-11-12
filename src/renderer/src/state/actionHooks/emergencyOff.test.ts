import {DMX_MIN_VALUE} from '@shared/dmx';

import {inMemoryDmxServiceFactory} from '@/data/service/impl/inMemory/inMemoryDmxServiceFactory';

import {type ChannelsStateSetter, getChannelsActions} from '../channels/ChannelsActions';
import {type ChannelsState, getDefaultChannelsState} from '../channels/ChannelsState';
import {type ChaseStateSetter, getChaseActions} from '../chase/ChaseActions';
import {type ChaseState, getDefaultChaseState} from '../chase/ChaseState';
import {emergencyOff} from './emergencyOff';

const storeActions = () => {
  let state: ChannelsState & ChaseState = {...getDefaultChannelsState(), ...getDefaultChaseState()};
  const set: ChannelsStateSetter & ChaseStateSetter = (partial) => {
    state = {...state, ...(typeof partial === 'function' ? partial(state) : partial)};
  };
  return {actions: {...getChannelsActions(set), ...getChaseActions(set)}, current: () => state};
};

test('clears the faders, blacks out and turns the preview on rig off', async () => {
  const service = inMemoryDmxServiceFactory();
  const {actions, current} = storeActions();
  service.setChannelValues([{channel: 5, value: 200}]);
  actions.setChannelValues([{channel: 5, value: 200}]);
  actions.setStepOnRig(true);

  emergencyOff(service, actions);

  expect(current().channelValues.every((value) => value === DMX_MIN_VALUE)).toBe(true);
  expect((await service.getChannelValues()).every((value) => value === DMX_MIN_VALUE)).toBe(true);
  expect(current().stepOnRig).toBe(false);
});
