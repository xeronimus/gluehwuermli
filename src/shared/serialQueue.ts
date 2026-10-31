export type SerialQueue = <T>(task: () => Promise<T>) => Promise<T>;

/**
 * Runs each task only once the one before it settled, so overlapping calls happen one after the other. A failed task
 * rejects its own promise and doesn't stop the next one.
 */
export function createSerialQueue(): SerialQueue {
  let previous: Promise<unknown> = Promise.resolve();

  return <T>(task: () => Promise<T>): Promise<T> => {
    const next = previous.then(task, task);
    previous = next.catch(() => undefined);
    return next;
  };
}
