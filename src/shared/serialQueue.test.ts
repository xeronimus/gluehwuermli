import {createSerialQueue} from './serialQueue';

test('a task starts only once the one before it is done', async () => {
  const run = createSerialQueue();
  const steps: string[] = [];
  let finishFirst = () => {};

  const first = run(async () => {
    steps.push('first started');
    await new Promise<void>((resolve) => {
      finishFirst = resolve;
    });
    steps.push('first done');
    return 1;
  });
  const second = run(async () => {
    steps.push('second started');
    return 2;
  });

  await Promise.resolve();
  expect(steps).toEqual(['first started']);

  finishFirst();
  expect(await Promise.all([first, second])).toEqual([1, 2]);
  expect(steps).toEqual(['first started', 'first done', 'second started']);
});

test('a failed task rejects on its own and the next one still runs', async () => {
  const run = createSerialQueue();

  const failing = run(() => Promise.reject(new Error('disk full')));
  const next = run(async () => 'stored');

  await expect(failing).rejects.toThrow('disk full');
  expect(await next).toBe('stored');
});
