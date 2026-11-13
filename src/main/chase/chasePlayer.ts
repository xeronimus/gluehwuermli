import {stepFadeMs} from '@shared/chases';
import type {Chase, ChaseStatus, SetChannelRequest} from '@shared/ipc';

import type {DmxEngine} from '@/dmx/dmxEngine';

import {type StepPosition, chasePosition, lastPosition, previousOf, stepsBetween} from './chasePosition';

export interface ChasePlayerLog {
  info: (...message: unknown[]) => void;
  warn: (...message: unknown[]) => void;
}

/** what the player is doing; step and pass are counted from 0 */
export type ChasePlayerStatus = ChaseStatus;

/**
 * Plays one chase at a time in main, next to the engine (ADR 2, doc/chases.md): a hidden window or a busy renderer
 * never delays a step. It looks at the clock on every engine tick, before the universe is sent, and writes a step's
 * values through `DmxEngine.setChannel`, so they leave in one packet and a locked channel stays at its cap. A step with
 * a fade in moves its channels on every tick in a straight line from what they held when it began to its values,
 * capped as they were then. It only touches the channels a step names, and stopping leaves every value as it is.
 */
export interface ChasePlayer {
  /** step 1, first pass; a chase already running or paused is stopped first, its values stay */
  start: (chase: Chase) => void;
  /**
   * keeps the step the clock is at (one due since the last tick is played first) and its values; nothing while no
   * chase runs
   */
  pause: () => void;
  /**
   * the same step with the fade and then the hold that was left. A channel still fading goes back onto its fade with
   * the next tick; the step's other values aren't sent again. Nothing unless paused
   */
  resume: () => void;
  /** the values stay; nothing while no chase runs */
  stop: () => void;
  status: () => ChasePlayerStatus;
  /** on start, each new step, pause, resume, stop and finish; returns the function that removes the listener */
  onStatusChanged: (listener: (status: ChasePlayerStatus) => void) => () => void;
  /**
   * the values the steps and fades of a start or a tick set, after the caps, each channel once: every value of a step
   * set at once, a faded one when it changed (also back from a fader moved by hand). Called before the status that
   * goes with them, at most once per tick. Returns the function that removes the listener
   */
  onValuesApplied: (listener: (values: readonly SetChannelRequest[]) => void) => () => void;
}

export interface ChasePlayerDependencies {
  engine: Pick<DmxEngine, 'setChannel' | 'channelValue' | 'cappedValue' | 'onTick'>;
  /** a monotonic clock in milliseconds */
  now: () => number;
  log: ChasePlayerLog;
}

/** one channel of a fading step: from what it held when the step began to the step's value, capped as it was then */
interface ChannelFade {
  readonly channel: number;
  readonly from: number;
  readonly to: number;
}

/** the channels the current step still fades; none once its fade is done, or for a step without one */
type ActiveFade = readonly ChannelFade[];

const NO_FADE: ActiveFade = [];

interface PlayingState {
  readonly chase: Chase;
  readonly position: StepPosition;
  readonly fade: ActiveFade;
}

type RunningState = {readonly type: 'running'; readonly startedAtMs: number} & PlayingState;

