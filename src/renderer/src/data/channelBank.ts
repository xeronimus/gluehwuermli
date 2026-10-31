import {FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from '@shared/dmx';

/** the Channels tab shows this many consecutive channels at a time, from any start channel */
export const CHANNEL_BANK_SIZE = 16;

/** the highest start that still fits a full bank, so the last bank ends exactly at LAST_DMX_CHANNEL */
export const LAST_BANK_START = LAST_DMX_CHANNEL - CHANNEL_BANK_SIZE + 1;

export const clampBankStart = (channel: number): number =>
  Math.min(LAST_BANK_START, Math.max(FIRST_DMX_CHANNEL, Math.round(channel)));

export const nextBankStart = (start: number): number => clampBankStart(start + CHANNEL_BANK_SIZE);

export const previousBankStart = (start: number): number => clampBankStart(start - CHANNEL_BANK_SIZE);

export const bankEnd = (start: number): number => start + CHANNEL_BANK_SIZE - 1;

export const isFirstBank = (start: number): boolean => start <= FIRST_DMX_CHANNEL;

export const isLastBank = (start: number): boolean => start >= LAST_BANK_START;

/** the start typed into the jump field; a blank or non-numeric entry keeps `current` */
export const bankStartFromInput = (text: string, current: number): number => {
  const channel = Number(text);
  return text.trim() === '' || !Number.isFinite(channel) ? current : clampBankStart(channel);
};
