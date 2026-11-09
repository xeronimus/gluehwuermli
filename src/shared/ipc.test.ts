import {DMX_UNIVERSE_SIZE} from './dmx';
import {
  PROJECT_VERSION,
  parseChannelsChanged,
  parseChaseStatus,
  parseConnectRequest,
  parseDmxOutputStatus,
  parseLiftChannelLockRequest,
  parseLockStatus,
  parseProjectPathRequest,
  parseProjectStatus,
  parseSetChannelRequest,
  parseSetChannelValuesRequest,
  parseStartChaseRequest,
  parseUniverseValues,
  parseUnlockRequest
} from './ipc';

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

describe('parseUnlockRequest', () => {
  test('accepts a password of at least 4 characters', () => {
    expect(parseUnlockRequest({password: 'abcd'})).toEqual({password: 'abcd'});
  });

  test.each([{password: 'abc'}, {password: 'x'.repeat(201)}, {password: 1234}, {}, null])('rejects %j', (payload) => {
    expect(parseUnlockRequest(payload)).toBeUndefined();
  });
});

describe('parseLiftChannelLockRequest', () => {
  test('accepts a password, or none (in Setup mode)', () => {
    expect(parseLiftChannelLockRequest({password: 'abcd'})).toEqual({password: 'abcd'});
    expect(parseLiftChannelLockRequest({})).toEqual({});
  });

  test('rejects a too short password and anything else', () => {
    expect(parseLiftChannelLockRequest({password: 'abc'})).toBeUndefined();
    expect(parseLiftChannelLockRequest({password: 1234})).toBeUndefined();
    expect(parseLiftChannelLockRequest(null)).toBeUndefined();
  });
});

describe('parseStartChaseRequest', () => {
  test('accepts an id', () => {
    expect(parseStartChaseRequest({chaseId: 'chorus'})).toEqual({chaseId: 'chorus'});
  });

  test.each([{chaseId: ''}, {chaseId: 3}, {}, null, 'chorus'])('rejects %j', (payload) => {
    expect(parseStartChaseRequest(payload)).toBeUndefined();
  });
});

describe('parseChaseStatus', () => {
  test.each([
    {type: 'idle'},
    {type: 'running', chaseId: 'chorus', stepIndex: 0, passIndex: 0},
    {type: 'paused', chaseId: 'chorus', stepIndex: 3, passIndex: 7}
  ])('accepts %j', (payload) => {
    expect(parseChaseStatus(payload)).toEqual(payload);
  });

  test.each([
    {type: 'running', chaseId: 'chorus', stepIndex: -1, passIndex: 0},
    {type: 'paused', chaseId: '', stepIndex: 0, passIndex: 0},
    {type: 'running', chaseId: 'chorus'},
    {type: 'finished'},
    null
  ])('rejects %j', (payload) => {
    expect(parseChaseStatus(payload)).toBeUndefined();
  });
});

describe('parseUniverseValues', () => {
  const universe = (value: unknown, length = DMX_UNIVERSE_SIZE) => ({values: Array<unknown>(length).fill(value)});

  test('accepts a whole universe', () => {
    const answer = universe(255);
    expect(parseUniverseValues(answer)).toEqual(answer);
  });

  test.each([
    universe(0, DMX_UNIVERSE_SIZE - 1),
    universe(0, DMX_UNIVERSE_SIZE + 1),
    universe(256),
    universe(-1),
    universe(1.5),
    {},
    null
  ])('rejects a payload that is not one', (payload) => {
    expect(parseUniverseValues(payload)).toBeUndefined();
  });
});

describe('parseChannelsChanged', () => {
  test('accepts the values of a step', () => {
    const change = {values: [{channel: 29, value: 255}]};
    expect(parseChannelsChanged(change)).toEqual(change);
  });

  test.each([{values: []}, {values: [{channel: 513, value: 0}]}, {}, null])('rejects %j', (payload) => {
    expect(parseChannelsChanged(payload)).toBeUndefined();
  });
});

describe('parseDmxOutputStatus', () => {
  test.each([
    {type: 'disconnected'},
    {type: 'connecting', path: 'COM3'},
    {type: 'connected', path: 'COM3'},
    {type: 'failed', path: 'COM3', reason: 'port-closed'},
    {type: 'failed', path: 'COM3', reason: 'port-error', message: 'Access denied'}
  ])('accepts %j', (payload) => {
    expect(parseDmxOutputStatus(payload)).toEqual(payload);
  });

  test.each([
    {type: 'connected'},
    {type: 'failed', path: 'COM3'},
    {type: 'failed', path: 'COM3', reason: 'port-error'},
    {type: 'sending', path: 'COM3'},
    null
  ])('rejects %j', (payload) => {
    expect(parseDmxOutputStatus(payload)).toBeUndefined();
  });
});

describe('parseLockStatus', () => {
  test.each([
    {mode: 'show', passwordSet: false, channelLocked: true},
    {mode: 'setup', passwordSet: true, channelLocked: false}
  ])('accepts %j', (payload) => {
    expect(parseLockStatus(payload)).toEqual(payload);
  });

  test.each([
    {mode: 'show', passwordSet: true},
    {mode: 'edit', passwordSet: true, channelLocked: true},
    {mode: 'setup', passwordSet: 'yes', channelLocked: false},
    null
  ])('rejects %j', (payload) => {
    expect(parseLockStatus(payload)).toBeUndefined();
  });
});

describe('parseProjectStatus', () => {
  const setup = {version: PROJECT_VERSION, fixtures: []};

  test.each([
    {type: 'none'},
    {type: 'open', project: {path: 'C:/shows/club.glp', setup}},
    {type: 'failed', path: 'C:/shows/club.glp', error: {reason: 'too-new', version: PROJECT_VERSION + 1}}
  ])('accepts %j', (payload) => {
    expect(parseProjectStatus(payload)).toEqual(payload);
  });

  test.each([
    {type: 'open', project: {path: 'C:/shows/club.glp'}},
    {type: 'open', project: {path: '', setup}},
    {type: 'failed', path: 'C:/shows/club.glp', error: {reason: 'unreadable'}},
    {type: 'closed'},
    null
  ])('rejects %j', (payload) => {
    expect(parseProjectStatus(payload)).toBeUndefined();
  });
});

describe('parseProjectPathRequest', () => {
  test('accepts a path', () => {
    expect(parseProjectPathRequest({path: 'C:/shows/club.glp'})).toEqual({path: 'C:/shows/club.glp'});
  });

  test.each([{path: ''}, {path: 42}, {}, null])('rejects %j', (payload) => {
    expect(parseProjectPathRequest(payload)).toBeUndefined();
  });
});
