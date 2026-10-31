import type {DmxOutputStatus, SerialPortDescription} from '@shared/ipc';

import {OutputState} from './OutputState';

export type OutputStateSetter = (
  partial: OutputState | Partial<OutputState> | ((state: OutputState) => OutputState | Partial<OutputState>),
  replace?: false,
  action?: string
) => void;

export interface OutputActions {
  setOutputStatus: (outputStatus: DmxOutputStatus) => void;
  setAvailablePorts: (availablePorts: readonly SerialPortDescription[]) => void;
  setSelectedPortPath: (selectedPortPath: string | undefined) => void;
  setOutputError: (outputError: string | undefined) => void;
}

export const getOutputActions = (set: OutputStateSetter): OutputActions => ({
  setOutputStatus: (outputStatus) => set({outputStatus}, undefined, 'output/setOutputStatus'),
  setAvailablePorts: (availablePorts) => set({availablePorts}, undefined, 'output/setAvailablePorts'),
  setSelectedPortPath: (selectedPortPath) => set({selectedPortPath}, undefined, 'output/setSelectedPortPath'),
  setOutputError: (outputError) => set({outputError}, undefined, 'output/setOutputError')
});
