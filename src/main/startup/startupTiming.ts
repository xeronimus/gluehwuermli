/** a step of the start-up, in the order they happen (issue #101) */
export type StartupMilestone =
  'main-entered' | 'app-ready' | 'project-started' | 'window-created' | 'page-loaded' | 'window-shown';

export interface StartupTiming {
  mark(milestone: StartupMilestone): void;
  /** every milestone reached so far with its seconds since the process started, e.g. `app-ready 0.52 s` */
  summary(): string;
}

const DECIMALS = 2;

/** `secondsSinceProcessStart` is `process.uptime()`: it also counts the time before the main module runs */
export function startupTimingFactory(secondsSinceProcessStart: () => number): StartupTiming {
  const reached: {milestone: StartupMilestone; seconds: number}[] = [];

  return {
    mark: (milestone) => {
      reached.push({milestone, seconds: secondsSinceProcessStart()});
    },
    summary: () => reached.map(({milestone, seconds}) => `${milestone} ${seconds.toFixed(DECIMALS)} s`).join(', ')
  };
}
