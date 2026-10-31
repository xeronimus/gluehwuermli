import {fixtureFaders} from './fixtureFaders';

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
