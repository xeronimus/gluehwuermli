import type {MessageDescriptor} from '@lingui/core';

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
  /** a port chosen by hand: selected, and preferred over the remembered port from then on */
  choosePortPath: (chosenPortPath: string | undefined) => void;
  setBlackoutOnQuit: (blackoutOnQuit: boolean) => void;
  setOutputError: (outputError: MessageDescriptor | undefined) => void;
}

export const getOutputActions = (set: OutputStateSetter): OutputActions => ({
  setOutputStatus: (outputStatus) => set({outputStatus}, undefined, 'output/setOutputStatus'),
  setAvailablePorts: (availablePorts) => set({availablePorts}, undefined, 'output/setAvailablePorts'),
  setSelectedPortPath: (selectedPortPath) => set({selectedPortPath}, undefined, 'output/setSelectedPortPath'),
  choosePortPath: (chosenPortPath) =>
    set({chosenPortPath, selectedPortPath: chosenPortPath}, undefined, 'output/choosePortPath'),
  setBlackoutOnQuit: (blackoutOnQuit) => set({blackoutOnQuit}, undefined, 'output/setBlackoutOnQuit'),
  setOutputError: (outputError) => set({outputError}, undefined, 'output/setOutputError')
});
