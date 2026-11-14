import {CHASE_SPEED_DEFAULT, type ChaseStatus, type ChaseSyncSetting, type ChaseSyncStatus} from '@shared/ipc';

import type ChaseService from '@/data/service/ChaseService';

const IDLE: ChaseStatus = {type: 'idle'};

/** a ChaseService that can push a status like main does on a step or a finish */
export interface InMemoryChaseService extends ChaseService {
  pushStatus: (status: ChaseStatus) => void;
}

/**
 * a ChaseService without the main process: the renderer opened in a plain browser, or a test. It knows no chases, so a
 * started one stays at its first step and sets no values. Sync and speed are kept per chase, also without a tempo
 */
export function inMemoryChaseServiceFactory(): InMemoryChaseService {
  const listeners = new Set<(status: ChaseStatus) => void>();
  let status: ChaseStatus = IDLE;
  const syncListeners = new Set<(status: ChaseSyncStatus) => void>();
  let syncSettings: readonly ChaseSyncSetting[] = [];

  const syncSettingOf = (chaseId: string) => {
    const {synced, speed} = syncSettings.find((setting) => setting.chaseId === chaseId) ?? {
      synced: false,
      speed: CHASE_SPEED_DEFAULT
    };
    return {synced, speed};
  };

  const changeSync = (chaseId: string, change: Partial<Omit<ChaseSyncSetting, 'chaseId'>>): ChaseSyncStatus => {
    const setting = {chaseId, ...syncSettingOf(chaseId), ...change};
    const others = syncSettings.filter((other) => other.chaseId !== chaseId);
    const isDefault = !setting.synced && setting.speed === CHASE_SPEED_DEFAULT;
    syncSettings = isDefault ? others : [...others, setting];
    const syncStatus = {chases: [...syncSettings]};
    syncListeners.forEach((listener) => listener(syncStatus));
    if (status.type !== 'idle' && status.chaseId === chaseId) {
      setStatus({...status, synced: setting.synced, speed: setting.speed});
    }
    return syncStatus;
  };

  const setStatus = (next: ChaseStatus) => {
    status = next;
    listeners.forEach((listener) => listener(next));
    return next;
  };

  return {
    getStatus: async () => status,
    start: async (chaseId) =>
      setStatus({type: 'running', chaseId, stepIndex: 0, passIndex: 0, ...syncSettingOf(chaseId)}),
    pause: async () => (status.type === 'running' ? setStatus({...status, type: 'paused'}) : status),
    resume: async () => (status.type === 'paused' ? setStatus({...status, type: 'running'}) : status),
    stop: async () => (status.type === 'idle' ? status : setStatus(IDLE)),
    onStatusChanged: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    pushStatus: (next) => {
      setStatus(next);
    },
    getSync: async () => ({chases: [...syncSettings]}),
    setSync: async (chaseId, synced) => changeSync(chaseId, {synced}),
    setSpeed: async (chaseId, speed) => changeSync(chaseId, {speed}),
    onSyncChanged: (listener) => {
      syncListeners.add(listener);
      return () => {
        syncListeners.delete(listener);
      };
    }
  };
}
