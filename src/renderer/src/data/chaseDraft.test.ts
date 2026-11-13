import type {Chase, Fixture} from '@shared/ipc';

import {
  type ChaseDraft,
  canSaveChase,
  chaseDraftOf,
  chaseEditErrors,
  chaseOfDraft,
  fixtureChannelsAt,
  isSortedByChannel,
  newChaseDraft,
  nextFreeChannel,
  setsChannel,
  shownStepId,
  sortedByChannel,
  stepIdAfterRemoval,
  stepIdBeside,
  withChannelInAllSteps,
  withHoldOfAllSteps,
  withNewStep,
  withNewStepValue,
  withStepDuplicated,
  withStepHold,
  withStepMoved,
  withStepValueChange,
  withStepValuesSorted,
  withoutChannelInAllSteps,
  withoutStep,
  withoutStepValues
} from './chaseDraft';

const chorus: Chase = {
  id: 'chorus',
  name: 'Chorus',
  repeat: {type: 'times', count: 8},
  steps: [
    {id: 'laser', holdMs: 500, values: [{channel: 1, value: 255}]},
    {
      id: 'strobe',
      holdMs: 1250,
      values: [
        {channel: 1, value: 0},
        {channel: 20, value: 200}
      ]
    }
  ]
};

const typedChase = (draft: Partial<ChaseDraft>): ChaseDraft => ({...newChaseDraft(), name: 'Chorus', ...draft});

const stepIds = (draft: ChaseDraft) => draft.steps.map(({id}) => id);

test('a chase survives the round trip through a draft', () => {
  expect(chaseOfDraft('chorus', chaseDraftOf(chorus))).toEqual(chorus);
  const once: Chase = {...chorus, repeat: {type: 'once'}};
  const forever: Chase = {...chorus, repeat: {type: 'forever'}};
  expect(chaseOfDraft('chorus', chaseDraftOf(once))).toEqual(once);
  expect(chaseOfDraft('chorus', chaseDraftOf(forever))).toEqual(forever);
});

test('shows a hold in seconds with two decimals', () => {
  expect(chaseDraftOf(chorus).steps.map(({hold}) => hold)).toEqual(['0.50', '1.25']);
});

test('trims the name, and keeps the typed count while another repeat is chosen', () => {
  const draft = typedChase({name: ' Chorus ', repeatType: 'times', repeatCount: '5'});

  expect(chaseOfDraft('c', draft).name).toBe('Chorus');
  expect(chaseOfDraft('c', draft).repeat).toEqual({type: 'times', count: 5});
  expect(chaseOfDraft('c', {...draft, repeatType: 'forever'}).repeat).toEqual({type: 'forever'});
  expect({...draft, repeatType: 'forever'}.repeatCount).toBe('5');
});

test('the first step added holds 1 s, a later one as long as the step before it', () => {
  const first = withNewStep(newChaseDraft(), 'a');
  const second = withNewStep(withStepHold(first, 0, '0.25'), 'b');

  expect(first.steps).toEqual([{id: 'a', hold: '1.00', values: []}]);
  expect(second.steps[1]).toEqual({id: 'b', hold: '0.25', values: []});
});

test('duplicates a step with its hold and values right after it, under a new id', () => {
  const draft = withStepDuplicated(chaseDraftOf(chorus), 0, 'copy');

  expect(stepIds(draft)).toEqual(['laser', 'copy', 'strobe']);
  expect(draft.steps[1]).toEqual({...chaseDraftOf(chorus).steps[0], id: 'copy'});
  expect(withStepDuplicated(chaseDraftOf(chorus), 5, 'copy')).toEqual(chaseDraftOf(chorus));
});

test('moves a step, not past either end, and deletes one', () => {
  const draft = chaseDraftOf(chorus);

  expect(stepIds(withStepMoved(draft, 1, 'earlier'))).toEqual(['strobe', 'laser']);
  expect(stepIds(withStepMoved(draft, 1, 'later'))).toEqual(['laser', 'strobe']);
  expect(stepIds(withoutStep(draft, 0))).toEqual(['strobe']);
});

