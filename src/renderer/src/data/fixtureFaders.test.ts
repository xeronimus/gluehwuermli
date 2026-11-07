import {addressRangeOf, fixtureFaders} from './fixtureFaders';

test('a fader per channel, on the start address plus the offset', () => {
  const smoke = {
    id: 'smoke',
    name: 'Smoke machine',
    startAddress: 20,
    channels: [
      {name: 'Smoke', offset: 0},
      {name: 'Fan', offset: 2}
    ]
  };

  expect(fixtureFaders(smoke)).toEqual([
    {channel: 20, label: 'Smoke'},
    {channel: 22, label: 'Fan'}
  ]);
});

test('a channel with value rules gives a fader stopping at them, the others none', () => {
  const values = {mode: 'steps', min: 0, max: 200, step: 50} as const;
  const strobe = {id: 'strobe', name: 'Strobe', startAddress: 5, channels: [{name: 'Rate', offset: 0, values}]};

  expect(fixtureFaders(strobe)).toEqual([{channel: 5, label: 'Rate', values}]);
});

test('a colored channel gives a fader in its color, the others none', () => {
  const par = {
    id: 'par',
    name: 'PAR',
    startAddress: 1,
    channels: [
      {name: 'Red', offset: 0, color: '#ff0000'},
      {name: 'Dimmer', offset: 1}
    ]
  };

  expect(fixtureFaders(par)).toEqual([
    {channel: 1, label: 'Red', color: '#ff0000'},
    {channel: 2, label: 'Dimmer'}
  ]);
});

test('the address range, or a single address for a one-channel fixture', () => {
  const par = {id: 'par', name: 'PAR', startAddress: 10, channels: [{name: 'Blue', offset: 2}]};
  const smoke = {id: 'smoke', name: 'Smoke', startAddress: 12, channels: [{name: 'Smoke', offset: 0}]};

  expect(addressRangeOf(par)).toBe('10–12');
  expect(addressRangeOf(smoke)).toBe('12');
});
