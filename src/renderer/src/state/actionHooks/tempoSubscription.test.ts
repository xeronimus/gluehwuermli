import type {TempoStatus} from '@shared/ipc';

import type TempoService from '@/data/service/TempoService';
import {inMemoryTempoServiceFactory} from '@/data/service/impl/inMemory/inMemoryTempoServiceFactory';

import {type TempoStateSetter, getTempoActions} from '../tempo/TempoActions';
import {type TempoState, getDefaultTempoState} from '../tempo/TempoState';
import {followTempo} from './tempoSubscription';

const AT_120: TempoStatus = {type: 'set', bpm: 120, beatMs: 500, sinceBeatMs: 0};

const storeActions = () => {
  let state: TempoState = getDefaultTempoState();
  const set: TempoStateSetter = (partial) => {
    state = {...state, ...(typeof partial === 'function' ? partial(state) : partial)};
  };
  return {actions: getTempoActions(set), current: () => state};
};

let nowMs: number;
const now = () => nowMs;

beforeEach(() => {
  nowMs = 1000;
});

test('no tempo until four taps, then the pushed tempo with the time it arrived', async () => {
  const service = inMemoryTempoServiceFactory(now);
  const {actions, current} = storeActions();
  followTempo(service, actions, now);
  await vi.waitFor(() => expect(current().tempoReceivedAtMs).toBe(1000));
  expect(current().tempoStatus).toEqual({type: 'none'});

  [1000, 1500, 2000, 2500].forEach((tapMs) => {
    nowMs = tapMs;
    service.tap();
  });

  expect(current().tempoStatus).toEqual(AT_120);
  expect(current().tempoReceivedAtMs).toBe(2500);
});

test('a push before the first answer is kept: the answer is older', async () => {
  let answer: (status: TempoStatus) => void = () => {};
  const listeners: ((status: TempoStatus) => void)[] = [];
  const slowService: Pick<TempoService, 'getStatus' | 'onStatusChanged'> = {
    getStatus: () => new Promise((resolve) => (answer = resolve)),
    onStatusChanged: (listener) => {
      listeners.push(listener);
      return () => {};
    }
  };
  const {actions, current} = storeActions();
  followTempo(slowService, actions, now);

  listeners.forEach((listener) => listener(AT_120));
  answer({type: 'none'});
  await Promise.resolve();

  expect(current().tempoStatus).toEqual(AT_120);
});

test('a failed read is kept as an error', async () => {
  const failingService: Pick<TempoService, 'getStatus' | 'onStatusChanged'> = {
    getStatus: async () => {
      throw new Error('no main process');
    },
    onStatusChanged: () => () => {}
  };
  const {actions, current} = storeActions();

  followTempo(failingService, actions, now);

  await vi.waitFor(() => expect(current().tempoError).toBeDefined());
  expect(current().tempoStatus).toEqual({type: 'none'});
});