test('edits, adds and removes a step value one by one', () => {
  const draft = chaseDraftOf(chorus);

  const changed = withStepValueChange(draft, 1, 1, {value: '128'});
  expect(changed.steps[1]?.values).toEqual([
    {id: '0', channel: '1', value: '0'},
    {id: '1', channel: '20', value: '128'}
  ]);
  expect(withoutStepValues(draft, 1, [0]).steps[1]?.values).toEqual([{id: '1', channel: '20', value: '200'}]);
  expect(withoutStepValues(draft, 1, [0, 1]).steps[1]?.values).toEqual([]);
  expect(withNewStepValue(draft, 1, 'new').steps[1]?.values.at(-1)).toEqual({id: 'new', channel: '21', value: '0'});
  expect(withNewStepValue(withNewStep(newChaseDraft(), 'a'), 0, 'new').steps[0]?.values).toEqual([
    {id: 'new', channel: '1', value: '0'}
  ]);
});

const channelsOf = (draft: ChaseDraft, stepIndex: number) =>
  draft.steps[stepIndex]?.values.map(({id, channel}) => `${id}:${channel}`);

test('a typed channel stays in its row until the rows are sorted', () => {
  const draft = withStepValueChange(chaseDraftOf(chorus), 1, 0, {channel: '30'});

  expect(channelsOf(draft, 1)).toEqual(['0:30', '1:20']);
  expect(isSortedByChannel(draft.steps[1]?.values ?? [])).toBe(false);
  expect(channelsOf(withStepValuesSorted(draft, 1), 1)).toEqual(['1:20', '0:30']);
  expect(channelsOf(withStepValuesSorted(draft, 1), 0)).toEqual(['0:1']);
  expect(isSortedByChannel(chaseDraftOf(chorus).steps[1]?.values ?? [])).toBe(true);
});

test('a channel added at the end of the universe is sorted in', () => {
  const draft = withStepValueChange(chaseDraftOf(chorus), 1, 1, {channel: '512'});

  expect(channelsOf(withNewStepValue(draft, 1, 'new'), 1)).toEqual(['0:1', 'new:2', '1:512']);
});

test('a channel that is not a number sorts after the others, in its place among them', () => {
  expect(
    sortedByChannel([
      {id: 'a', channel: '', value: '0'},
      {id: 'b', channel: '9', value: '0'},
      {id: 'c', channel: 'x', value: '0'},
      {id: 'd', channel: '2', value: '0'}
    ]).map(({id}) => id)
  ).toEqual(['d', 'b', 'a', 'c']);
});

test('a channel added by hand follows the highest one, or takes the lowest free one at the end of the universe', () => {
  expect(nextFreeChannel([])).toBe(1);
  expect(
    nextFreeChannel([
      {id: 'a', channel: '7', value: '0'},
      {id: 'b', channel: '3', value: '0'}
    ])
  ).toBe(8);
  expect(nextFreeChannel([{id: 'a', channel: 'x', value: '0'}])).toBe(1);
  expect(
    nextFreeChannel([
      {id: 'a', channel: '1', value: '0'},
      {id: 'b', channel: '512', value: '0'}
    ])
  ).toBe(2);
});

describe('all steps at once', () => {
  const draft = chaseDraftOf(chorus);

  test('adds a channel at 0 to the steps without it, sorted in; a step setting it keeps its value', () => {
    const added = withChannelInAllSteps(draft, 20, (stepId) => `new-${stepId}`);

    expect(added.steps[0]?.values).toEqual([
      {id: '0', channel: '1', value: '255'},
      {id: 'new-laser', channel: '20', value: '0'}
    ]);
    expect(added.steps[1]).toBe(draft.steps[1]);
    expect(
      channelsOf(
        withChannelInAllSteps(draft, 5, (stepId) => `new-${stepId}`),
        1
      )
    ).toEqual(['0:1', 'new-strobe:5', '1:20']);
  });

  test('a typed channel with a leading zero counts as the channel', () => {
    const typed = withStepValueChange(draft, 0, 0, {channel: '020'});

    expect(setsChannel({id: 'a', hold: '1.00', values: [{id: '0', channel: '020', value: '0'}]}, 20)).toBe(true);
    expect(setsChannel({id: 'a', hold: '1.00', values: [{id: '0', channel: '', value: '0'}]}, 0)).toBe(false);
    expect(withChannelInAllSteps(typed, 20, () => 'new').steps[0]).toBe(typed.steps[0]);
  });

  test('removes a channel from every step, leaving a step without channels', () => {
    const removed = withoutChannelInAllSteps(draft, 1);

    expect(removed.steps.map(({values}) => values.map(({channel}) => channel))).toEqual([[], ['20']]);
    expect(chaseEditErrors(removed).steps[0]).toEqual([{type: 'chase-step-values-missing'}]);
    expect(withoutChannelInAllSteps(draft, 99)).toEqual(draft);
  });

  test('sets the hold of every step, with two decimals', () => {
    expect(withHoldOfAllSteps(draft, 2000).steps.map(({hold}) => hold)).toEqual(['2.00', '2.00']);
    expect(withHoldOfAllSteps(newChaseDraft(), 2000).steps).toEqual([]);
  });
});

