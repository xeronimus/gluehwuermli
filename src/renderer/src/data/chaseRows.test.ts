import type {Chase, ChaseRepeat, ChaseStatus} from '@shared/ipc';

import {chaseRowControls, chaseRowState, repeatLabel, showsPass, stepBoxesFit} from './chaseRows';

const chaseOf = (id: string, repeat: ChaseRepeat, stepCount = 4): Chase => ({
  id,
  name: id,
  repeat,
  steps: Array.from({length: stepCount}, (_, index) => ({
    id: `${id}-${index}`,
    holdMs: 500,
    values: [{channel: index + 1, value: 255}]
  }))
});

const chorus = chaseOf('chorus', {type: 'times', count: 8});
const laser = chaseOf('laser', {type: 'forever'}, 6);
const colors = chaseOf('colors', {type: 'once'}, 3);
const chases = [chorus, laser, colors];

const IDLE: ChaseStatus = {type: 'idle'};
const RUNNING: ChaseStatus = {type: 'running', chaseId: 'chorus', stepIndex: 0, passIndex: 2};

test('the repeat reads 1×, N× or ∞', () => {
  expect(repeatLabel({type: 'once'})).toBe('1×');
  expect(repeatLabel({type: 'times', count: 8})).toBe('8×');
  expect(repeatLabel({type: 'forever'})).toBe('∞');
});

test('the running chase plays, counted from 1; the others are dimmed', () => {
  expect(chaseRowState(chorus, RUNNING, chases)).toEqual({
    type: 'playing',
    paused: false,
    position: {stepNumber: 1, stepCount: 4, passNumber: 3, passCount: 8}
  });
  expect(chaseRowState(laser, RUNNING, chases)).toEqual({type: 'dimmed'});
  expect(chaseRowState(colors, RUNNING, chases)).toEqual({type: 'dimmed'});
});

test('a step fading in is the current step during its fade, as main reports it', () => {
  const fading: Chase = {...chorus, steps: chorus.steps.map((step) => ({...step, fadeMs: 2000}))};
  const fadingSecondStep: ChaseStatus = {...RUNNING, stepIndex: 1};

  expect(chaseRowState(fading, fadingSecondStep, [fading])).toMatchObject({
    type: 'playing',
    position: {stepNumber: 2}
  });
});

test('a paused chase still plays, told apart from a running one', () => {
  const paused: ChaseStatus = {...RUNNING, type: 'paused'};
  expect(chaseRowState(chorus, paused, chases)).toMatchObject({type: 'playing', paused: true});
  expect(chaseRowState(laser, paused, chases)).toEqual({type: 'dimmed'});
});

test('no row plays or is dimmed while the player is idle, also after a chase finished', () => {
  chases.forEach((chase) => expect(chaseRowState(chase, IDLE, chases)).toEqual({type: 'idle'}));
});

test('a chase the project no longer lists dims no row', () => {
  const unknown: ChaseStatus = {...RUNNING, chaseId: 'gone'};
  expect(chaseRowState(chorus, unknown, chases)).toEqual({type: 'idle'});
});

test('a forever chase counts its passes without a total', () => {
  const status: ChaseStatus = {type: 'running', chaseId: 'laser', stepIndex: 5, passIndex: 41};
  expect(chaseRowState(laser, status, chases)).toMatchObject({
    position: {stepNumber: 6, stepCount: 6, passNumber: 42, passCount: Number.POSITIVE_INFINITY}
  });
});

test('Start when not playing, Pause or Resume and Stop when playing', () => {
  expect(chaseRowControls({type: 'idle'})).toEqual(['start']);
  expect(chaseRowControls({type: 'dimmed'})).toEqual(['start']);
  expect(chaseRowControls(chaseRowState(chorus, RUNNING, chases))).toEqual(['pause', 'stop']);
  expect(chaseRowControls(chaseRowState(chorus, {...RUNNING, type: 'paused'}, chases))).toEqual(['resume', 'stop']);
});

test('the pass is shown unless the chase plays once', () => {
  const position = {stepNumber: 1, stepCount: 3, passNumber: 1};
  expect(showsPass({...position, passCount: 1})).toBe(false);
  expect(showsPass({...position, passCount: 8})).toBe(true);
  expect(showsPass({...position, passCount: Number.POSITIVE_INFINITY})).toBe(true);
});

test('the step boxes fit as long as each keeps its minimum width', () => {
  // 4 boxes of 4 px and 3 gaps of 2 px
  expect(stepBoxesFit(4, 22)).toBe(true);
  expect(stepBoxesFit(4, 21)).toBe(false);
  expect(stepBoxesFit(1, 4)).toBe(true);
  expect(stepBoxesFit(100, 0)).toBe(false);
});
