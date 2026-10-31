import {parseConnectRequest, parseSetChannelRequest, parseSetChannelValuesRequest} from './ipc';

describe('parseSetChannelRequest', () => {
  test('accepts the first and last channel with the lowest and highest value', () => {
    expect(parseSetChannelRequest({channel: 1, value: 0})).toEqual({channel: 1, value: 0});
    expect(parseSetChannelRequest({channel: 512, value: 255})).toEqual({channel: 512, value: 255});
  });

  test.each([
    {channel: 0, value: 10},
    {channel: 513, value: 10},
    {channel: 1, value: 256},
    {channel: 1, value: -1},
    {channel: 1, value: 12.5},
    {channel: '1', value: 10},
    {channel: 1},
    null,
    'dmx'
  ])('rejects %j', (payload) => {
    expect(parseSetChannelRequest(payload)).toBeUndefined();
  });
});

describe('parseConnectRequest', () => {
  test('accepts a port path', () => {
    expect(parseConnectRequest({path: 'COM3'})).toEqual({path: 'COM3'});
  });

  test('rejects an empty or missing path', () => {
    expect(parseConnectRequest({path: ''})).toBeUndefined();
    expect(parseConnectRequest({})).toBeUndefined();
  });
});

describe('parseSetChannelValuesRequest', () => {
  test('accepts several channels', () => {
    const request = {
      values: [
        {channel: 1, value: 0},
        {channel: 512, value: 255}
      ]
    };

    expect(parseSetChannelValuesRequest(request)).toEqual(request);
  });

  test.each([
    {values: []},
    {values: [{channel: 0, value: 10}]},
    {values: [{channel: 1, value: 256}]},
    {values: Array.from({length: 513}, () => ({channel: 1, value: 0}))},
    {},
    null
  ])('rejects %j', (payload) => {
    expect(parseSetChannelValuesRequest(payload)).toBeUndefined();
  });
});
