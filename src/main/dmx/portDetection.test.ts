import {isLikelyEnttecPro} from './portDetection';

test('the FTDI ids of the Pro are recognized, in any case', () => {
  expect(isLikelyEnttecPro({vendorId: '0403', productId: '6001'})).toBe(true);
  expect(isLikelyEnttecPro({vendorId: '0403', productId: '6001'.toUpperCase()})).toBe(true);
});

test('other or missing ids are not', () => {
  expect(isLikelyEnttecPro({vendorId: '0403', productId: '6015'})).toBe(false);
  expect(isLikelyEnttecPro({vendorId: '2341', productId: '0043'})).toBe(false);
  expect(isLikelyEnttecPro({})).toBe(false);
});
