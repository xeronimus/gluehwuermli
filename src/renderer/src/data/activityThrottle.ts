/**
 * whether to report activity now: the first time, then at most once per `intervalMs`. Every pointer move would be an
 * IPC message, while the idle timer only needs a sign of life every now and then.
 */
export function createActivityThrottle(intervalMs: number, now: () => number = Date.now): () => boolean {
  let lastReportedAt: number | undefined;

  return () => {
    const current = now();
    if (lastReportedAt !== undefined && current - lastReportedAt < intervalMs) {
      return false;
    }
    lastReportedAt = current;
    return true;
  };
}
