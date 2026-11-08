import type {Chase, ChaseStatus, SetChannelRequest} from '@shared/ipc';

import type {DmxEngine} from '@/dmx/dmxEngine';

import {type StepPosition, chasePosition, lastPosition, stepsBetween} from './chasePosition';

export interface ChasePlayerLog {
  info: (...message: unknown[]) => void;
}

/** what the player is doing; step and pass are counted from 0 */
export type ChasePlayerStatus = ChaseStatus;

/**
 * Plays one chase at a time in main, next to the engine (ADR 2, doc/chases.md): a hidden window or a busy renderer
 * never delays a step. It looks at the clock on every engine tick, before the universe is sent, and writes a step's
 * values through `DmxEngine.setChannel`, so they leave in one packet and a locked channel stays at its cap. It only
 * touches the channels a step names, and stopping leaves every value as it is.
 */
export interface ChasePlayer {
  /** step 1, first pass; a chase already running or paused is stopped first, its values stay */
  start: (chase: Chase) => void;
  /** keeps the step and its values; nothing while no chase runs */
  pause: () => void;
  /** the same step with the hold that was left, without sending its values again; nothing unless paused */
  resume: () => void;
  /** the values stay; nothing while no chase runs */
  stop: () => void;
  status: () => ChasePlayerStatus;
  /** on start, each new step, pause, resume, stop and finish; returns the function that removes the listener */
  onStatusChanged: (listener: (status: ChasePlayerStatus) => void) => () => void;
  /**
   * the values the steps of a start or a tick set, after the caps, each channel once; called before the status that
   * goes with them. Returns the function that removes the listener
   */
  onValuesApplied: (listener: (values: readonly SetChannelRequest[]) => void) => () => void;
}

export interface ChasePlayerDependencies {
  engine: Pick<DmxEngine, 'setChannel' | 'channelValue' | 'onTick'>;
  /** a monotonic clock in milliseconds */
  now: () => number;
  log: ChasePlayerLog;
}

type PlayerState =
  | {readonly type: 'idle'}
  | {readonly type: 'running'; readonly chase: Chase; readonly startedAtMs: number; readonly position: StepPosition}
  | {readonly type: 'paused'; readonly chase: Chase; readonly elapsedMs: number; readonly position: StepPosition};

const IDLE: PlayerState = {type: 'idle'};
const FIRST_STEP: StepPosition = {stepIndex: 0, passIndex: 0};

const statusOf = (state: PlayerState): ChasePlayerStatus =>
  state.type === 'idle'
    ? IDLE
    : {
        type: state.type,
        chaseId: state.chase.id,
        stepIndex: state.position.stepIndex,
        passIndex: state.position.passIndex
      };

export function chasePlayerFactory({engine, now, log}: ChasePlayerDependencies): ChasePlayer {
  let state: PlayerState = IDLE;
  const statusListeners = new Set<(status: ChasePlayerStatus) => void>();
  const valuesListeners = new Set<(values: readonly SetChannelRequest[]) => void>();

  const setState = (next: PlayerState) => {
    state = next;
    const status = statusOf(next);
    statusListeners.forEach((listener) => listener(status));
  };

  const applyStep = (chase: Chase, stepIndex: number, applied: Set<number>) => {
    chase.steps[stepIndex]?.values.forEach(({channel, value}) => {
      engine.setChannel(channel, value);
      applied.add(channel);
    });
  };

  /** what the universe holds now, so a capped channel is reported at its cap, not at the step's value */
  const reportApplied = (applied: ReadonlySet<number>) => {
    if (applied.size === 0) {
      return;
    }
    const values = Array.from(applied, (channel) => ({channel, value: engine.channelValue(channel)}));
    valuesListeners.forEach((listener) => listener(values));
  };

  /**
   * the steps after `from` up to `to`, in order, all into the same packet. Only a stalled tick skips a step; its values
   * still land, so the channels end as if every step had played. More than one pass adds nothing a pass doesn't set
   */
  const applyStepsUpTo = (chase: Chase, from: StepPosition, to: StepPosition) => {
    const stepCount = chase.steps.length;
    const lastStepNumber = to.passIndex * stepCount + to.stepIndex;
    const stepsToApply = Math.min(stepsBetween(chase, from, to), stepCount);
    const applied = new Set<number>();
    for (let stepNumber = lastStepNumber - stepsToApply + 1; stepNumber <= lastStepNumber; stepNumber++) {
      applyStep(chase, stepNumber % stepCount, applied);
    }
    reportApplied(applied);
  };

  const advance = () => {
    if (state.type !== 'running') {
      return;
    }
    const {chase, startedAtMs, position} = state;
    const current = chasePosition(chase, now() - startedAtMs);
    if (current.type === 'finished') {
      applyStepsUpTo(chase, position, lastPosition(chase));
      log.info(`the chase ${chase.name} finished`);
      setState(IDLE);
      return;
    }
    if (stepsBetween(chase, position, current) === 0) {
      return;
    }
    applyStepsUpTo(chase, position, current);
    setState({type: 'running', chase, startedAtMs, position: current});
  };

  engine.onTick(advance);

  return {
    start: (chase) => {
      const applied = new Set<number>();
      applyStep(chase, FIRST_STEP.stepIndex, applied);
      reportApplied(applied);
      log.info(`started the chase ${chase.name}`);
      setState({type: 'running', chase, startedAtMs: now(), position: FIRST_STEP});
    },
    pause: () => {
      if (state.type !== 'running') {
        return;
      }
      setState({type: 'paused', chase: state.chase, elapsedMs: now() - state.startedAtMs, position: state.position});
    },
    resume: () => {
      if (state.type !== 'paused') {
        return;
      }
      setState({type: 'running', chase: state.chase, startedAtMs: now() - state.elapsedMs, position: state.position});
    },
    stop: () => {
      if (state.type === 'idle') {
        return;
      }
      log.info(`stopped the chase ${state.chase.name}`);
      setState(IDLE);
    },
    status: () => statusOf(state),
    onStatusChanged: (listener) => {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    onValuesApplied: (listener) => {
      valuesListeners.add(listener);
      return () => valuesListeners.delete(listener);
    }
  };
}
