import {
  LAST_BANK_START,
  bankEnd,
  bankStartFromInput,
  clampBankStart,
  isFirstBank,
  isLastBank,
  nextBankStart,
  previousBankStart
} from './channelBank';

describe('the first bank', () => {
  test('covers 1–16 and has no previous bank', () => {
    expect(bankEnd(1)).toBe(16);
    expect(isFirstBank(1)).toBe(true);
    expect(isLastBank(1)).toBe(false);
    expect(previousBankStart(1)).toBe(1);
    expect(nextBankStart(1)).toBe(17);
  });
});

describe('the last bank', () => {
  test('covers 497–512 and has no next bank', () => {
    expect(LAST_BANK_START).toBe(497);
    expect(bankEnd(LAST_BANK_START)).toBe(512);
    expect(isLastBank(LAST_BANK_START)).toBe(true);
    expect(isFirstBank(LAST_BANK_START)).toBe(false);
    expect(nextBankStart(LAST_BANK_START)).toBe(LAST_BANK_START);
    expect(previousBankStart(LAST_BANK_START)).toBe(481);
  });
});

describe('clampBankStart', () => {
  test('keeps the bank within the universe', () => {
    expect(clampBankStart(0)).toBe(1);
    expect(clampBankStart(-5)).toBe(1);
    expect(clampBankStart(505)).toBe(497);
    expect(clampBankStart(600)).toBe(497);
  });

  test('rounds to a whole channel', () => {
    expect(clampBankStart(2.6)).toBe(3);
  });
});

describe('next and previous from an unaligned start', () => {
  test('move by a bank, clamped at both ends', () => {
    expect(nextBankStart(5)).toBe(21);
    expect(previousBankStart(21)).toBe(5);
    expect(nextBankStart(490)).toBe(497);
    expect(previousBankStart(10)).toBe(1);
  });
});

describe('bankStartFromInput', () => {
  test('jumps to the typed start channel', () => {
    expect(bankStartFromInput('17', 1)).toBe(17);
    expect(bankStartFromInput(' 300 ', 1)).toBe(300);
  });

  test('clamps a start out of range', () => {
    expect(bankStartFromInput('1000', 1)).toBe(497);
    expect(bankStartFromInput('0', 33)).toBe(1);
  });

  test('a blank or non-numeric entry keeps the current start', () => {
    expect(bankStartFromInput('', 33)).toBe(33);
    expect(bankStartFromInput('abc', 33)).toBe(33);
  });
});
