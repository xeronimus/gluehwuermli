import {openFileRequestsFactory} from './openFileRequests';

test('of two files before the start, the app starts with the second, once', () => {
  const requests = openFileRequestsFactory();
  requests.received('/Shows/Waldfest.glp');
  requests.received('/Shows/Fasnacht.glp');

  expect(requests.takeStartPath()).toBe('/Shows/Fasnacht.glp');
  expect(requests.takeStartPath()).toBeUndefined();
});

test('nothing received, no start path', () => {
  expect(openFileRequestsFactory().takeStartPath()).toBeUndefined();
});

test('files after the start wait for forwardTo and are opened in order', () => {
  const requests = openFileRequestsFactory();
  requests.takeStartPath();
  requests.received('/Shows/Waldfest.glp');
  requests.received('/Shows/Fasnacht.glp');
  const opened: string[] = [];

  requests.forwardTo((path) => opened.push(path));

  expect(opened).toEqual(['/Shows/Waldfest.glp', '/Shows/Fasnacht.glp']);
});

test('after forwardTo a file is opened right away and not kept for the start', () => {
  const requests = openFileRequestsFactory();
  requests.takeStartPath();
  const opened: string[] = [];
  requests.forwardTo((path) => opened.push(path));

  requests.received('/Shows/Waldfest.glp');

  expect(opened).toEqual(['/Shows/Waldfest.glp']);
  expect(requests.takeStartPath()).toBeUndefined();
});

test('forwardTo with nothing waiting opens nothing until a file arrives, then that file once', () => {
  const requests = openFileRequestsFactory();
  requests.takeStartPath();
  const opened: string[] = [];

  requests.forwardTo((path) => opened.push(path));
  expect(opened).toEqual([]);

  requests.received('/Shows/Waldfest.glp');
  expect(opened).toEqual(['/Shows/Waldfest.glp']);
});

test('only .glp files are taken, in any case', () => {
  const requests = openFileRequestsFactory();
  requests.received('/Shows/Show.GLP');
  requests.received('/Shows/notes.txt');

  expect(requests.takeStartPath()).toBe('/Shows/Show.GLP');
});