type PlayerState =
  {readonly type: 'idle'} | RunningState | ({readonly type: 'paused'; readonly elapsedMs: number} & PlayingState);

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

  /**
   * a listener that throws (a push to a window going away) only loses its own work: the player still moves on, rather
   * than playing the same steps again on every tick
   */
  const notify = <Payload>(listeners: ReadonlySet<(payload: Payload) => void>, payload: Payload) =>
    listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        log.warn('a chase player listener failed', error);
      }
    });

  const setState = (next: PlayerState) => {
    state = next;
    notify(statusListeners, statusOf(next));
  };

  const applyStep = (chase: Chase, stepIndex: number, applied: Set<number>) => {
    chase.steps[stepIndex]?.values.forEach(({channel, value}) => {
      engine.setChannel(channel, value);
      applied.add(channel);
    });
  };

  /**
   * the fade's values for `progress`, from the clock rather than from the last tick, so a late tick doesn't stretch it.
   * A channel counts as applied only when its value changed: a tick where nothing moved reports nothing, and a fader
   * moved by hand on a fading channel is reported back at the fade's value
   */
  const writeFade = (fade: ActiveFade, progress: number, applied: Set<number>) =>
    fade.forEach(({channel, from, to}) => {
      const before = engine.channelValue(channel);
      engine.setChannel(channel, Math.round(from + (to - from) * progress));
      if (engine.channelValue(channel) !== before) {
        applied.add(channel);
      }
    });

  /** the fade one tick further; none once it is done, its channels then at their step's values */
  const continueFade = (fade: ActiveFade, progress: number, applied: Set<number>): ActiveFade => {
    writeFade(fade, progress, applied);
    return progress >= 1 ? NO_FADE : fade;
  };

  /**
   * a new step: without a fade its values are set at once. With one, its channels are taken as they are now and the
   * targets capped as the lock caps them now, then written for the time the step has already played: a late tick
   * lands partway along the line. Lifting the lock during the fade never raises a capped channel before the next step
   */
  const beginStep = (chase: Chase, stepIndex: number, progress: number, applied: Set<number>): ActiveFade => {
    const step = chase.steps[stepIndex];
    if (step === undefined || stepFadeMs(step) === 0) {
      applyStep(chase, stepIndex, applied);
      return NO_FADE;
    }
    const fade = step.values.map(({channel, value}) => ({
      channel,
      from: engine.channelValue(channel),
      to: engine.cappedValue(channel, value)
    }));
    return continueFade(fade, progress, applied);
  };

  /** what the universe holds now, so a capped channel is reported at its cap, not at the step's value */
  const reportApplied = (applied: ReadonlySet<number>) => {
    if (applied.size === 0) {
      return;
    }
    notify(
      valuesListeners,
      Array.from(applied, (channel) => ({channel, value: engine.channelValue(channel)}))
    );
  };

  /**
   * the steps after `from` up to `to`, in order, all into the same packet. Only a stalled tick skips a step; its values
   * still land in full, fades and all, so the channels end as if every step had played and a fade's middle values are
   * never sent late. More than one pass adds nothing a pass doesn't set
   */
  const applyStepsUpTo = (chase: Chase, from: StepPosition, to: StepPosition, applied: Set<number>) => {
    const stepCount = chase.steps.length;
    const lastStepNumber = to.passIndex * stepCount + to.stepIndex;
    const stepsToApply = Math.min(stepsBetween(chase, from, to), stepCount);
    for (let stepNumber = lastStepNumber - stepsToApply + 1; stepNumber <= lastStepNumber; stepNumber++) {
      applyStep(chase, stepNumber % stepCount, applied);
    }
  };

  /** the chase on the tick: the fade moved on, the steps since the last tick played, or the chase finished */
  const advanceRunning = (running: RunningState) => {
    const {chase, startedAtMs, position, fade} = running;
    const current = chasePosition(chase, now() - startedAtMs);
    const applied = new Set<number>();
    if (current.type === 'finished') {
      continueFade(fade, 1, applied);
      applyStepsUpTo(chase, position, lastPosition(chase), applied);
      reportApplied(applied);
      log.info(`the chase ${chase.name} finished`);
      setState(IDLE);
      return;
    }
    if (stepsBetween(chase, position, current) === 0) {
      const nextFade = continueFade(fade, current.fadeProgress, applied);
      reportApplied(applied);
      // the same step: no status, a tick that only moves a fade is no news to the chase rows
      state = {...running, fade: nextFade};
      return;
    }
    // the step before ends at its values, so the new one fades from there, never from partway
    continueFade(fade, 1, applied);
    applyStepsUpTo(chase, position, previousOf(chase, current), applied);
    const nextFade = beginStep(chase, current.stepIndex, current.fadeProgress, applied);
    reportApplied(applied);
    const nextPosition = {stepIndex: current.stepIndex, passIndex: current.passIndex};
    setState({type: 'running', chase, startedAtMs, position: nextPosition, fade: nextFade});
  };

  const advance = () => {
    if (state.type === 'running') {
      advanceRunning(state);
    }
  };

  engine.onTick(advance);

  return {
    start: (chase) => {
      const applied = new Set<number>();
      // a fading step 1 starts from what the universe holds at Start
      const fade = beginStep(chase, FIRST_STEP.stepIndex, 0, applied);
      reportApplied(applied);
      log.info(`started the chase ${chase.name}`);
      setState({type: 'running', chase, startedAtMs: now(), position: FIRST_STEP, fade});
    },
    pause: () => {
      // a step whose time came since the last tick plays first: the paused step is the one the clock is at
      advance();
      if (state.type !== 'running') {
        return;
      }
      const {chase, position, fade, startedAtMs} = state;
      setState({type: 'paused', chase, elapsedMs: now() - startedAtMs, position, fade});
    },
    resume: () => {
      if (state.type !== 'paused') {
        return;
      }
      const {chase, position, fade, elapsedMs} = state;
      setState({type: 'running', chase, startedAtMs: now() - elapsedMs, position, fade});
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