test('a chase needs a name and a step, each step a channel', () => {
  const errors = chaseEditErrors(withNewStep(typedChase({name: ' '}), 'a'));

  expect(errors.chase).toEqual([{type: 'chase-name-missing'}]);
  expect(errors.steps).toEqual([[{type: 'chase-step-values-missing'}]]);
  expect(chaseEditErrors(typedChase({})).chase).toEqual([{type: 'chase-steps-missing'}]);
  expect(canSaveChase(chaseEditErrors(typedChase({})))).toBe(false);
  expect(canSaveChase(chaseEditErrors(chaseDraftOf(chorus)))).toBe(true);
});

test('reports a hold, a repeat count and a step value out of range, at the step they belong to', () => {
  const draft = chaseDraftOf(chorus);
  const errors = chaseEditErrors({
    ...withStepValueChange(withStepHold(draft, 1, '0.04'), 1, 0, {channel: '20'}),
    repeatCount: '100'
  });

  expect(errors.chase).toEqual([{type: 'chase-repeat-invalid'}]);
  expect(errors.steps).toEqual([
    [],
    [{type: 'chase-step-hold-invalid'}, {type: 'chase-step-channel-twice', valueIndexes: [0, 1]}]
  ]);
  expect(chaseEditErrors(withStepHold(draft, 0, '')).steps[0]).toEqual([{type: 'chase-step-hold-invalid'}]);
  expect(chaseEditErrors(withStepValueChange(draft, 0, 0, {value: '256'})).steps[0]).toEqual([
    {type: 'chase-step-value-invalid', valueIndexes: [0]}
  ]);
  expect(chaseEditErrors(withStepValueChange(draft, 0, 0, {channel: '513'})).steps[0]).toEqual([
    {type: 'chase-step-channel-invalid', valueIndexes: [0]}
  ]);
});

test('labels an address with every fixture channel on it, with its color there', () => {
  const par: Fixture = {
    id: 'par',
    name: 'PAR',
    startAddress: 10,
    channels: [
      {name: 'Red', offset: 0},
      {name: 'Green', offset: 1, color: '#00ff00'}
    ]
  };
  const wash: Fixture = {id: 'wash', name: 'Wash', startAddress: 11, channels: [{name: 'Dimmer', offset: 0}]};

  expect(fixtureChannelsAt([par, wash], '11')).toEqual([
    {fixtureName: 'PAR', channelName: 'Green', color: '#00ff00'},
    {fixtureName: 'Wash', channelName: 'Dimmer'}
  ]);
  expect(fixtureChannelsAt([par, wash], '10')).toEqual([{fixtureName: 'PAR', channelName: 'Red'}]);
  expect(fixtureChannelsAt([par, wash], '1')).toEqual([]);
  expect(fixtureChannelsAt([par, wash], '')).toEqual([]);
});

describe('the step tab shown', () => {
  const steps = chaseDraftOf(chorus).steps;

  test('the chosen step while it exists, else the first, none without steps', () => {
    expect(shownStepId(steps, 'strobe')).toBe('strobe');
    expect(shownStepId(steps, 'gone')).toBe('laser');
    expect(shownStepId(steps, undefined)).toBe('laser');
    expect(shownStepId([], 'laser')).toBeUndefined();
  });

  test('after a delete: the step after it, the one before it at the end, none for the last step left', () => {
    expect(stepIdAfterRemoval(steps, 0)).toBe('strobe');
    expect(stepIdAfterRemoval(steps, 1)).toBe('laser');
    expect(stepIdAfterRemoval(steps.slice(0, 1), 0)).toBeUndefined();
  });

  test('stepping through: the step before or after the shown one, none past either end or without one shown', () => {
    expect(stepIdBeside(steps, 'laser', 'later')).toBe('strobe');
    expect(stepIdBeside(steps, 'strobe', 'earlier')).toBe('laser');
    expect(stepIdBeside(steps, 'laser', 'earlier')).toBeUndefined();
    expect(stepIdBeside(steps, 'strobe', 'later')).toBeUndefined();
    expect(stepIdBeside(steps, undefined, 'later')).toBeUndefined();
  });
});
